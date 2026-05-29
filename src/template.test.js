const { test } = require('uvu') 
const assert = require('uvu/assert')
const { options } = require('./')

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

test('Template tag substitutions', () => {
  const one = options`count=${1} label=${'two'} enabled=${true}`
  assert.equal(one, {
    count: 1,
    label: 'two',
    enabled: true
  })

  const two = options`items=${['one', 'two']} config=${{ cool: true, count: 2 }}`
  assert.equal(two, {
    items: ['one', 'two'],
    config: {
      cool: true,
      count: 2
    }
  })

  const three = options`name=${'David Wells'} config=${{ label: 'two words' }} none=${null} missing=${undefined}`
  assert.equal(three, {
    name: 'David Wells',
    config: {
      label: 'two words'
    },
    none: null,
    missing: ''
  })
})

test('Template tag handles objects with embedded quotes', () => {
  const one = options`a=${{ s: 'a"b' }}`
  assert.equal(one, { a: { s: 'a"b' } })

  const two = options`a=${{ s: "a'b" }}`
  assert.equal(two, { a: { s: "a'b" } })

  const three = options`a=${[{ x: 'has "quote"' }]}`
  assert.equal(three, { a: [{ x: 'has "quote"' }] })

  const four = options`a=${{ 'spaced key': 1, normal: 2 }}`
  assert.equal(four, { a: { 'spaced key': 1, normal: 2 } })
})

test.run()
