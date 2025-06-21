const { Bench } = require('tinybench')
const { parse, parseValue, options } = require('../src/index.js')

const bench = new Bench({ time: 100 })

// Test data with varying complexity
const simpleString = "name=bob age=25 isActive=true"
const complexString = `
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
  yes={true}
  isWhat,
  foo={{ rad: ["whatever", "man", "with spaces"], cool: { beans: 'here' } }}
  what='xnxnx'
  isLoading  
`

const multilineString = `
  foo={{
    baz: {
      bar: {
        fuzz: "hello"
      }
    }
  }}
  deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}
`

const arrayString = `key=[ "1", "2", "3", "4", "5" ]`
const objectString = `config={{ host: "localhost", port: 8080, ssl: true }}`

bench
  .add('parse() - simple string', () => {
    parse(simpleString)
  })
  .add('parse() - complex string', () => {
    parse(complexString)
  })
  .add('parse() - multiline nested objects', () => {
    parse(multilineString)
  })
  .add('parse() - array parsing', () => {
    parse(arrayString)
  })
  .add('parse() - object parsing', () => {
    parse(objectString)
  })
  .add('parseValue() - simple value', () => {
    parseValue('"hello world"')
  })
  .add('parseValue() - array value', () => {
    parseValue('[ 1, 2, 3, "four", true ]')
  })
  .add('parseValue() - object value', () => {
    parseValue('{ name: "test", count: 42 }')
  })
  .add('options() - template tag', () => {
    options`name=${'bob'} age=${25} active=${true}`
  })

async function run() {
  console.log('Running oparser benchmarks...\n')
  
  await bench.run()
  
  console.table(bench.table())
  
  console.log('\nBenchmark Results Summary:')
  bench.tasks.forEach(task => {
    console.log(`${task.name}: ${task.result?.hz?.toFixed(2) || 'N/A'} ops/sec`)
  })
}

if (require.main === module) {
  run().catch(console.error)
}

module.exports = { run }