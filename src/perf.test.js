const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parse, parseValue } = require('./')
const { convert } = require('./utils/convert')
// const { parse, parseValue } = require('../')


function testWithTime(title, fn) {
  console.time(title)
  fn()
  console.timeEnd(title)
}

// Too slow. TODO have faster key = JSON checks
test.skip('1.8mb json', () => {
  let contents = fs.readFileSync(path.join(__dirname, 'fixtures', '1-point-8-mb.json'), 'utf8')

  const val = parse(`
planets = ${contents}
`)
console.log('val', val)
})

test('4k json', () => {
  let contents = fs.readFileSync(path.join(__dirname, 'fixtures', '4000-chars.json'), 'utf8')

  const val = parse(`
planets = ${contents}
`)
console.log('val', val)
})

test('10k json', () => {
  let contents = fs.readFileSync(path.join(__dirname, 'fixtures', '10000-chars.json'), 'utf8')

  const val = parse(`
planets = ${contents}
`)
console.log('val', val)
})

test('20k json', () => {
  let contents = fs.readFileSync(path.join(__dirname, 'fixtures', '20000-chars.json'), 'utf8')

  const val = parse(`
planets = ${contents}
`)
console.log('val', val)
})

test.run()