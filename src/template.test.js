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

test.run()