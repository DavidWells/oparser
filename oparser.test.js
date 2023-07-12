const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parse, parseValue, stringify, options } = require('./')

test('Empty value', () => {
  assert.equal(parse(), {}, 'undefined val')
  assert.equal(parse(''), {}, 'empty string')
  assert.equal(parse(null), {}, 'null')
})

const stringExample = `abc=yo foo=bar baz='hello' bim='boop dop' fizz="pop" pow="bang bang"`
test('string test', () => {
  const parsedValue = parse(stringExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    abc: 'yo',
    foo: 'bar',
    baz: 'hello', 
    bim: 'boop dop',
    fizz: "pop",
    pow: "bang bang"
  })
})

const stringExampleWithBoolean = `abc=yo foo=bar bim='boop dop' boo=true`
test('string test two', () => {
  const parsedValue = parse(stringExampleWithBoolean)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    abc: 'yo',
    foo: 'bar',
    bim: 'boop dop',
    boo: true
  })
})

const bigExample = `width={999} 
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

test('Multi line', () => {
  const parsedValue = parse(bigExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
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
  }, 'matches original')
})

const testSpacing = `width={999} 
  height={{111}}
  numberAsString="12345"   
  great={["scoot", "sco ot", 'scooo ttt']} 
  nope=false,
  // comment
 yes={true}
 isWhat,
 /* comment */
 foo={{ rad: ["what ever", "man"], cool: { beans: 'here' } }}
 # other comment
 what='xnxnx'
    isLoading  
    href="https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna"
    src="https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
    deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}
`

// Verify indentation doesnt matter
test('Multi line indent', () => {
  const parsedValue = parse(testSpacing)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: '12345',
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nope: false,
    yes: true,
    isWhat: true,
    foo: { rad: [ 'what ever', 'man' ], cool: { beans: 'here' } },
    what: 'xnxnx',
    isLoading: true,
    href: "https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
    src: 'https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg',
    deep: { rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }
  }, 'matches original')
})

test('Single line', () => {
const parsedValue = parse(`width={999} height={{111}} numberAsString="12345" great={["scoot", "sco ot", 'scooo ttt']} nice={{ value: nice, cool: "true" }} soclose=[jdjdjd, hdhfhfhffh] rad="boss" cool=true isCool notCool=false nooooo={[one, two, 3, 4]}`)  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: '12345',
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nice: { value: 'nice', cool: 'true' },
    soclose: [ 'jdjdjd', 'hdhfhfhffh' ],
    rad: 'boss',
    cool: true,
    isCool: true,
    notCool: false,
    nooooo: [ 'one', 'two', 3, 4 ]
  }, 'matches original')
})

test('Simple string equal (single quotes)', () => {
  const parsedValue = parse(`bob='cool'`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (double quotes)', () => {
  const parsedValue = parse(`bob="cool"`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (no quotes). key=value', () => {
  const parsedValue = parse(`bob=cool`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
  // Booleans are booleans
  assert.equal(parse(`thingy=true`), { thingy: true })
  assert.equal(parse(`thingy=false`), { thingy: false })
})

test('Simple string equal (no quotes with spaces). key = value', () => {
  const answer = { bob: 'cool' }
  const one = parse(`bob = cool`)
  const two = parse(`bob= cool`)
  const three = parse(`bob =cool`)

  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
})

test('Simple string react-like syntax. key={"value"}', () => {
  const answer = { bob: 'cool' }
  const three = parse(`bob={cool}`)
  const four = parse(`bob={'cool'}`)
  const five = parse(`bob={"cool"}`)
  const six = parse(`bob={{"cool"}}`)
  assert.equal(three, answer)
  assert.equal(four, answer)
  assert.equal(five, answer)
  assert.equal(six, answer)
})

test('Simple strings mixed', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool' 
  }
  const one = parse(`
  bob = cool
  joe=cool
  bill="cool"
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)

  const two = parse(`bob = cool joe=cool bill="cool" steve='cool'`)
  assert.equal(two, answer)
})

test('Simple numbers', () => {
  const one = parse(`isCool=20`)
  assert.equal(one, { isCool: 20 })

  const two = parse(`isCool=20.2`)
  assert.equal(two, { isCool: 20.2 })

  const three = parse(`isCool={20.2}`)
  assert.equal(three, { isCool: 20.2 })

  const four = parse(`isCool={{20.2}}`)
  assert.equal(four, { isCool: 20.2 })

  const five = parse(`isCool=0`)
  assert.equal(five, { isCool: 0 })

  const sixAsString = parse(`isCool="0"`)
  assert.equal(sixAsString, { isCool: "0" })

  const decimal = parse(`isCool=0.22`)
  assert.equal(decimal, { isCool: 0.22 })

  const brackets = parse(`isCool={0.22}`)
  assert.equal(brackets, { isCool: 0.22 })
})

test('Simple boolean', () => {
  const answer = { isCool: true }
  const one = parse(`isCool`)
  const two = parse(`isCool = true`)
  const three = parse(`isCool =true`)
  const four = parse(`isCool=true`)
  const fourx = parse(`isCool={true}`)
  const foury = parse(`isCool={{true}}`)
  const boolString = parse(`isCool="true"`)
  const boolStringTwo = parse(`isCool='true'`)
  const boolStringThree = parse(`isCool={'true'}`)

  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
  assert.equal(four, answer)
  assert.equal(fourx, answer)
  assert.equal(foury, answer)
  assert.equal(boolString, { isCool: 'true' })
  assert.equal(boolStringTwo, { isCool: 'true' })
  assert.equal(boolStringThree, { isCool: 'true' })

  const answerTwo = { isNotCool: false }
  const five = parse(`isNotCool=false`)
  const six = parse(`isNotCool = false`)
  const seven = parse(`isNotCool =false`)
  const eight = parse(`isNotCool=false`)
  const nine = parse(`isNotCool= false`)
  const ten = parse(`isNotCool={false}`)
  const eleven = parse(`isNotCool={{false}}`)
  const boolStringFalse = parse(`isNotCool="false"`)
  const boolStringFalseTwo = parse(`isNotCool='false'`)
  const boolStringFalseThree = parse(`isNotCool={'false'}`)

  assert.equal(five, answerTwo, 'five')
  assert.equal(six, answerTwo, 'six')
  assert.equal(seven, answerTwo, 'seven')
  assert.equal(eight, answerTwo, 'eight')
  assert.equal(nine, answerTwo, 'nine')
  assert.equal(ten, answerTwo, 'ten')
  assert.equal(eleven, answerTwo, 'eleven')
  assert.equal(boolStringFalse, { isNotCool: 'false' })
  assert.equal(boolStringFalseTwo, { isNotCool: 'false' })
  assert.equal(boolStringFalseThree, { isNotCool: 'false' })
})

test('Multiline boolean', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    isRad: true,
    isWow: true,
    bill: "cool",
    isNotCool: false,
    steve: 'cool',
    isCool: true
  }
  const one = parse(`
  bob = cool
  joe=cool
  isRad
  isWow,
  bill="cool"
  isNotCool=false
  steve='cool'
  isCool
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Simple object', () => {
  const a = { key: { a: 'b' }}
  assert.equal(a, parse(`key={{ "a": "b" }}`))
  assert.equal(a, parse(`key={{ "a": b }}`))
  assert.equal(a, parse(`key={{ a: "b" }}`))
  assert.equal(a, parse(`key={{ a: b }}`))
  assert.equal(a, parse(`key={ a : b }`), 'single {')

  const answer = { nice: { value: 'nice', cool: 'true', awesome: false } }
  const one = parse(`nice={{ value: nice, cool: "true", awesome: false, }}`)
  assert.equal(one, answer)
  const two = parse(`nice={{
    value: nice,
    cool: "true",
    awesome: false
  }}`)
  assert.equal(two, answer)
})

test('Object in quotes is string', () => {
  const a = parse(`key="{ xjsjsj }"`)
  assert.equal(a, {
    key: "{ xjsjsj }"
  }, 'a')
  const b = parse(`key='{ foo:bar }'`)
  assert.equal(b, {
    key: "{ foo:bar }"
  }, 'b')
  const c = parse(`key='{ "foo": "bar" }'`)
  assert.equal(c, {
    key: '{ "foo": "bar" }'
  }, 'c')
  const d = parse(`key='{{ "foo": "bar" }}'`)
  assert.equal(d, {
    key: '{{ "foo": "bar" }}'
  }, 'd')
})

test('Deep object', () => {
  const doubleBracket = `
    foo={{
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }}
  `
  const val = parse(doubleBracket)
  assert.equal(val, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  }, 'doubleBracket')

  const singleBracket = `
    foo={
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  `
  const valTwo = parse(singleBracket)
  assert.equal(valTwo, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  }, 'singleBracket')
})

test('Deep object with quotes', () => {
  const withQuotes = `
    foo={
      "baz": {
        "bar": {
          "fuzz": "hello there",
          "x": ["hello there"]
        }
      }
    }
  `
  const valThree = parse(withQuotes)
  assert.equal(valThree, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello there",
          "x": ["hello there"]
        }
      }
    }
  }, 'withQuotes')
})

test('Simple array', () => {
  const x = { key: [ 1, 2, 3 ] }
  const y = parse(`key=[ 1, 2, 3 ]`)
  assert.equal(x, y)

  const z = parse(`key=[ "1", "2", "3" ]`)
  assert.equal(z, { key: [ "1", "2", "3" ] })

  const trailingComma = parse(`key=[ "1", "2", "3", ]`)
  assert.equal(trailingComma, { key: [ "1", "2", "3" ] })

  const a = parse(`key=[ one, two, three ]`)
  assert.equal(a, { key: [ "one", "two", "three" ] })

  const answer = { great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] }
  const one = parse(`great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} `)
  assert.equal(one, answer)
})

test('Complex array with array', () => {
  const a = parse(`
  key=[ true, two, "three", 2, ["nested", "array"], ["nested", "arrayTwo"]]`)
  assert.equal(a, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  })

  const multiLineArray = parse(`
  key={[
    true,
    two,
    "three",
    2,
    ["nested", "array"],
    ["nested", "arrayTwo"]
  ]}`)
  assert.equal(multiLineArray, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  }, 'multiLineArray')
})

test('Complex array with object', () => {
  const a = parse(`
  key=[ true, two, "three", 2, { 
    foo: {
      baz: {
        bar: {
          fuzz: "hello there",
          "x": ["hello there"]
        }
      }
    }
  }]`)
  assert.equal(a, { 
    key: [ 
      true, 
      "two", 
      "three", 
      2, 
      { 
        foo: {
          baz: {
            bar: {
              fuzz: "hello there",
              "x": ["hello there"]
            }
          }
        }
      }
    ] 
  })
})

test('Mixed array syntax', () => {
  const smallExample = `
  lines=[3, 7]
  brackets={[3, 7]}
  bracketsWithStrings={['3', '7']}
  abc=["3", "7", { foo: 'bar' }]
  xyz=['3', '7']
  mixed=["3", '7']
  qwerty=[bob, steve]
  notArray='[]'
  notArrayTwo='[foobar]'
  notArrayThree='["foobar"]'
  notArrayFour='[wrapped, in, quotes]'
  notArrayFive="[wrapped, in, doublequotes]"
  `
  const parsedValue = parse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    lines: [ 3, 7 ],
    brackets: [3, 7],
    bracketsWithStrings: ['3', '7'],
    abc: [ '3', '7', { foo: 'bar' } ], 
    xyz: [ '3', '7' ],
    mixed: [ '3', '7' ],
    notArray: '[]',
    notArrayTwo: '[foobar]',
    notArrayThree: '["foobar"]',
    qwerty: [ 'bob', 'steve' ],
    notArrayFour: '[wrapped, in, quotes]',
    notArrayFive: '[wrapped, in, doublequotes]'
  })
})

test('Strings are NOT arrays', () => {
  const smallExample = `
  lines=[3, 7]
  notArray='[]'
  notArrayTwo='[foobar]'
  notArrayThree='["foobar"]'
  notArrayFour='[wrapped, in, quotes]'
  notArrayFive="[wrapped, in, doublequotes]"
  `
  const parsedValue = parse(smallExample)
  //console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    lines: [ 3, 7 ],
    notArray: '[]',
    notArrayTwo: '[foobar]',
    notArrayThree: '["foobar"]',
    notArrayFour: '[wrapped, in, quotes]',
    notArrayFive: '[wrapped, in, doublequotes]'
  })
})

test('oddly "broken" inner quotes', () => {
  const smallExample = `
  x='[foo'bar]'
  y="[foo"bar]"
  z='''''''
  a=""""""" test="foo"
  b='"'"'"'"'
  // c="tons of" weird inner quotes" // this doesnt work
  d="bar"
  `
  const parsedValue = parse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    x: "[foo'bar]",
    y: '[foo"bar]',
    z: "'''''",
    a: '"""""',
    test: "foo",
    b: '"\'"\'"\'"',
    // c: "tons of\" weird inner quotes",
    d: 'bar'
  })
})

test('Single quotes inside double quotes', () => {
  const one = parse(`bob="co'ol" steve="co'ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, {
    bob: "co'ol",
    steve: "co'ol",
  }, 'one')

  const two = parse(`bob='co "ol' steve='co"ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(two, {
    bob: "co \"ol",
    steve: "co\"ol",
  }, 'two')

  const three = parse(`bob="co ol" steve="co ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(three, {
    bob: "co ol",
    steve: "co ol",
  }, 'three')

  const four = parse(`bob='co "ol' steve='co""""ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(four, {
    bob: "co \"ol",
    //steve: "co\"\"\"\"ol",
    steve: 'co""""ol'
  })

  const five = parse(`title='Wow "this" is great'`)
  assert.equal(five, {
    title: 'Wow "this" is great',
  })

  const six = parse(`title="Wow \"this\" is great"`)
  assert.equal(six, {
    title: 'Wow "this" is great',
  })

  const seven = parse(`title='Wow "this" is great'`)
  assert.equal(seven, {
    title: 'Wow "this" is great',
  })

  const eight = parse(`title='Wow \'this\' is great'`)
  assert.equal(eight, {
    title: "Wow 'this' is great",
  })
})

test('Remove single line comments', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool',
  }
  const one = parse(`
  bob = cool
  # Remove this
  joe=cool
  /* Remove this */
  bill="cool"
  // Remove this
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Remove multi line comments', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool',
    jim: 'dope'
  }
  const one = parse(`
  bob = cool
  # Remove this
  # And this Remove this
  joe=cool
  // deadOption="foobar"
  /* Remove this 
     and this
     and this too
  */
  bill="cool"
  /* 
    Remove this 
    and this
    and this too
  */
  // Remove this
  // And this
  steve='cool'
  /**
   * This is striped out
   * very nice
   */
  jim="dope"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Remove multi line comments two', () => {
  const answer = { 
    bob: 'cool',
    bill: "cool",
  }
  const one = parse(`
bob = cool
/* 
bobby="rad"
*/
bill="cool"
/* 
 * bobbyTwo="rad"
 */
`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner double quotes', () => {
  const answer = { 
    funny: 'wh"at',
  }
  const one = parse(`
  funny='wh"at'
  `)
  //console.log('parsedValue', one)
  assert.equal(one, answer)
})

test('Handles inner single quotes', () => {
  const answer = { 
    funny: "wh'at",
  }
  const one = parse(`
  funny="wh'at"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner equals =', () => {
  const answer = { 
    funny: "wh=at",
  }
  const one = parse(`
  funny="wh=at"
  `)
  assert.equal(one, answer, 'one')
  const two = parse(`
  funny=wh=at
  `)
  assert.equal(two, answer, 'two')
  const three = parse(`
  funny='wh=at'
  `)
  assert.equal(three, answer, 'three')
})

test('Handles escaped double quotes', () => {
  const answer = { 
    funny: "wh\"at",
  }
  const one = parse(`
  funny="wh\"at",
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles escaped single quotes', () => {
  const answer = { 
    funny: 'wh\'at',
  }
  const one = parse(`
  funny='wh\'at',
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles commas after key/values', () => {
  const one = parse(`funny='what', funky="cool", woah="co,ol", weird=what,`)
  // console.log('parsedValue', one)
  assert.equal(one, { 
    funny: 'what',
    funky: "cool",
    woah: "co,ol",
    weird: 'what'
  })
})

test('Handles commas after key/values multiline', () => {
  const one = parse(`
  funny='what',
  funky="cool",,,,
  woah="co,ol",
  weird=what,
  `)
  // console.log('parsedValue', one)
  assert.equal(one, { 
    funny: 'what',
    funky: "cool", 
    woah: "co,ol",
    weird: 'what'
  })
})

test('Handles *', () => {
  const answer = { 
    funny: '*',
    cool: '*!',
    wow: '*-*',
    trill: "**_**",
    haha: "***",
    rad: "*****"
  }
  const one = parse(`
  funny='*'
  cool=*!
  wow=*-*
  trill={**_**}
  haha={{***}}
  rad="*****"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner curly brackets {}', () => {
  const answer = { 
    funny: '${funky}',
    one: "weirdval}}}",
    two: "weirdval}",
    three: "weirdval}",
    four: "weirdval",
    five: "{weirdval",
    six: "{{weirdval}}",
    seven: "{{weirdval}}"
  }
  const one = parse(`
  funny='\${funky}'
  one=weirdval}}}
  two={{weirdval}}}
  three={weirdval}}
  four={{weirdval}}
  five={{{weirdval}}
  six="{{weirdval}}"
  seven='{{weirdval}}'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner brackets []', () => {
  const answer = {
    nice: '[whatever]x',
    funny: '[[coool]]',
  }
  const one = parse(`
  nice='[whatever]x'
  funny="[[coool]]"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles variable syntax values', () => {
  const one = parse("nice=${file(./foo.js)}")
  assert.equal(one, {
    nice: '${file(./foo.js)}',
  })
  const two = parse("nice='${file(./foo.js)}'")
  assert.equal(two, {
    nice: '${file(./foo.js)}',
  })
  const three = parse(`nice='\${file("./foo.js")}'`)
  assert.equal(three, {
    nice: '${file("./foo.js")}',
  })
  const four = parse(`nice='\${self:custom.stage}'`)
  assert.equal(four, {
    nice: '${self:custom.stage}',
  })
})

test('Handles ${}', () => {
  const one = parse("what=arn:aws:sns:${self:custom.region}:*:${self:custom.topicName}")
  assert.equal(one, {
    what: 'arn:aws:sns:${self:custom.region}:*:${self:custom.topicName}',
  })
  const two = parse("what=*********")
  assert.equal(two, {
    what: '*********',
  })
})

test('Handles emojis', () => {
  const one = parse(`
  what='😃'
  cool='xyz😃'
  `)
  assert.equal(one, {
    what: '😃',
    cool: 'xyz😃'
  })
})

test('Handles periods', () => {
  const one = parse("what=no.md")
  assert.equal(one, {
    what: 'no.md',
  })
  const two = parse("what='no.md'")
  assert.equal(two, {
    what: 'no.md',
  })
  const three = parse('what="no.md"')
  assert.equal(three, {
    what: 'no.md',
  })
})

test('Handles commas', () => {
  const one = parse("what=no,md")
  assert.equal(one, {
    what: 'no,md',
  })
  const two = parse("what='no,md'")
  assert.equal(two, {
    what: 'no,md',
  })
  const three = parse('what="no,md"')
  assert.equal(three, {
    what: 'no,md',
  })
  const trimExtraTrailingComma = parse('what="no,md",')
  assert.equal(trimExtraTrailingComma, {
    what: 'no,md',
  })
})

test('Handles multiline values (indentation matters)', () => {
  const one = parse(`
  what="
import {foo} from 'lodash'
import {bar} from 'lodash'
import {zaz} from 'lodash'
"`)
  assert.equal(one, {
    what: `
import {foo} from 'lodash'
import {bar} from 'lodash'
import {zaz} from 'lodash'
`,
  })
})

test('Handles multiline values two (indentation matters)', () => {
  const one = parse(`
  what="
    import {foo} from 'lodash'
    import {bar} from 'lodash'
    import {zaz} from 'lodash'
  "
  `)
  assert.equal(one, {
    what: `
    import {foo} from 'lodash'
    import {bar} from 'lodash'
    import {zaz} from 'lodash'
  `,
  })
})

test('Handles multiline values single quotes (indentation matters)', () => {
  const one = parse(`
  baz="yolo"
  what='
    import {foo} from 'lodash'
    import {bar} from "lodash"
    import {zaz} from 'lodash'
  '
  bar=true
  `)
  assert.equal(one, {
    baz: 'yolo',
    what: `
    import {foo} from 'lodash'
    import {bar} from "lodash"
    import {zaz} from 'lodash'
  `,
   bar: true
  })
})

test('Handles multiline values {`reactStyle`}', () => {
  const one = parse(`
  baz="yolo"
  what={\`
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  \`}
  bar=true
  `)
  assert.equal(one, {
    baz: 'yolo',
    what: `
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  `,
   bar: true
  })
})

test('Handles multiline values wrapped in ``', () => {
  const answer = {
    baz: 'yolo',
    what: `
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  `,
    bar: true,
  }

  const one = parse(`
  baz="yolo"
  what=\`
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  \`
  bar=true
  `)
  // console.log('one', one)
  assert.equal(one, answer, 'one')

  const two = parse(`
  baz="yolo"
  what="
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  "
  bar=true
  `)
  // console.log('two', two)

  assert.equal(two, answer, 'two')

  const three = parse(`
  baz="yolo"
  what='
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  '
  bar=true
  `)
  assert.equal(three, answer, 'three')


  const four = parse(`
  baz="yolo"
  what={\`
import {foo} from 'lodash'
import {bar} from "lodash"
import {zaz} from 'lodash'
  \`}
  bar=true
  `)
  assert.equal(four, answer, 'four')
})

test('Handles multiline values lorum ipsum', () => {
  const one = parse(`
  baz="yolo"
  what={\`
  Lorem ipsum dolor sit amet, has te paulo sententiae argumentum, ius id saepe moderatius adversarium. 
  Porro iudico deserunt mei ex. Est quas denique nostrum eu, ne sit eius mundi omnium. 
  Eam labitur recteque dissentiet an. Fugit facer delectus ad quo, an vel debet vidisse percipitur, ex facilisi nominati laboramus cum. Mea lobortis accusamus ex. Nam id apeirian forensibus, in qui nisl illud mucius.
  \`}
  bar=true
  funky='fresh'
  `)
  assert.equal(one, {
    baz: 'yolo',
    what: `
  Lorem ipsum dolor sit amet, has te paulo sententiae argumentum, ius id saepe moderatius adversarium. 
  Porro iudico deserunt mei ex. Est quas denique nostrum eu, ne sit eius mundi omnium. 
  Eam labitur recteque dissentiet an. Fugit facer delectus ad quo, an vel debet vidisse percipitur, ex facilisi nominati laboramus cum. Mea lobortis accusamus ex. Nam id apeirian forensibus, in qui nisl illud mucius.
  `,
   bar: true,
   funky: 'fresh'
  })
})

test('Big array', () => {
  const one = parse(`
foo=[
  {
    color: "red",
    value: "#f00"
  },
  {
    color: "green",
    value: "#0f0"
  },
  {
    color: "blue",
    value: "#00f"
  },
  {
    color: "cyan",
    value: "#0ff"
  },
  {
    color: "magenta",
    value: "#f0f"
  },
  {
    color: "yellow",
    value: "#ff0"
  },
]
`)
  assert.equal(one, {
    foo: [
      {
        color: "red",
        value: "#f00"
      },
      {
        color: "green",
        value: "#0f0"
      },
      {
        color: "blue",
        value: "#00f"
      },
      {
        color: "cyan",
        value: "#0ff"
      },
      {
        color: "magenta",
        value: "#f0f"
      },
      {
        color: "yellow",
        value: "#ff0"
      }
    ],
  })
})

test('Big array react style', () => {
  const one = parse(`
foo={[
  {
    color: "red",
    value: "#f00"
  },
  {
    color: "green",
    value: "#0f0"
  },
  {
    color: "blue",
    value: "#00f"
  },
  {
    color: "cyan",
    value: "#0ff"
  },
  {
    color: "magenta",
    value: "#f0f"
  },
  {
    color: "yellow",
    value: "#ff0"
  },
  {
    color: "black",
    value: "#000"
  }
]}
`)
  assert.equal(one, {
    foo: [
      {
        color: "red",
        value: "#f00"
      },
      {
        color: "green",
        value: "#0f0"
      },
      {
        color: "blue",
        value: "#00f"
      },
      {
        color: "cyan",
        value: "#0ff"
      },
      {
        color: "magenta",
        value: "#f0f"
      },
      {
        color: "yellow",
        value: "#ff0"
      },
      {
        color: "black",
        value: "#000"
      }
    ],
  })
})

test('Handles Multiline breaks', () => {
  const one = parse(`

  foo='bar'



  baz='fuzz'


  funky=true
  


  
  `)
  assert.equal(one, {
    foo: 'bar',
    baz: 'fuzz',
    funky: true,
  })
})

test('Weird ones', () => {
  const one = parse("debug 1")
  assert.equal(one, {
    debug: true,
    1: true,
  })
  const two = parse("_debug 33")
  assert.equal(two, {
    _debug: true,
    33: true,
  })
})

test('Template tage ones', () => {
  const one = options`foo=bar`
  assert.equal(one, {
    foo: 'bar',
  })

  const two = options`
  foo=bar
  bob="xyz"
  lol='cool'
  `
  assert.equal(two, {
    foo: 'bar',
    bob: 'xyz',
    lol: 'cool',
  })
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


test('reactProp func', () => {
  assert.equal(parse(`onClick={hi}`), {
    onClick: 'hi',
  }, 'onClick={hi}')

  assert.equal(parse(`onClick={()}`), {
    onClick: '()',
  }, 'onClick={()}')

  const three = `onClick={() => console.log('h i')}`
  assert.equal(parse(three), {
    onClick: "() => console.log('h i')",
  }, 'three')

  const four = `onClick={{() => console.log('h i')}}`
  assert.equal(parse(four), {
    onClick: "() => console.log('h i')",
  }, 'four')

  const five = `isCool onClick={"() => { console.log('h i')}"}`
  // console.log('five', five)
  assert.equal(parse(five), {
    isCool: true,
    onClick: "() => { console.log('h i')}",
  }, 'five')

  // const six = `onClick=() => {
  //   console.log('h i')
  //   console.log("cool stuuf")
  // }`
  // assert.equal(parse(six), {
  //   onClick: "() => { console.log('h i')}",
  // }, six)
})


test('parse multiline `values`', t => {
  const three = `text={\`multi

line

text\`} author="Author"`
  const result = parse(three)
  // console.log('result', result)
  assert.equal(result, { 
    text: 'multi\n\nline\n\ntext', 
    author: 'Author' 
  })
})


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


test('Handles wierd emoji cases', () => {
  const one = parse(`⛔️ `)
  assert.equal(one, {})

  const two = parse(`⛔️`)
  assert.equal(two, {})

  const four = parse(`⛔️😅`)
  assert.equal(four, {})

  const five = parse(`⛔️😅 haha=true`)
  assert.equal(five, {
    haha: true
  })

  const three = parse(`x⛔️=true`)
  assert.equal(three, {
    'x⛔️': true
  })
})

test('Odd object with missing quotes', () => {
  const one = parse('val={ name: John Doe }')
  // console.log('one', one)
  assert.equal(one, {
    'val': {
      name: 'John Doe',
    }
  })

  const two = parse('val={ name: John Doe, }')
  assert.equal(two, {
    'val': {
      name: 'John Doe',
    }
  })

  const three = parse('val={ name: John Doe, bob: dole }')
  assert.equal(three, {
    'val': {
      name: 'John Doe',
      bob: 'dole'
    }
  })

  const four = parse('val={ name: John Doe, bob: dole, billy: the kid }')
  assert.equal(four, {
    'val': {
      name: 'John Doe',
      bob: 'dole',
      billy: "the kid"
    }
  })

  // This is broken... probably wont support 
  // const four = parse('val={ name: John Doe, bob: dole, bill: ["one", "two", true ] }')
  // assert.equal(four, {
  //   'val': {
  //     name: 'John Doe',
  //     bob: 'dole',
  //     bill: ["one", "two", true ]
  //   }
  // })

  /* Ensure strings still work */
  const a = parse('val="{ name: John Doe }"')
  assert.equal(a, {
    'val': `{ name: John Doe }`
  }, 'a')

  const b = parse("val='{ name: John Doe }'")
  assert.equal(b, {
    'val': `{ name: John Doe }`
  }, 'b')
})

test('tricky strings - parseValue', () => {
  const one = parseValue('{"key:true": ["1,2", 3, "\\"k\\":v"]}')
  // console.log('one', one)
  assert.equal(one, { "key:true": ["1,2", 3, '"k":v'] })
})

test('Multiline array string - parseValue', () => {
  const multiLine =     
  `
{
  "a": [1, 2, 3],
  "b": [1, 2, 3]
}
  `.trim()
  const one = parseValue(multiLine)
  // console.log('one', one)
  assert.equal(one, {
    "a": [1, 2, 3],
    "b": [1, 2, 3]
  })

  const multiLineTwo = 
`
{
  "a": [
    1,
    2,
    3
  ],
  "b": [1, 2, 3]
}
  `.trim()

  const two = parseValue(multiLineTwo)
  // console.log('two', two)
  assert.equal(two, {
    "a": [
      1,
      2,
      3
    ],
    "b": [1, 2, 3]
  })
})

test('Trailing commas arrays - parseValue', () => {
  const multiLineTwo = 
`
{
  "a": [
    1,
    2,
    3,
  ],
  "b": [1, 2, 3],
}
`
  const two = parseValue(multiLineTwo)
  // console.log('two', two)
  assert.equal(two, {
    "a": [ 1, 2, 3],
    "b": [1, 2, 3]
  })
})

test('Trailing commas objects - parseValue', () => {
  const multiLineTwo = 
`
[
  {"cool": true, "nice": "1",},
  {"cool": false, "nice": "2",,,,},
  {"cool": null, "nice": "3",},
]
`
  const two = parseValue(multiLineTwo)
  // console.log('two', two)
  assert.equal(two, [
    { cool: true, nice: '1' },
    { cool: false, nice: '2' },
    { cool: null, nice: '3' }
  ])
})

test('Keys with underscore _', () => {
  const one = parse(`foo_bar='baz'`)
  // console.log('two', two)
  assert.equal(one, {foo_bar: 'baz'})

  const two = parse(`
  foo_bar=baz
  wow_cool=rad
  `)
  // console.log('two', two)
  assert.equal(two, {
    [`foo_bar`]: 'baz',
    [`wow_cool`]: 'rad'
  })
})

test('Keys with dash -', () => {
  const keyTest = `foo-bar='baz'`
  const one = parse(keyTest)
  // console.log('two', two)
  assert.equal(one, {
    [`foo-bar`]: 'baz'
  })

  const two = parse(`
  foo-bar=baz
  wow-cool=rad
  `)
  // console.log('two', two)
  assert.equal(two, {
    [`foo-bar`]: 'baz',
    [`wow-cool`]: 'rad'
  })
})

test('Keys with dot .', () => {
  const one = parse(`foo.bar='baz'`)
  // console.log('two', two)
  assert.equal(one, {
    [`foo.bar`]: 'baz'
  })

  const two = parse(`
  foo.bar=baz
  wow.cool=rad
  `)
  // console.log('two', two)
  assert.equal(two, {
    [`foo.bar`]: 'baz',
    [`wow.cool`]: 'rad'
  })
})

test('Keys with number', () => {
  const keyTest = `1=baz`
  const one = parse(keyTest)
  // console.log('two', two)
  assert.equal(one, {
    [`1`]: 'baz'
  })

  const two = parse(`
  foo1=baz
  2=rad
  `)
  // console.log('two', two)
  assert.equal(two, {
    [`foo1`]: 'baz',
    [`2`]: 'rad'
  })
})

test.run()