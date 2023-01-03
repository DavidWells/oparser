# oparser

A very forgiving key-value option parser. 

Converts plain text key-value pairs to useable javascript objects.

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

/* Here's an example of a giant unruley string with comments */
const giantRuleyStringExample = `width={999} 
  height={{111}}
  numberAsString="12345"   
 great={["scoot", "sco ot", 'scooo ttt']} 
 nice={{ value: nice, cool: "true" }}
 soclose=[jdjdjd, hdhfhfhffh]
 rad="boss"
 cool=true notCool=false
 nooooo={[one, two, 3, 4]}
 numberArray=[3, 7]
 stringArray=["3", "7"]
 numberZero=0,
 xyz=999,
 nope=false,
 // comment
 yes={true}
 isWhat,
 /* comment */
 foo={{ rad: ["whatever", "man", "with spaces"], cool: { beans: 'here' } }}
 # other comment
 what='xnxnx'
 isLoading  
 whatever={{ chill: "https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna", pill: ['yo']}}
 href="https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna"
 src="https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
 deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}`
/* > output
{
  width: 999,
  height: 111,
  numberAsString: "12345",   
  great: [ 'scoot', 'sco ot', 'scooo ttt' ],
  nice: { value: 'nice', cool: 'true' },
  soclose: [ 'jdjdjd', 'hdhfhfhffh' ],
  rad: 'boss',
  cool: true,
  notCool: false,
  nooooo: [ 'one', 'two', 3, 4 ],
  numberArray: [3, 7],
  stringArray: ["3", "7"],
  numberZero: 0,
  xyz: 999,
  nope: false,
  yes: true,
  isWhat: true,
  foo: { rad: [ 'whatever', 'man', "with spaces" ], cool: { beans: 'here' } },
  what: 'xnxnx',
  isLoading: true,
  whatever: {
    chill: "https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
    pill: [ 'yo' ]
  },
  href: "https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
  src: 'https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg',
  deep: { rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }
}
*/
```

See [`./oparser.test.js`](./oparser.test.js) for more usage examples.

## Note

This package uses regular expressions. Beware of [ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) if using this package on the server.