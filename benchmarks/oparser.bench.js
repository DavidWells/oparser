const { Bench } = require('tinybench')
const { parse, parseValue, options } = require('../src/index.js')
const { parse: parseV2, parseValue: parseValueV2, options: optionsV2 } = require('../src/index-v2.js')
const { parse: parseV3, parseValue: parseValueV3, options: optionsV3 } = require('../src/index-v3.js')

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
  // Original version benchmarks
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
  // V2 optimized version benchmarks
  .add('parseV2() - simple string', () => {
    parseV2(simpleString)
  })
  .add('parseV2() - complex string', () => {
    parseV2(complexString)
  })
  .add('parseV2() - multiline nested objects', () => {
    parseV2(multilineString)
  })
  .add('parseV2() - array parsing', () => {
    parseV2(arrayString)
  })
  .add('parseV2() - object parsing', () => {
    parseV2(objectString)
  })
  .add('parseValueV2() - simple value', () => {
    parseValueV2('"hello world"')
  })
  .add('parseValueV2() - array value', () => {
    parseValueV2('[ 1, 2, 3, "four", true ]')
  })
  .add('parseValueV2() - object value', () => {
    parseValueV2('{ name: "test", count: 42 }')
  })
  .add('optionsV2() - template tag', () => {
    optionsV2`name=${'bob'} age=${25} active=${true}`
  })
  // V3 optimized version benchmarks
  .add('parseV3() - simple string', () => {
    parseV3(simpleString)
  })
  .add('parseV3() - complex string', () => {
    parseV3(complexString)
  })
  .add('parseV3() - multiline nested objects', () => {
    parseV3(multilineString)
  })
  .add('parseV3() - array parsing', () => {
    parseV3(arrayString)
  })
  .add('parseV3() - object parsing', () => {
    parseV3(objectString)
  })
  .add('parseValueV3() - simple value', () => {
    parseValueV3('"hello world"')
  })
  .add('parseValueV3() - array value', () => {
    parseValueV3('[ 1, 2, 3, "four", true ]')
  })
  .add('parseValueV3() - object value', () => {
    parseValueV3('{ name: "test", count: 42 }')
  })
  .add('optionsV3() - template tag', () => {
    optionsV3`name=${'bob'} age=${25} active=${true}`
  })

async function run() {
  console.log('Running oparser benchmarks (Original vs V2 vs V3 Optimized)...\n')
  
  await bench.run()
  
  console.table(bench.table())
  
  console.log('\nBenchmark Results Summary:')
  
  // Group results by test type for easier comparison
  const results = {}
  bench.tasks.forEach(task => {
    const hz = task.result?.hz?.toFixed(2) || 'N/A'
    console.log(`${task.name}: ${hz} ops/sec`)
    
    // Extract test type and version for comparison
    const match = task.name.match(/(parse(?:Value)?(?:V[23])?)\(\) - (.+)/) || task.name.match(/(options(?:V[23])?)\(\) - (.+)/)
    if (match) {
      const [, func, testType] = match
      const isV2 = func.includes('V2')
      const isV3 = func.includes('V3')
      const baseFunc = func.replace(/V[23]/, '')
      
      if (!results[testType]) results[testType] = {}
      if (isV2) {
        results[testType]['v2'] = parseFloat(hz) || 0
      } else if (isV3) {
        results[testType]['v3'] = parseFloat(hz) || 0
      } else {
        results[testType]['v1'] = parseFloat(hz) || 0
      }
    }
  })
  
  console.log('\n📊 Performance Comparison:')
  Object.entries(results).forEach(([testType, versions]) => {
    if (versions.v1) {
      let output = `\n${testType}:`
      
      if (versions.v2) {
        const improvement2 = ((versions.v2 - versions.v1) / versions.v1 * 100).toFixed(1)
        const speedup2 = (versions.v2 / versions.v1).toFixed(2)
        const isFaster2 = versions.v2 > versions.v1
        const arrow2 = isFaster2 ? '↗️' : '↘️'
        const status2 = isFaster2 ? 'FASTER' : 'SLOWER'
        output += `\n  V2: ${arrow2} ${improvement2}% (${speedup2}x) [${status2}]`
      }
      
      if (versions.v3) {
        const improvement3 = ((versions.v3 - versions.v1) / versions.v1 * 100).toFixed(1)
        const speedup3 = (versions.v3 / versions.v1).toFixed(2)
        const isFaster3 = versions.v3 > versions.v1
        const arrow3 = isFaster3 ? '↗️' : '↘️'
        const status3 = isFaster3 ? 'FASTER' : 'SLOWER'
        output += `\n  V3: ${arrow3} ${improvement3}% (${speedup3}x) [${status3}]`
      }
      
      console.log(output)
    }
  })

  // Add summary statistics
  console.log('\n📈 Summary:')
  let v2Wins = 0, v3Wins = 0, totalTests = 0
  
  Object.entries(results).forEach(([testType, versions]) => {
    if (versions.v1) {
      totalTests++
      if (versions.v2 && versions.v2 > versions.v1) v2Wins++
      if (versions.v3 && versions.v3 > versions.v1) v3Wins++
    }
  })
  
  console.log(`V2 wins: ${v2Wins}/${totalTests} tests`)
  console.log(`V3 wins: ${v3Wins}/${totalTests} tests`)
  
  // Find best performing version for each test
  console.log('\n🏆 Best Performance by Test:')
  Object.entries(results).forEach(([testType, versions]) => {
    if (versions.v1) {
      const performances = [
        { version: 'V1', value: versions.v1 },
        ...(versions.v2 ? [{ version: 'V2', value: versions.v2 }] : []),
        ...(versions.v3 ? [{ version: 'V3', value: versions.v3 }] : [])
      ]
      
      const best = performances.reduce((max, curr) => 
        curr.value > max.value ? curr : max
      )
      
      console.log(`  ${testType}: ${best.version} (${best.value.toFixed(2)} ops/sec)`)
    }
  })
}

if (require.main === module) {
  run().catch(console.error)
}

module.exports = { run }