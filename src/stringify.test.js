const { test } = require('uvu') 
const assert = require('uvu/assert')
const { stringify } = require('./stringify')
const { parse } = require('./index')

test('stringify multiline values with `', t => {
  const multiLineTextValue = `multi

line

text`
  const x = {
    text: multiLineTextValue,
    author: 'Author'
  }
  const stringValue = stringify(x, { separator: ' ' })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(parsedValue, x)
  assert.is(stringValue, `text={\`multi

line

text\`} author="Author"`)
})

test('stringify', () => {
  const trimmedItems = {
    func: () => {},
    nullish: null,
    undef: undefined
  }
  const object = {
    text: 'hello',
    boolean: true,
    array: ['hi', 'there', true],
    object: {
      cool: true,
      nice: 'awesome'
    },
  }

  const inputObject = {
    ...object,
    ...trimmedItems
  }

  const stringValue = stringify(inputObject, { 
    separator: ' ', 
    // asJs: false,
  })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(stringValue, 'text="hello" boolean=true array={["hi", "there", true]} object={{ cool: true, nice: "awesome" }}')


  assert.equal(parsedValue, object)
  const stringValueTwo = stringify(object, { separator: '\n' })
  const parsedValueTwo = parse(stringValue)

  /*
  console.log('stringValueTwo', stringValueTwo)
  console.log('parsedValueTwo', parsedValueTwo)
  /** */
  assert.equal(parsedValueTwo, object)
  assert.equal(stringValueTwo, `
text="hello"
boolean=true
array={["hi", "there", true]}
object={{ cool: true, nice: "awesome" }}
`.trim())
})


test('stringify deep', () => {
  const object = {
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

  const stringValue = stringify(object, { separator: '\n' })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(parsedValue, object)
  assert.equal(stringValue, `
okay="cool"
components={[{
  type: "fullimage",
  height: 400,
  heading: "Heading here...",
  component: "fullimage",
  subheading: "ccccccc"
}, {
  type: "nice",
  height: 400,
  heading: "rad here...",
  component: "fullimage",
  subheading: "ccccccc",
  array: [ "hi", "there" ]
}]}
`.trim())
})

test('stringify deep two', () => {
  const object = {
    "components": [
      {
        "type": "columns",
        "number": "1",
        "box": false,
        "columns": [
          {
            "content": "nicex",
          },
        ]
      }
    ]
  }

  const stringValue = stringify(object, { separator: '\n' })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(parsedValue, object)
  assert.equal(stringValue, `
components={[{
  type: "columns",
  number: "1",
  box: false,
  columns: [{ content: "nicex" }]
}]}
`.trim())
})


test('stringify deep three', () => {
  const object = {
    "components": [
      {
        "type": "columns",
        "number": "1",
        "box": false,
        "columns": [
          {
            "content": "nicex",
            "array": ["hi", "there"],
            foo: {
              "type": "fullimage",
              "height": 400,
              "heading": "Heading here...",
              "component": "fullimage",
              "subheading": "ccccccc"
            }
          }
        ]
      }
    ]
  }

  const stringValue = stringify(object, { separator: '\n' })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(parsedValue, object)
  assert.equal(stringValue, `
components={[{
  type: "columns",
  number: "1",
  box: false,
  columns: [
    {
      content: "nicex",
      array: [ "hi", "there" ],
      foo: {
        type: "fullimage",
        height: 400,
        heading: "Heading here...",
        component: "fullimage",
        subheading: "ccccccc"
      }
    }
  ]
}]}
`.trim())
})



test('stringify simple', () => {
  const object = {
    whatever: 'hi',
    yo: 'hi',
    type: "columns",
    number: "1",
    box: false,
    funky: {
      bunch: {
        and: {
          deep: {
            value: 'cool'
          }
        }
      }
    }
  }

  const stringValue = stringify(object, { 
    separator: '\n',
    prettier: true,
    // singleLineValues: true,
  })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(stringValue, `
whatever="hi"
yo="hi"
type="columns"
number="1"
box=false
funky={{ bunch: {and: {deep: {value: "cool"}}} }}
`.trim())


  assert.equal(parsedValue, object)
})


test('stringify longer', () => {
  const object = {
    components: [
      {
          "type": "featuredpost",
          "heading": "Featured Post"
      },
      {
          "type": "columns",
          "number": "1",
          "box": false,
          "columns": [
              {
                  "content": "Column 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim blandit volutpat maecenas volutpat blandit aliquam etiam. Luctus accumsan tortor posuere ac. Euismod elementum nisi quis eleifend quam. Hendrerit dolor magna eget est lorem ipsum dolor. Tincidunt tortor aliquam nulla facilisi cras fermentum odio eu feugiat. Quis viverra nibh cras pulvinar. Hendrerit gravida rutrum quisque non tellus. Viverra ipsum nunc aliquet bibendum. Purus ut faucibus pulvinar elementum integer enim neque volutpat ac"
              },
              {
                  "content": "colomn 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim blandit volutpat maecenas volutpat blandit aliquam etiam. Luctus accumsan tortor posuere ac. Euismod elementum nisi quis eleifend quam. Hendrerit dolor magna eget est lorem ipsum dolor. Tincidunt tortor aliquam nulla facilisi cras fermentum odio eu feugiat. Quis viverra nibh cras pulvinar. Hendrerit gravida rutrum quisque non tellus. Viverra ipsum nunc aliquet bibendum. Purus ut faucibus pulvinar elementum integer enim neque volutpat ac"
              }
          ]
      }
  ]
  }

  const stringValue = stringify(object, { 
    separator: '\n',
    prettier: true,
    // asJs: false,
    // singleLineValues: true,
  })
  const parsedValue = parse(stringValue)
  /*
  console.log('stringValue', stringValue)
  console.log('parsedValue', parsedValue)
  /** */
  assert.equal(stringValue, `
components={[{ type: "featuredpost", heading: "Featured Post" }, {
  type: "columns",
  number: "1",
  box: false,
  columns: [
    {
      content: "Column 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim blandit volutpat maecenas volutpat blandit aliquam etiam. Luctus accumsan tortor posuere ac. Euismod elementum nisi quis eleifend quam. Hendrerit dolor magna eget est lorem ipsum dolor. Tincidunt tortor aliquam nulla facilisi cras fermentum odio eu feugiat. Quis viverra nibh cras pulvinar. Hendrerit gravida rutrum quisque non tellus. Viverra ipsum nunc aliquet bibendum. Purus ut faucibus pulvinar elementum integer enim neque volutpat ac"
    },
    {
      content: "colomn 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim blandit volutpat maecenas volutpat blandit aliquam etiam. Luctus accumsan tortor posuere ac. Euismod elementum nisi quis eleifend quam. Hendrerit dolor magna eget est lorem ipsum dolor. Tincidunt tortor aliquam nulla facilisi cras fermentum odio eu feugiat. Quis viverra nibh cras pulvinar. Hendrerit gravida rutrum quisque non tellus. Viverra ipsum nunc aliquet bibendum. Purus ut faucibus pulvinar elementum integer enim neque volutpat ac"
    }
  ]
}]}
`.trim())


  assert.equal(parsedValue, object)
})




test.run()