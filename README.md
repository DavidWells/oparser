# oparse

A very tiny & forgiving option parser. 

Converts plain text key-value pairs to useable JS objects.

## Example

Handles single & multiline complex strings of key-value pairs

```js
/* String */
const str = optionsParse(`name=bob`)
const str = optionsParse(`name='bob'`)
const str = optionsParse(`name="bob"`)
const str = optionsParse(`name={bob}`)
/* > output
{ name: 'bob' }
*/

/* Boolean */
const bool = optionsParse(`isCool`)
const bool = optionsParse(`isCool = true`)
const bool = optionsParse(`isCool =true`)
const bool = optionsParse(`isCool=true`)
const bool = optionsParse(`isCool={true}`)
const bool = optionsParse(`isCool={{true}}`)
/* > output
{ isCool: true }
*/

/* Arrays */
const arrayWithNumbers = optionsParse(`key=[ 1, 2, 3 ]`)
/* > output
{ key: [ 1, 2, 3 ] }
*/

const arrayWithStrings = optionsParse(`key=[ "1", "2", "3" ]`)
/* > output
{ key: [ "1", "2", "3" ] }
*/

const arrayWithNonQuotedStrings = optionsParse(`key=[ one, two, three ]`)
/* > output
{ key: [ "one", "two", "three" ] }
*/

const arrayWithMixedValues = optionsParse(`
great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} 
`)
/* > output
{ great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] }
*/

/* Objects */
const obj = optionsParse(`key={{ "a": "b" }}`)
const obj = optionsParse(`key={{ "a": b }}`)
const obj = optionsParse(`key={{ a: "b" }}`)
const obj = optionsParse(`key={{ a: b }}`)
const obj = optionsParse(`key={ a : b }`)
/* > output
{ key: { a: 'b' }}
*/

/* Multiline Objects */
const reactStyleObjects = `
  foo={{
    baz: {
      bar: {
        fuzz: "hello"
      }
    }
  }}
`
/* > output
{
  foo: {
    baz: {
      bar: {
        fuzz: "hello"
      }
    }
  }
}
*/
```

See `./oparser.test.js` for more examples