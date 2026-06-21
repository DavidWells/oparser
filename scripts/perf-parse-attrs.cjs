const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { parse } = require('../src')

const writeGolden = process.argv.includes('--write-golden')
const iterations = Number(process.env.OPARSER_PERF_ITERATIONS || 5000)
const goldenDir = path.resolve(__dirname, '../.perf-golden/oparser')

const cases = [
  ['plain-html', 'class="note" id="intro" data-kind="tip" hidden'],
  ['single-quotes', "class='note wide' data-kind='tip'"],
  ['numbers-booleans', 'width={999} height={{111}} cool=true isCool notCool=false'],
  ['style-object', "style={{ color: 'red', marginTop: 2 }} color=\"b'lue\""],
  ['array-prop', `items={["one", "two words", 3, true]} next=2`],
  ['arrow-prop', `onClick={() => console.log('hi')} label="Run"`],
  ['async-arrow-prop', `onSubmit={async (event) => await save(event)} method="post"`],
  ['jsx-value', `icon={<Icon name="zap" />} label="Fast"`],
  ['quoted-delimiters', `title='Wow "this" has =, braces {}, and # hash'`],
  ['comment-tail', 'a=1 // comment\nb=2 # comment'],
  ['url', 'url=https://example.com?a=1&b=2#section other=value'],
  ['object-array', `components={[{ name: "One", props: { active: true } }]}`],
]

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value), null, 2)
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = sortValue(value[key])
      return acc
    }, {})
  }
  return value
}

function runOnce() {
  let bytes = 0
  const outputs = []
  for (const [name, input] of cases) {
    const output = parse(input)
    const serialized = stableStringify(output)
    bytes += serialized.length
    outputs.push({ name, input, output })
  }
  return { bytes, outputs }
}

let finalResult
for (let i = 0; i < iterations; i++) {
  finalResult = runOnce()
}

if (writeGolden) {
  fs.mkdirSync(goldenDir, { recursive: true })
  for (const item of finalResult.outputs) {
    fs.writeFileSync(path.join(goldenDir, `${item.name}.json`), `${stableStringify(item.output)}\n`)
  }
}

const digest = sha256(JSON.stringify(finalResult.outputs))
console.log(JSON.stringify({
  corpus: 'oparser',
  cases: cases.length,
  iterations,
  parses: cases.length * iterations,
  bytes: finalResult.bytes,
  digest,
  wroteGolden: writeGolden,
}))
