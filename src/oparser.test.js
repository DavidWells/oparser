const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parse, parseValue } = require('./')
const { convert } = require('./utils/convert')
// const { parse, parseValue } = require('../')


/************************************************************************************************************
 * String values
 *********************************************************************************************************************************************************/

test('Simple string equal (no quotes with spaces). key = value', () => {
  const answer = { bob: 'cool' }
  const one = parse(`bob = cool`)
  const two = parse(`bob= cool`)
  const three = parse(`bob =cool`)
  //*
  // console.log('one', one)
  // console.log('two', two)
  // console.log('three', three)
  /** */
  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
})

test(`Simple string equal (single ' quote)`, () => {
  const parsedValue = parse(`bob='cool'`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (double " quotes)', () => {
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
  // Ensure booleans are booleans
  assert.equal(parse(`thingy=true`), { thingy: true })
  assert.equal(parse(`thingy=false`), { thingy: false })
})

test('Simple string equal (backticks `)', () => {
  const parsedValue = parse("bob=`cool`")
  assert.equal(parsedValue, {
    bob: 'cool',
  })

  const parsedValueTwo = parse("bob='`cool`'")
  assert.equal(parsedValueTwo, {
    bob: '`cool`',
  })
})

test('Simple strings mixed', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool',
    johnny: 'cool',
    sally: 'cool',
    susy: 'cool'
  }
  const one = parse(`
  bob = cool
  joe=cool
  bill="cool"
  steve='cool'
  johnny=\`cool\`
  sally={\`cool\`}
  susy={{\`cool\`}}
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)

  // const two = parse(`bob = cool joe=cool bill="cool" steve='cool' johnny=\`cool\` sally={\`cool\`} susy={{\`cool\`}}`)
  // assert.equal(two, answer)
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

/************************************************************************************************************
 * Nested quotes
 ***********************************************************************************************************/

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
  }, 'five')

  const six = parse(`title="Wow \"this\" is great"`)
  assert.equal(six, {
    title: 'Wow "this" is great',
  }, 'six')

  const seven = parse(`title='Wow "this" is great'`)
  assert.equal(seven, {
    title: 'Wow "this" is great',
  }, 'seven')

  const eight = parse(`title='Wow \'this\' is great'`)
  assert.equal(eight, {
    title: "Wow 'this' is great",
  }, 'eight')
})

test('Escape conflicting quote chars', () => {
  const eight = parse(`title='Wow \'this\' is great'`)
  assert.equal(eight, {
    title: "Wow 'this' is great",
  }, 'eight')
})


test('Escape conflicting double quote chars', () => {
  const six = parse(`title="Wow \"this\" is great"`)
  assert.equal(six, {
    title: 'Wow "this" is great',
  }, 'six')
})


test('Escape conflicting double quote chars', () => {
  // const eight = parse(`title='Wow \\'this\\' is great'`)
  // assert.equal(eight, {
  //   title: "Wow 'this' is great",
  // }, 'eight')

  // const nine = parse(`title="Wow \\"this\\" is great"`)
  // assert.equal(nine, {
  //   title: 'Wow "this" is great',
  // }, 'eight')
})

/************************************************************************************************************
 * Number values
 ***********************************************************************************************************/

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

test('Simple numbers single line w/ other values', () => {
  const one = parse(`isCool=20 chill cool='hi'`)
  assert.equal(one, { isCool: 20, chill: true, cool: 'hi' })

  const two = parse(`isCool=20.2 chill cool='hi'`)
  assert.equal(two, { isCool: 20.2, chill: true, cool: 'hi'  })

  const three = parse(`isCool={20.2} chill cool='hi'`)
  assert.equal(three, { isCool: 20.2, chill: true, cool: 'hi'  })

  const four = parse(`isCool={{20.2}} chill cool='hi'`)
  assert.equal(four, { isCool: 20.2, chill: true, cool: 'hi'  })

  const five = parse(`isCool=0 chill cool='hi'`)
  assert.equal(five, { isCool: 0, chill: true, cool: 'hi'  })

  const sixAsString = parse(`isCool="0" chill cool='hi'`)
  assert.equal(sixAsString, { isCool: "0", chill: true, cool: 'hi'  })

  const decimal = parse(`isCool=0.22 chill cool='hi'`)
  assert.equal(decimal, { isCool: 0.22, chill: true, cool: 'hi'  })

  const brackets = parse(`isCool={0.22} chill cool='hi'`)
  assert.equal(brackets, { isCool: 0.22, chill: true, cool: 'hi'  })
})

/************************************************************************************************************
 * Boolean values
 ***********************************************************************************************************/

test('Simple boolean no value', () => {
  const answer = { isCool: true }
  const one = parse(`isCool`)
  assert.equal(one, answer, 'one')
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

  assert.equal(one, answer, 'one')
  assert.equal(two, answer, 'two')
  assert.equal(three, answer, 'three')
  assert.equal(four, answer, '4')
  assert.equal(fourx, answer, 'fourx')
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
  // console.log('one', one)
  assert.equal(one, { 
    bob: 'cool',
    joe: 'cool',
    isRad: true,
    isWow: true,
    bill: "cool",
    isNotCool: false,
    steve: 'cool',
    isCool: true
  })
})

/************************************************************************************************************
 * Comment tests
 ***********************************************************************************************************/

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

test("Handles internal comments in value conflicts", () => {
  const x = parse(`
// js single line comment
/* js single line comment block */
# hash style comment

valueDoubleQ="with /* comment */ inside"

valueSingleQ='with /* comment */ inside'

valueSingleMultiQ='
Multi 'line' with
comment /* comment */ 
inside
'

valueDoubleMultiQ="
Multi "line" with
comment /* comment */ 
inside
"

what='
  // escaped js single line comment
  import {foo} from 'lodash'
  /* escaped js single line comment block */
  import {bar} from "lodash"
  # escaped hash style comment
  import {zaz} from 'lodash'
'

object={{ rad: ["with a /* comment */ inside", "cool"], cool: { beans: 'dude' } }}

/* key value in comment test=two */

/************************************************************************************************************
 * Large Comments
 ***********************************************************************************************************/

actual=value

actualTwo=value # trailing hash style comment
actualThree=value // trailing js single line comment
actualFour=value /* trailing js single line comment block */

actualFive='value' # trailing hash style comment
actualSix='value' // trailing js single line comment
actualSeven='value' /* trailing js single line comment block */

actualEight="value" # trailing hash style comment
actualNine="value" // trailing js single line comment
actualTen="value" /* trailing js single line comment block */
boo="hello"
  `)
  // console.log('x', x)
  assert.equal(x, {
    valueDoubleQ: 'with /* comment */ inside',
    valueSingleQ: 'with /* comment */ inside',
    valueSingleMultiQ: '\nMulti \'line\' with\ncomment /* comment */ \ninside\n',
    valueDoubleMultiQ: '\nMulti "line" with\ncomment /* comment */ \ninside\n',
    what: '\n' +
      '  // escaped js single line comment\n' +
      "  import {foo} from 'lodash'\n" +
      '  /* escaped js single line comment block */\n' +
      '  import {bar} from "lodash"\n' +
      '  # escaped hash style comment\n' +
      "  import {zaz} from 'lodash'\n",
    object: {
      rad: [ 'with a /* comment */ inside', 'cool' ],
      cool: { beans: 'dude' }
    },
    actual: 'value',
    actualTwo: 'value',
    actualThree: 'value',
    actualFour: 'value',
    actualFive: 'value',
    actualSix: 'value',
    actualSeven: 'value',
    actualEight: 'value',
    actualNine: 'value',
    actualTen: 'value',
    boo: 'hello'
  })
})

/************************************************************************************************************
 * Edge cases
 ***********************************************************************************************************/

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
  const four = parse(`
  funny='stirng======with====lots=of=equals'
  `)
  assert.equal(four, {
    funny: 'stirng======with====lots=of=equals'
  }, 'four')
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
  // console.log('parsedValue commas', one)
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
    nice: '*!',
    wow: '*-*',
    trill: "**_**",
    haha: "***",
    rad: "*****"
  }
  const one = parse(`
  funny='*'
  cool=*!
  nice=  *!
  wow=*-*
  trill={**_**}
  haha={{***}}
  rad="*****"
  `)
  // console.log('handles *', one)
  assert.equal(one, answer)
})

test('Handles inner curly brackets {}', () => {
  const answer = {
    funny: '${funky}',
    two: "xval}",
    three: "weirdval}",
  }
  const one = parse(`
  funny='\${funky}'
  two={{xval}}}
  three={weirdval}}
  `)
  // console.log('handles {}', one)
  assert.equal(one, answer)
})

test.skip('Handles inner curly brackets {}', () => {
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
  console.log('one weird brackets', one)
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
  }, 'one')
  const two = parse("what='no,md'")
  assert.equal(two, {
    what: 'no,md',
  }, 'two')
  const three = parse('what="no,md"')
  assert.equal(three, {
    what: 'no,md',
  }, 'three')
  const trimExtraTrailingComma = parse('what="no,md",')
  assert.equal(trimExtraTrailingComma, {
    what: 'no,md',
  }, 'trimExtraTrailingComma')
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
  // console.log('multiline values', one)
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
    import {bar} from "lod"ash"
    import {zaz} from 'lodash'
  '
  bar=true
  `)
  // console.log('multiline values singe quotes', one)
  assert.equal(one, {
    baz: 'yolo',
    what: `
    import {foo} from 'lodash'
    import {bar} from "lod"ash"
    import {zaz} from 'lodash'
  `,
   bar: true
  })
})

test('Handles multiline values mixed quotes (indentation matters)', () => {
  const one = parse(`
  baz="yolo"
  what='
    import {foo} from 'lodash'
    import {bar} from "lodash"
    import {zaz} from 'lodash'
  '
  chill="
    import {foo} from 'lodash'
    import {bar} from "lodash"
    import {zaz} from 'lodash'
  "
  
  bar=true
  `)
  // console.log('multiline values mixed quotes', one)
  assert.equal(one, {
    baz: 'yolo',
    what: `
    import {foo} from 'lodash'
    import {bar} from "lodash"
    import {zaz} from 'lodash'
  `,
   chill: `
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
  // console.log('multiline values {`reactStyle`}', one)
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

/************************************************************************************************************
 * Array values
 ***********************************************************************************************************/

test('Simple array', () => {
  const y = parse(`key=[ 1, 2, 3 ]`)
  assert.equal(y, { key: [ 1, 2, 3 ] })

  const z = parse(`key=[ "1", "2", "3" ]`)
  assert.equal(z, { key: [ "1", "2", "3" ] })

  const trailingComma = parse(`key=[ "1", "2", "3", ]`)
  assert.equal(trailingComma, { key: [ "1", "2", "3" ] })

  const a = parse(`key=[ one, two, three ]`)
  assert.equal(a, { key: [ "one", "two", "three" ] })

  const one = parse(`great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} `)
  assert.equal(one, { great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] })
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

test('raw array', () => {
  const a = parse(`key=[ true, two, "three", 2, ["nested", "array"], ["nested", "arrayTwo"]]`)
  assert.equal(a, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  }, 'complex array 1')
})

test('Complex array with array', () => {
  const a = parse(`key=[ true, two, "three", 2, ["nested", "array"], ["nested", "arrayTwo"]]`)
  assert.equal(a, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  }, 'complex array 1')

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

test('JSX handles multiline elements', () => {
  const a = parse(`
  customElement={(
    <div>Custom div</div>
  )} 
  singleLine={(<span style={{ color: 'blue' }} color="b"lue">This should be blue</span>)} 
  htmlContent={(
    <span style={{ color: 'red' }} color="b'lue">This should be red too</span>
  )}
  other={
    (
      <span style={{ color: 'yellow' }} color="b'lue">
        This should be yellow
      </span>
    )
  }
`)
  // console.log('ajsx', a)
  assert.equal(a, {
    customElement: '\n    <div>Custom div</div>\n  ',
    singleLine: `<span style={{ color: 'blue' }} color="b"lue">This should be blue</span>`,
    htmlContent: '\n' +
      `    <span style={{ color: 'red' }} color="b'lue">This should be red too</span>\n` +
      '  ',
    other: '\n' +
      `      <span style={{ color: 'yellow' }} color="b'lue">\n` +
      '        This should be yellow\n' +
      '      </span>\n' +
      '    '
  })
})


test("JSX elements", () => {
  assert.equal(
    parseValue("{<span style={ { color:'green' } }>jsx style</span>}"), 
    "<span style={ { color:'green' } }>jsx style</span>", 
    'JSX one'
  )

  assert.equal(
    parseValue("{<span style={{color:'green'}}>jsx style</span>}"), 
    "<span style={{color:'green'}}>jsx style</span>", 
    'JSX two'
  )

  assert.equal(
    parseValue("{<span style={ {color:'green'} }>jsx style</span>}"),
    "<span style={ {color:'green'} }>jsx style</span>", 
    'JSX three'
  )

  assert.equal(
    parseValue("{<span prop={{ foo: 'hasBracket}' }}>jsx style</span>}"),
    "<span prop={{ foo: 'hasBracket}' }}>jsx style</span>", 
    'JSX four'
  )

  assert.equal(
    parseValue("{{<span prop={{ foo: 'hasBracket}' }}>jsx style</span>}}"),
    "<span prop={{ foo: 'hasBracket}' }}>jsx style</span>", 
    'JSX five'
  )
})

test("JSX multiline element brackets", () => {
  const x = parse(`
tester={{
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
}}
  `)
  assert.equal(x,
    {
      tester: `
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
`
    },
    'JSX four'
  )
})

test("JSX multiline element single quote", () => {
  const x = parse(`
tester={'
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
'}
  `)
  assert.equal(x,
    {
      tester: `
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
`
    },
  )
})

test("JSX multiline element double quote", () => {
  const x = parse(`
tester={"
  <span prop={{ foo: 'hasBra"cket}' }}>
    jsx style
  </span>
"}
  `)
  assert.equal(x,
    {
      tester: `
  <span prop={{ foo: 'hasBra"cket}' }}>
    jsx style
  </span>
`
    },
  )
})

test("JSX multiline element ticks `", () => {
  const x = parse(`
tester={\`
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
\`}
  `)
  assert.equal(x,
    {
      tester: `
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
`
    },
  )
})

test("JSX multiline element parens (", () => {
  const x = parse(`
tester={(
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
)}
  `)
  assert.equal(x,
    {
      tester: `
  <span prop={{ foo: 'hasBracket}' }}>
    jsx style
  </span>
`
    },
  )
})

// This doesnt work
test("JSX elements two", () => {
  // console.log('DEBUG')
  const x = parse(`
    tester={{<span prop={{ foo: 'hasBracket}' }}>jsx style</span>}}
  `) 
  // console.log('x', x)
  assert.equal(
    x,
    {
      tester: `<span prop={{ foo: 'hasBracket}' }}>jsx style</span>`
    },
    'JSX four'
  )
})

/************************************************************************************************************
 * Object values
 ***********************************************************************************************************/

test('raw object', () => {
  const answer = { key: { a: 'b' } }
  const five = `key={ a : b }`
  const x = parse(five)
  // console.log('x', x)
  assert.equal(answer, x, five)
})

test('Simple object', () => {
  const answer = { key: { a: 'b' } }
  const one = `key={{ "a": "b" }}`
  assert.equal(answer, parse(one), one)
  const two = `key={{ "a": b }}`
  assert.equal(answer, parse(two), two)
  const three = `key={{ a: "b" }}`
  assert.equal(answer, parse(three), three)
  const four = `key={{ a: b }}`
  assert.equal(answer, parse(four), four)
  const five = `key={ a : b }`
  assert.equal(answer, parse(five), five)
  const six = `key={{ a : b }}`
  assert.equal(answer, parse(six), six)

  const answerTwo = { nice: { value: 'nice', cool: 'true', awesome: false } }
  const a = parse(`nice={{ value: nice, cool: "true", awesome: false, }}`)
  assert.equal(a, answerTwo)
  const b = parse(`nice={{
    value: nice,
    cool: "true",
    awesome: false
  }}`)
  assert.equal(b, answerTwo)
})


test('Object jsx style weird yyy', () => {
  const d = parse(`style='color: red;' color="b'lue"`)
  // console.log('d', d)
  assert.equal(d, {
    style: 'color: red;',
    color: "b'lue",
  }, 'd')
})

test('Handles unbalanced single quote in multiline', () => {
  const d = parse(`
class='foo' 
style='color: red;'
color="b'lue"
`)
  // console.log('d', d)
  assert.equal(d, {
    class: 'foo',
    style: 'color: red;',
    color: "b'lue",
  }, 'd')
})

test('Handles unbalanced double quote in multiline', () => {
  const d = parse(`
class="foo" 
style="color: red;"
color='b"lue'
`)
  // console.log('d', d)
  assert.equal(d, {
    class: 'foo',
    style: 'color: red;',
    color: 'b"lue',
  }, 'd')
})

test('Multiline jsx style prop', () => {
  const five = `
  class='foo'
  style='color: red; margin: 20px; display: block;'
  color="b'lue"
  funky={\`
  <Wow>
    <Rad>xyz</Rad>
    <Fake>booo</Fake>
  </Wow>
  \`}
`
  const x = parse(five)
  // console.log('x', x)
  assert.equal(x, {
    class: 'foo',
    style: 'color: red; margin: 20px; display: block;',
    color: "b'lue",
    funky: `
  <Wow>
    <Rad>xyz</Rad>
    <Fake>booo</Fake>
  </Wow>
  `
  }, five)
})

test('Object jsx style weird xxx', () => {
  const d = parse(`
  style='color: red;'
  color="b'lue"
  what='
  import {foo} from 'lodash'
import {bar} from 'lodash'
import {zaz} from 'lodash'
'
`)
  // console.log('d', d)
  assert.equal(d, {
    style: 'color: red;',
    color: "b'lue",
    what: `
  import {foo} from 'lodash'
import {bar} from 'lodash'
import {zaz} from 'lodash'
`
  }, 'd')
})


test('Object jsx style weird on', () => {
  const d = parse(`
  style={{
    color: 'red', 
    whatever: "co'ol",
  }}
  foo={{ rad: ["whatever", "man", "with spaces", 2], cool: { beans: 'here' } }}
  color="blue"
  cool='testhdhdhd'
`)
  assert.equal(d, {
    style: { color: 'red', whatever: "co'ol"  },
    foo: { rad: ["whatever", "man", "with spaces", 2], cool: { beans: 'here' } },
    color: "blue",
    cool: 'testhdhdhd'
  }, 'd')
})

test('JSON', () => {
  const json = {
    "widget": {
      "debug": "on",
      "window": {
        "title": "Sample Konfabulator Widget",
        "name": "main_window",
        "width": 500,
        "height": 500
      },
      "image": {
        "src": "Images/Sun.png",
        "name": "sun1",
        "hOffset": 250,
        "vOffset": 250,
        "alignment": "center",
        "array": ["one", "two", "three"]
      },
      "text": {
        "data": "Click Here",
        "size": 36,
        "style": "bold",
        "name": "text1",
        "hOffset": 250,
        "vOffset": 100,
        "alignment": "center",
        "onMouseUp": "sun1.opacity = (sun1.opacity / 100) * 90;"
      }
    }
  }

  const jsonString = `
  widget={
      "debug": "on",
      "window": {
        "title": "Sample Konfabulator Widget",
        "name": "main_window",
        "width": 500,
        "height": 500
      },
      "image": {
        "src": "Images/Sun.png",
        "name": "sun1",
        "hOffset": 250,
        "vOffset": 250,
        "alignment": "center",
        "array": ['one', 'two', 'three'],
      },
      "text": {
        "data": "Click Here",
        "size": 36,
        "style": "bold",
        "name": "text1",
        "hOffset": 250,
        "vOffset": 100,
        "alignment": "center",
        "onMouseUp": "sun1.opacity = (sun1.opacity / 100) * 90;"
      }
    }
  `
  const b = parse(jsonString)
  assert.equal(b, json, 'json example')
})

test('Object jsx style single line', () => {
  const answer = {
    style: { color: 'red' },
    color: "b'lue",
    cool: 'test"hdhdhd'
  }
  const a = parse(`cool='test"hdhdhd' style={{ color: 'red' }} color="b'lue"`)
  assert.equal(a, answer, 'a')

  const b = parse(`style={{ color: 'red' }} cool='test"hdhdhd' color="b'lue"`)
  assert.equal(b, answer, 'b')

  const c = parse(`style={{ color: 'red' }} color="b'lue" cool='test"hdhdhd'`)
  assert.equal(c, answer, 'c')
})

test('Object jsx style weird', () => {
  const d = parse(`
  style={{
    color: 'red', 
    whatever: "co'ol",
  }}
  foo={{ rad: ["whatever", "man", "with spaces", 2], cool: { beans: 'here' } }}
  color="blue"
  cool='testhdhdhd'`)
  assert.equal(d, {
    style: { color: 'red', whatever: "co'ol"  },
    foo: { rad: ["whatever", "man", "with spaces", 2], cool: { beans: 'here' } },
    color: "blue",
    cool: 'testhdhdhd'
  }, 'd')
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

const smallExample = `width={999} 
  height={{111}}
  numberAsString="12345"   
 great={["scoot", "sco ot", 'scooo ttt']} 
 nice={{ value: nice, cool: "true" }}
 soclose=[jdjdjd, hdhfhfhffh]`


test('smallExample Multi line', () => {
  const parsedValue = parse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: "12345",   
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nice: { value: 'nice', cool: 'true' },
    soclose: [ 'jdjdjd', 'hdhfhfhffh' ],
  })
})

test('Multi line small', () => {
  const parsedValue = parse(`
  /* comment */
   great={["scoot", "sco ot", 'scooo ttt']} 
 nice={{ value: nice, cool: "true" }}
 foo={{ rad: ["whatever", "man", "with spaces"], cool: { beans: 'here' } }}
 # other comment
 what='xnxnx'
 isLoading  `)
  // console.log('Multi line small', parsedValue)
  assert.equal(parsedValue, {
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nice: { value: 'nice', cool: 'true' },
    foo: {
      rad: [ 'whatever', 'man', 'with spaces' ],
      cool: { beans: 'here' }
    },
    what: 'xnxnx',
    isLoading: true
  }, 'matches original')
})

test('Multi line', () => {
  const parsedValue = parse(`
width={999} 
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
 deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}
  
  `)
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


test('Trailing commas objects - parseValue', () => {
  const multiLineTwo = 
`
[
  {"cool": true, "nice": "1" },
  {"cool": false, "nice": "2",,,,},
  {"cool": null, "nice": "3",},
]
`
  const two = parseValue(multiLineTwo)
  //console.log('twox', typeof two)
  assert.equal(two, [
    { cool: true, nice: '1' },
    { cool: false, nice: '2' },
    { cool: null, nice: '3' }
  ])
})

test('Trailing commas wierd objects - parseValue', () => {
  const multiLineTwo = 
`
[
  {"cool": true, "nice": "1", chunky: { foo: "bar", }, array: [ 'hello', 'there', ]},
  {"cool": false, "nice": "2",,,,},
  {"cool": null, "nice": "3",},
]
`
  const two = parseValue(multiLineTwo)
  // console.log('two', two)
  assert.equal(two, [
    {
      cool: true,
      nice: '1',
      chunky: { foo: 'bar' },
      array: [ 'hello', 'there' ]
    },
    { cool: false, nice: '2' },
    { cool: null, nice: '3' }
  ])
})


/************************************************************************************************************
 * MISC
 ***********************************************************************************************************/

test.skip('Weird ones', () => {
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

test('reactProp func', () => {
  const five = `isCool onClick={"() => { console.log('h i')}"}`
  // console.log('five', five)
  assert.equal(parse(five), {
    isCool: true,
    onClick: `() => { console.log('h i')}`,
  }, 'five')
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
    onClick: `() => { console.log('h i')}`,
  }, 'five')

  // const six = `onClick=() => {
  //   console.log('h i')
  //   console.log("cool stuuf")
  // }`
  // assert.equal(parse(six), {
  //   onClick: "() => { console.log('h i')}",
  // }, six)
})


test('Single line bools', () => {
  const one = parse(`single line bools`)
  assert.equal(one, {
    single: true,
    line: true,
    bools: true,
  })
})

test('Weird linebreak escape', () => {
  const val = parse(` href="foo\
bar"`)
  assert.equal(val, { href: 'foobar' })
})

test('Weird linebreak escape two', () => {
  const val = parse(` href="foo\\
bar"`)
  assert.equal(val, { href: 'foo\\\nbar' })
})

test('inline jsx fn _≡►', () => {
  const val = parse(`onClick={()_≡► _alert('hi')}`)
  assert.equal(val, { onClick: "()_≡► _alert('hi')" })
})

test('inline jsx fn =>', () => {
  const val = parse(`onClick={() => _alert('hi')}`)
  assert.equal(val, { onClick: "() => _alert('hi')" })
})

test('inline jsx fn multiline', () => {
  const val = parse(`onClick={() => {
    alert('hi')
  }
}`)
  assert.equal(val, { onClick: `() => {
    alert('hi')
  }
`})
})

test('JSX fn multiline three', () => {
  const val = parse(`
onClick={() => {
  console.log('hi')
}}
`)
  assert.equal(val, { onClick: `() => {
  console.log('hi')
}` })
})


test('JSX fn multiline async', () => {
  const val = parse(`
onClick={async () => {
  console.log('hi')
}}
`)
  assert.equal(val, { onClick: `async () => {
  console.log('hi')
}` })
})


test('JSX fn multiline async named fn', () => {
  const val = parse(`
onClick={async function foo() => {
  console.log('hi')
}}
`)
  assert.equal(val, { onClick: `async function foo() => {
  console.log('hi')
}` })
})

test('JSX fn multi multi line fn', () => {
  const val = parse(`
onClick={() => {
  console.log('hi')
  alert('foo')
  console.log("bar")
}}
`)
  assert.equal(val, { onClick: `() => {
  console.log('hi')
  alert('foo')
  console.log("bar")
}` })
})


test.run()