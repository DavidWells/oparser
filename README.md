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

Empty, `null`, and `undefined` input returns `{}`.

```js
parse('')
parse(null)
parse(undefined)
// {}
```

### `parseValue(value)`

```js
parseValue('[one, two, 3]')
// ['one', 'two', 3]

parseValue('{ a: b, enabled: true }')
// { a: 'b', enabled: true }
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

## Parsing Behavior

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

## Design Philosophy

| Principle | Meaning |
| --- | --- |
| Forgiving first | Prefer useful parsing for human-written config over strict grammar errors |
| Preserve quoted intent | If a value is quoted, keep it as a string |
| Parse obvious types | Unquoted booleans, numbers, arrays, objects, and `null` become native values |
| Avoid slow paths for large JSON | Use `JSON.parse` for raw or wrapped JSON payloads |
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

### Is this safe for untrusted server input?

Use caution. The parser is intentionally regex-heavy and forgiving. Put size limits around untrusted input.

## License

MIT
