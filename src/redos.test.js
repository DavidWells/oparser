// Adversarial attribute strings for the parser's regexes: unclosed/near-miss/
// storm inputs must parse fast, guarding against future ReDoS regressions.
// Audited 2026-07-16: all flat (bounded/lazy patterns already in place).
const { test } = require('uvu')
const assert = require('uvu/assert')
const { parse } = require('./index')

const N = 96
const BUDGET_MS = 1000

const ATTACKS = {
  'unclosed double quote + escape storm': 'foo="' + '\\a'.repeat(N) + ' bar=1',
  'unclosed single quote + escape storm': "foo='" + "\\'x".repeat(N) + ' bar=1',
  'unclosed backtick value': 'foo=`' + 'x '.repeat(N) + ' bar=1',
  'unclosed brace text': 'foo={' + 'a b '.repeat(N),
  'unclosed brace with inner pairs': 'foo={' + '{a}'.repeat(N) + ' x',
  'array comma storm unclosed': 'arr=[a' + ','.repeat(N) + ' x',
  'array trailing commas': 'arr=[1,2' + ', '.repeat(N) + '] next=1',
  'object comma storm': 'o={a:1' + ','.repeat(N) + '} b=2',
  'object trailing commas + ws': 'o={a:1' + ', '.repeat(N) + '}',

  /* The storms above are all UNCLOSED, so they fail isArrayLike/isObjectLike and never reach the
     `cleanLines` pass (convert.js). The trailing-comma cleanup regexes there — TRAILING_ARRAY_COMMAS
     and TRIM_INNER_TRAILING_OBJECT_COMMA — were written `(?:,+[^\S]*)+?` / `(,+[^\S]*)*?`: a `,+`
     nested inside an outer quantifier is the classic (a+)+ that partitions a comma run exponentially.
     Only a CLOSED array (`a=[,,,]`) or a comma-only line of a multiline object reaches it — closed so
     it parses as a collection, comma-only so the closer the regex needs is far away. Measured pre-fix:
     n=40 already hangs past 5s; single-line `a={,,,}` does NOT (the same-line `}` ends the search). */
  'closed array pure comma storm': 'a=[' + ','.repeat(N) + ']',
  'closed array trailing commas': 'a=[1,2' + ','.repeat(N) + ']',
  'multiline object comma-only line': 'a={x:1\n' + ','.repeat(N) + '\ny:2}',
  'multiline array comma-only line': 'a=[1\n' + ','.repeat(N) + '\n2]',
  'arrow fn giant args': 'fn=(' + 'a,'.repeat(N * 20) + ') => { x }',
  'arrow fn unclosed body': 'fn=() => {' + 'a b '.repeat(N),
  'many attrs last malformed': 'a=1 '.repeat(N) + 'bad="',
  'deep nested arrays': 'a=' + '['.repeat(500) + '1' + ']'.repeat(499) + ' b=2',
  'deep nested objects unclosed': 'a={' + 'x:{'.repeat(500) + '1' + '}'.repeat(500) + ' bad',
  'quote-pairs invert storm': "a='" + "x\\'".repeat(500) + ' y',

  /* Plain-space runs inside quoted values. The 2026-07-16 audit concluded "no vulnerabilities"
     but every case above storms escapes, commas or braces — none used a run of ordinary spaces,
     which is the one thing the whitespace-fixup regexes key on. They were written
     `((__SPACE__|\s)+)+`: a nested quantifier over a run it can partition exponentially many
     ways, so a failing match backtracked ~16x per 4 extra spaces. Measured before the fix:
     28 spaces = 7.6s through the renderer, 32 spaces did not finish.
     Reachable from ordinary markdown — `<div title="a    b">` — so this is a render-path DoS,
     not just a parser curiosity. */
  'space run inside double quotes': 'title="a' + ' '.repeat(N) + 'b"',
  'space run inside single quotes': "title='a" + ' '.repeat(N) + "b'",
  'space run + unbalanced double quote': 'title="a b" alt="unclosed' + ' '.repeat(N),
  'space run + unbalanced single quote': "title='a b' alt='unclosed" + ' '.repeat(N),
  'space run then trailing quote': 'title="a b' + ' '.repeat(N) + '"',
  'alternating space and sentinel-ish text': 'title="' + 'a '.repeat(N) + '"',
  'space run with no closing tag context': 'a="x' + ' '.repeat(N) + 'y" b="p' + ' '.repeat(N) + 'q"',
}

for (const [name, input] of Object.entries(ATTACKS)) {
  test(`redos: ${name}`, () => {
    const start = Date.now()
    parse(input)
    const elapsed = Date.now() - start
    assert.ok(elapsed < BUDGET_MS, `${name} took ${elapsed}ms (budget ${BUDGET_MS}ms)`)
  })
}

/*
 * A fixed-size budget catches exponential blowup but sails past polynomial blowup, so these assert
 * SCALING: a quadratic regression fails here even though it terminates.
 *
 * HONEST LIMIT, worth knowing before trusting this section: these do NOT reproduce the O(n^2)
 * whitespace-regex bug that motivated them. That one only surfaces through the way micro-mdx-parser
 * feeds this parser (41s at n=800 through that path; ~1ms calling parse() directly with what looked
 * like the same string). Direct parse() calls are fast on both the pre- and post-fix source, so
 * these cases would not have caught it. The regression net that DOES catch it lives in the
 * consuming repo, where micro-mdx is present. Keep these as general scaling guards; do not read a
 * green run here as proof that the whitespace fixups are linear in production use.
 */
const SCALE_SIZES = [200, 800]
const SCALE_BUDGET_MS = 400

const SCALING = {
  'space run in double quotes': (n) => `title="a${' '.repeat(n)}b"`,
  'space run in single quotes': (n) => `title='a${' '.repeat(n)}b'`,
  'unbalanced double + spaces': (n) => `title="a b" alt="unclosed${' '.repeat(n)}`,
  'unbalanced single + spaces': (n) => `title='a b' alt='unclosed${' '.repeat(n)}`,
  'sentinel-adjacent run': (n) => `a="${'x '.repeat(n)}"`,
}

for (const [name, make] of Object.entries(SCALING)) {
  for (const size of SCALE_SIZES) {
    test(`redos scaling: ${name} n=${size}`, () => {
      const start = Date.now()
      parse(make(size))
      const elapsed = Date.now() - start
      assert.ok(elapsed < SCALE_BUDGET_MS, `${name} n=${size} took ${elapsed}ms (budget ${SCALE_BUDGET_MS}ms)`)
    })
  }
}

/*
 * Multiline attribute strings take a separate code path (the `isMultiline` branch), whose
 * unbalanced-quote fixups pair an O(n) lookahead with `(\s*\n\s*)`. That whitespace group is
 * ambiguous over a run like "\n \n \n ": any of the newlines can be the `\n`, and the whitespace
 * on either side splits many ways — so every failed attempt re-pays for the lookahead. Cubic in
 * practice: n=400 99ms, n=800 713ms, n=1600 5434ms (~7.5x per doubling).
 *
 * `([^\S\n]*\n\s*)` matches exactly the same language — whitespace containing at least one
 * newline — but deterministically: the leading class cannot cross a newline, so the first `\n`
 * is forced. Same n=1600: 62ms.
 *
 * These sizes are chosen to sit far below the old curve and far above the new one, so the test
 * fails loudly if the ambiguity is reintroduced rather than merely getting slower.
 */
const MULTILINE_SIZES = [400, 1600]
const MULTILINE_BUDGET_MS = 500

const MULTILINE = {
  'newline runs between quoted attrs': (n) => ` a="x"${'\n '.repeat(n)}b="y"`,
  'newline runs, single quotes': (n) => ` a='x'${'\n '.repeat(n)}b='y'`,
  'newline runs with tabs': (n) => ` a="x"${'\n\t'.repeat(n)}b="y"`,
  'trailing newline run': (n) => ` a="x"${'\n '.repeat(n)}`,
}

for (const [name, make] of Object.entries(MULTILINE)) {
  for (const size of MULTILINE_SIZES) {
    test(`redos multiline: ${name} n=${size}`, () => {
      const start = Date.now()
      parse(make(size))
      const elapsed = Date.now() - start
      assert.ok(elapsed < MULTILINE_BUDGET_MS, `${name} n=${size} took ${elapsed}ms (budget ${MULTILINE_BUDGET_MS}ms)`)
    })
  }
}

test.run()
