const { test } = require('uvu') 
const assert = require('uvu/assert')
const { stringify } = require('./stringify')

test('stringify multiline values with `', t => {
  const x = {
    text: `multi

line

text`,
    author: 'Author'
  }
  const str = stringify(x)
  // console.log('x', str)
  assert.is(str, `text={\`multi

line

text\`} author="Author"`)
})

test('stringify', () => {
  const props = {
    text: 'hello',
    boolean: true,
    array: ['hi', 'there', true],
    object: {
      cool: true,
      nice: 'awesome'
    },
    func: () => {},
    nullish: null,
    undef: undefined
  }

  const optsString = stringify(props)
  assert.equal(optsString, 'text="hello" boolean=true array={["hi", "there", true]} object={{"cool": true, "nice": "awesome"}}')

  const optsStringTwo = stringify(props, { separator: '\n' })
  // console.log('optsStringTwo', optsStringTwo)
  assert.equal(optsStringTwo, `
text="hello"
boolean=true
array={["hi", "there", true]}
object={{"cool": true, "nice": "awesome"}}
`.trim())
})


test('stringify deep', () => {
  const props = {
    "okay": "cool",
    "components": [
      {
        "type": "fullimage",
        "height": 400,
        "heading": "Heading here...",
        "component": "fullimage",
        "subheading": "ccccccc"
      },
      {
        "type": "nice",
        "height": 400,
        "heading": "rad here...",
        "component": "fullimage",
        "subheading": "ccccccc",
        array: ['hi', 'there' ]
      }
    ]
  }

  const optsStringTwo = stringify(props, { separator: '\n' })
  // console.log('optsStringTwo', optsStringTwo)
  assert.equal(optsStringTwo, `
okay="cool"
components={[{
  "type": "fullimage",
  "height": 400,
  "heading": "Heading here...",
  "component": "fullimage",
  "subheading": "ccccccc"
}, {
  "type": "nice",
  "height": 400,
  "heading": "rad here...",
  "component": "fullimage",
  "subheading": "ccccccc",
  "array": [
    "hi",
    "there"
  ]
}]}
`.trim())
})



test.run()