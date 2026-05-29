# oparser

[![npm version](https://img.shields.io/npm/v/oparser.svg)](https://www.npmjs.com/package/oparser)
[![license](https://img.shields.io/npm/l/oparser.svg)](https://github.com/DavidWells/oparser/blob/master/LICENSE)

A very forgiving key-value option parser for turning loose strings into usable JavaScript objects.

`oparser` is useful when input looks like CLI flags, JSX props, `.env` snippets, CMS config, or hand-written key/value text, but is not strict JSON.

```bash
npm install oparser
```

```js
const { parse } = require('oparser')

parse(`
  width={999}
  enabled=TRUE
  title="Hello world"
  tags=[one, "two, too", "three]still text"]
  style={{ color: 'red', label: "b{c}" }}
`)

// {
//   width: 999,
//   enabled: true,
//   title: 'Hello world',
//   tags: ['one', 'two, too', 'three]still text'],
//   style: { color: 'red', label: 'b{c}' }
// }
```

## Why Use It?

| Input problem | What oparser does |
| --- | --- |
| Mixed separators and whitespace | Accepts `key=value`, `key = value`, multiline input, and comma-separated entries |
| Bare booleans | Parses `enabled`, `enabled=true`, `enabled=TRUE`, `enabled=False` |
| Loose arrays | Parses `[one, two, 3, true]` and preserves quoted commas/brackets |
| Loose objects | Parses `{ a: b }`, `{{ a: "b" }}`, nested objects, and trailing commas |
| Comments in config text | Removes `//`, `/* ... */`, and `#` comments outside quoted values |
| JSX-ish values | Keeps JSX fragments and arrow functions as strings |
| Large JSON values | Fast-parses raw JSON and `key = <large json>` without using the forgiving scanner |
| Unicode keys | Accepts emoji, accented characters, and CJK as bare keys |

## API

```js
const { parse, parseValue, options } = require('oparser')
```

| Function | Use |
| --- | --- |
| `parse(input)` | Parse a full key/value string into an object |
| `parseValue(value)` | Parse one freeform value into a scalar, array, or object |
| `options\`...\`` | Template tag wrapper around `parse()` |

### `parse(input)`

```js
parse('name=bob active=true count=3')
// { name: 'bob', active: true, count: 3 }
```

Empty, `null`, `undefined`, or any non-string input returns `{}`.

```js
parse('')
parse(null)
parse(undefined)
parse(123)
parse({})
parse([])
// {}
```

### `parseValue(value)`

```js
parseValue('[one, two, 3]')
// ['one', 'two', 3]

parseValue('{ a: b, enabled: true }')
// { a: 'b', enabled: true }
```

Non-string values pass through unchanged.

```js
parseValue(null)       // null
parseValue(123)        // 123
parseValue({ a: 1 })   // { a: 1 }
```

### `options` template tag

```js
const { options } = require('oparser')

const config = options`
  foo=bar
  enabled
`

// { foo: 'bar', enabled: true }
```

Object and array substitutions are encoded so embedded quote characters round-trip cleanly.

```js
options`name=${'David Wells'} config=${{ s: 'a"b' }}`
// { name: 'David Wells', config: { s: 'a"b' } }
```

## Parsing Behavior

### Keys

Bare keys accept ASCII letters, digits, `_`, `@`, `$`, and any non-ASCII character above U+00A0 (Latin-1 supplement, CJK, emoji, etc.). After the first character, anything that is not whitespace, `=`, or a structural character is kept.

```js
parse(`name=bob`)            // { name: 'bob' }
parse(`data-id=42`)          // { 'data-id': 42 }
parse(`$HOME=/tmp`)          // { '$HOME': '/tmp' }
parse(`@scope/pkg=1.0.0`)    // { '@scope/pkg': '1.0.0' }
parse(`café=hot`)            // { café: 'hot' }
parse(`日本=val`)            // { '日本': 'val' }
parse(`🚀=launch`)           // { '🚀': 'launch' }
```

Quoted keys preserve spaces and characters that would otherwise terminate a bare key.

```js
parse(`"display name"="David Wells"`)
// { 'display name': 'David Wells' }

parse(`"a=b"=1`)
// { 'a=b': 1 }
```

### Strings

```js
parse(`name=bob`)
parse(`name='bob'`)
parse(`name="bob"`)
parse(`name={bob}`)
// { name: 'bob' }
```

Quoted values stay strings even when they look like another type.

```js
parse(`count="123" enabled="TRUE"`)
// { count: '123', enabled: 'TRUE' }
```

### Booleans

Bare keys become `true`.

```js
parse(`isLoading disabled=false`)
// { isLoading: true, disabled: false }
```

Unquoted `true` and `false` are case-insensitive.

```js
parse(`a=true b=TRUE c=True d=false e=FALSE f=False`)
// { a: true, b: true, c: true, d: false, e: false, f: false }
```

Quoted booleans remain strings.

```js
parse(`a="TRUE" b='False'`)
// { a: 'TRUE', b: 'False' }
```

### Numbers

```js
parse(`width=999 ratio=0.25 offset=-20 sci=1.5e-3 hex=0xFF`)
// { width: 999, ratio: 0.25, offset: -20, sci: 0.0015, hex: 255 }
```

`NaN` stays a string. `Infinity` and `-Infinity` parse as numbers.

### Arrays

```js
parse(`key=[ 1, 2, 3 ]`)
// { key: [1, 2, 3] }

parse(`key=[ one, two, "three", true ]`)
// { key: ['one', 'two', 'three', true] }
```

Quoted commas and brackets are preserved.

```js
parse(`key=["one,two", "a]b", "a[b", three]`)
// { key: ['one,two', 'a]b', 'a[b', 'three'] }
```

Sparse array slots are represented as empty strings.

```js
parse(`key=[1,,3]`)
// { key: [1, '', 3] }
```

### Objects

```js
parse(`key={{ "a": "b" }}`)
parse(`key={{ "a": b }}`)
parse(`key={{ a: "b" }}`)
parse(`key={{ a: b }}`)
parse(`key={ a : b }`)
// { key: { a: 'b' } }
```

Quoted curly braces inside object strings are preserved.

```js
parse(`key={{ a: "b{c}", d: "e}f" }}`)
// { key: { a: 'b{c}', d: 'e}f' } }
```

Nested objects work in single-line and multiline values.

```js
parse(`
  foo={{
    baz: {
      bar: {
        fuzz: "hello"
      }
    }
  }}
`)

// { foo: { baz: { bar: { fuzz: 'hello' } } } }
```

### Comments

Line, block, and hash comments are removed outside quoted values.

```js
parse(`
  width=100
  // ignored
  height=200 # ignored
  label="keep # and // inside quotes"
  /*
    ignored
  */
`)

// { width: 100, height: 200, label: 'keep # and // inside quotes' }
```

### URLs And Special Characters

Unquoted URLs are supported, including query strings, fragments, ports, IPv6, commas, braces, and brackets.

```js
parse(`url=https://example.com?ids[]=1&ids[]=2#section`)
// { url: 'https://example.com?ids[]=1&ids[]=2#section' }

parse(`src=https://user-images.github{user}content.com/image.jpg`)
// { src: 'https://user-images.github{user}content.com/image.jpg' }
```

### JSX-ish Values And Functions

Values wrapped in JSX-style braces are kept as strings when they are not object literals.

```js
parse(`elem={<Component type="text" />}`)
// { elem: '<Component type="text" />' }

parse(`onClick={() => console.log('hi')}`)
// { onClick: "() => console.log('hi')" }
```

## Large JSON

For input over 20,000 characters, `oparser` avoids the expensive forgiving parser when the value is valid JSON.

```js
parse(largeJsonString)
// JSON.parse(largeJsonString)

parse(`
planets = ${largeJsonString}
`)
// { planets: JSON.parse(largeJsonString) }
```

If a very large input is not raw JSON and is not a single `key = <json>` value, `parse()` throws a helpful error instead of attempting the forgiving regex path.

## Stringify

`oparser` also includes a small stringify helper for round-tripping plain objects through option strings.

```js
const { stringify } = require('oparser/src/stringify')
const { parse } = require('oparser')

const input = {
  text: 'hello',
  enabled: true,
  tags: ['one', 'two'],
  style: { color: 'red' }
}

const str = stringify(input, { separator: ' ' })
// text="hello" enabled=true tags={["one", "two"]} style={{ color: "red" }}

parse(str)
// same shape as input
```

Quoted strings get a quote character that does not appear inside the value, so embedded quotes round-trip without escapes.

```js
stringify({ msg: 'a"b' }, { separator: ' ' })  // msg='a"b'
stringify({ msg: "a'b" }, { separator: ' ' })  // msg="a'b"
```

Non-object inputs (`null`, `undefined`, strings, numbers, booleans) return `''`. `null`, `undefined`, function values, and empty arrays/objects are filtered from output.

## Design Philosophy

| Principle | Meaning |
| --- | --- |
| Forgiving first | Prefer useful parsing for human-written config over strict grammar errors |
| Preserve quoted intent | If a value is quoted, keep it as a string |
| Parse obvious types | Unquoted booleans, numbers, arrays, objects, and `null` become native values |
| Unicode-friendly keys | Latin, CJK, and emoji are valid bare key characters |
| Skip the loose parser when possible | Plain strings and large raw JSON bypass the forgiving parser path |
| Keep weird-but-common JSX cases working | React-style object props, elements, and handlers are supported as practical input |

## Comparison

| Tool | Best for | Difference |
| --- | --- | --- |
| `JSON.parse` | Strict JSON | Fast and standard, but rejects loose keys, comments, single quotes, bare strings, and JSX-ish values |
| `URLSearchParams` | Query strings | Great for `a=1&b=2`, not for nested objects, arrays, multiline text, or comments |
| `minimist` / CLI parsers | Command-line argv arrays | Parses shell arguments, not arbitrary multiline key/value text |
| `oparser` | Loose option/config strings | Accepts mixed syntax and returns JavaScript objects |

## Architecture

```text
input string
    |
    |-- trim and unwrap outer quotes
    |
    |-- large JSON fast path
    |      |-- raw JSON: JSON.parse(input)
    |      `-- key = JSON: { key: JSON.parse(value) }
    |
    |-- protect quoted whitespace/comments/conflicting delimiters
    |
    |-- scan characters into key/value buffers
    |
    |-- preFormat(value)
    |
    `-- convert(value)
           |-- booleans, numbers, null
           |-- JSON.parse
           |-- json-alexander for loose JSON
           `-- quote-aware array/object fallbacks
```

## Limitations

- This package intentionally uses regular expressions. Be careful with untrusted server-side input and consider length limits. See OWASP's ReDoS overview: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
- It is not a formal grammar or JavaScript parser. It handles practical JSX-ish strings, but it does not fully parse JavaScript.
- Duplicate keys use last-write-wins behavior.
- Colon syntax is object-only. Top-level `a: 1` is not treated as `a=1`.
- For very large input, only raw JSON and single `key = <json>` payloads use the fast path.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| A value becomes a boolean or number | Quote it: `value="TRUE"` or `value="123"` |
| A large input throws | Use raw JSON or a single `key = <json>` wrapper |
| Top-level `a: 1` becomes odd keys | Use `a=1`; colon syntax is for object values |
| Comments disappear | Quote the content if `#`, `//`, or `/* */` should be preserved |
| Duplicate keys are missing | The last value wins: `a=1 a=2` becomes `{ a: 2 }` |

## FAQ

### Does this parse strict JSON?

Yes. Raw JSON uses `JSON.parse` when possible.

### Does this parse loose JSON?

Yes, for common object and array shapes like `{ a: b }`, `[one, two]`, single quotes, and trailing commas.

### Are booleans case-sensitive?

No for unquoted values. `true`, `TRUE`, `True`, `false`, `FALSE`, and `False` parse as booleans. Quoted versions remain strings.

### Can I parse one value instead of a full object?

Use `parseValue(value)`.

```js
parseValue('{ a: b }')
// { a: 'b' }
```

### Are non-ASCII keys supported?

Yes. Emoji, accented characters, and CJK characters all work as bare keys. See the Keys section above.

### What if a string value contains every quote type?

Stringify picks `"`, `'`, or `` ` `` based on which is absent from the value. If a value contains all three, the chosen quote is backslash-escaped on the way out, but the forgiving parser does not unescape on the way back, so a round-trip in that corner case is lossy. Prefer keeping at least one quote character out of your values, or wrap the value yourself.

### What happens if I pass a non-string to `parse`?

`parse` returns `{}` for `null`, `undefined`, numbers, booleans, plain objects, arrays, and functions. Only string input is parsed.

### Is this safe for untrusted server input?

Use caution. The parser is intentionally regex-heavy and forgiving. Put size limits around untrusted input.

## License

MIT
