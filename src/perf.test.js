const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parse } = require('./')
// const { parse, parseValue } = require('../')

function assertWrappedJsonFixture(file) {
  const contents = fs.readFileSync(path.join(__dirname, 'fixtures', file), 'utf8')
  const expected = JSON.parse(contents)
  const val = parse(`
planets = ${contents}
`)

  assert.equal(val, { planets: expected })
}

test('1.8mb json', () => {
  assertWrappedJsonFixture('1-point-8-mb.json')
})

test('4k json', () => {
  assertWrappedJsonFixture('4000-chars.json')
})

test('10k json', () => {
  assertWrappedJsonFixture('10000-chars.json')
})

test('20k json', () => {
  assertWrappedJsonFixture('20000-chars.json')
})

test.run()
