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
  'arrow fn giant args': 'fn=(' + 'a,'.repeat(N * 20) + ') => { x }',
  'arrow fn unclosed body': 'fn=() => {' + 'a b '.repeat(N),
  'many attrs last malformed': 'a=1 '.repeat(N) + 'bad="',
  'deep nested arrays': 'a=' + '['.repeat(500) + '1' + ']'.repeat(499) + ' b=2',
  'deep nested objects unclosed': 'a={' + 'x:{'.repeat(500) + '1' + '}'.repeat(500) + ' bad',
  'quote-pairs invert storm': "a='" + "x\\'".repeat(500) + ' y',
}

for (const [name, input] of Object.entries(ATTACKS)) {
  test(`redos: ${name}`, () => {
    const start = Date.now()
    parse(input)
    const elapsed = Date.now() - start
    assert.ok(elapsed < BUDGET_MS, `${name} took ${elapsed}ms (budget ${BUDGET_MS}ms)`)
  })
}

test.run()
