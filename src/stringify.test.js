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


test('stringify array', () => {
  const inputArray = [{type: 'dimensions', width: 108, height: 2222}]
  const inputObject = {
    settings: inputArray
  }

  const stringValue = stringify(inputArray)
  // console.log('stringValue', stringValue)
  assert.is(stringValue, '[{ type: "dimensions", width: 108, height: 2222 }]')

  const stringValueTwo = stringify(inputObject, {
    separator: ' ',
    // asJs: false,
  })
  //console.log('stringValueTwo', stringValueTwo)
  assert.is(stringValueTwo, 'settings={[{ type: "dimensions", width: 108, height: 2222 }]}')
})

test('stringify empty object', () => {
  const inputObject = {
    dimensions: {},
  }

  const stringValue = stringify(inputObject)
  // console.log('stringValue', stringValue)
  assert.is(stringValue, '')

  const inputObjectTwo = {
    dimensions: {},
    hello: 'world'
  }
  const stringValueTwo = stringify(inputObjectTwo, {
    separator: ' ',
  })
  //console.log('stringValueTwo', stringValueTwo)
  assert.is(stringValueTwo, 'hello="world"')
})

test('stringify with non-object inputs returns empty string', () => {
  assert.is(stringify(null), '', 'null')
  assert.is(stringify(undefined), '', 'undefined')
  assert.is(stringify('string'), '', 'string')
  assert.is(stringify(123), '', 'number')
  assert.is(stringify(true), '', 'boolean')
})

test('stringify round-trips strings with embedded quotes', () => {
  /* Round-trip works as long as at least one of the three quote chars is
     absent from the value. Values containing all three are a known
     limitation - the forgiving parser does not unescape backslashes. */
  const cases = [
    { name: 'inner double quote', input: { msg: 'a"b' } },
    { name: 'inner single quote', input: { msg: "a'b" } },
    { name: 'inner backtick', input: { msg: 'a`b' } },
    { name: 'leading + trailing quote', input: { msg: '"quoted"' } },
  ]
  for (const { name, input } of cases) {
    const out = stringify(input, { separator: ' ' })
    assert.equal(parse(out), input, name)
  }
})

test('stringify does not mutate input', () => {
  const input = { a: 1, b: { c: [1, 2] }, d: 'text' }
  const snapshot = JSON.parse(JSON.stringify(input))
  stringify(input, { separator: ' ' })
  assert.equal(input, snapshot)
})

test('stringify option formats', () => {
  const joinerValue = stringify({ a: 1, b: 'two' }, { joiner: ':', separator: ' ' })
  assert.is(joinerValue, 'a:1 b:"two"')

  const compressedValue = stringify({ a: { b: 1 }, c: [1, 2] }, {
    compressed: true,
    separator: ' '
  })
  assert.is(compressedValue, 'a={{b:1}} c={[1, 2]}')
  assert.equal(parse(compressedValue), { a: { b: 1 }, c: [1, 2] })

  const expandedValue = stringify({ a: { b: 1 } }, { expanded: true })
  assert.is(expandedValue, `a={{
  b: 1
}}`)
  assert.equal(parse(expandedValue), { a: { b: 1 } })

  const singleLineValue = stringify({ a: { b: 1, c: [2, 3] } }, { singleLineValues: true })
  assert.is(singleLineValue, 'a={{b: 1, c: [2, 3]}}')
  assert.equal(parse(singleLineValue), { a: { b: 1, c: [2, 3] } })

  const jsonValue = stringify({ a: { b: 1 } }, { asJs: false })
  assert.is(jsonValue, 'a={{ "b": 1 }}')
  assert.equal(parse(jsonValue), { a: { b: 1 } })
})

test.run()
