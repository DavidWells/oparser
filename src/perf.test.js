const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parse } = require('./')
// const { parse, parseValue } = require('../')

function elapsedMs(fn) {
  const started = process.hrtime.bigint()
  fn()
  return Number(process.hrtime.bigint() - started) / 1e6
}

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

test('quoted delimiter adversarial inputs stay bounded', () => {
  const cases = [
    ['spaces in double quotes', `key="${' '.repeat(2000)}"`],
    ['hashes in double quotes', `key="${'#'.repeat(2000)}"`],
    ['slashes in double quotes', `key="${'//'.repeat(2000)}"`],
  ]

  cases.forEach(([name, input]) => {
    const ms = elapsedMs(() => parse(input))
    assert.ok(ms < 150, `${name} took ${ms.toFixed(2)}ms`)
  })
})

test.run()
