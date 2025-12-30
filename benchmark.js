// Simple benchmark runner - runs tests N times and records durations
const { execSync } = require('child_process')
const fs = require('fs')

const RUNS = 10
const TEST_CMD = 'node src/oparser.test.js'
const RESULTS_FILE = 'benchmark-results.txt'

function extractDuration(output) {
  const match = output.match(/Duration:\s+([\d.]+)ms/)
  return match ? parseFloat(match[1]) : null
}

function runBenchmark(label) {
  const durations = []

  console.log(`\n=== ${label} ===`)
  console.log(`Running ${RUNS} iterations...`)

  for (let i = 0; i < RUNS; i++) {
    try {
      const output = execSync(TEST_CMD, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      const duration = extractDuration(output)
      if (duration) {
        durations.push(duration)
        process.stdout.write(`  Run ${i + 1}: ${duration}ms\n`)
      }
    } catch (e) {
      // Test might write to stderr, check stdout from error
      const output = e.stdout || ''
      const duration = extractDuration(output)
      if (duration) {
        durations.push(duration)
        process.stdout.write(`  Run ${i + 1}: ${duration}ms\n`)
      } else {
        console.log(`  Run ${i + 1}: failed to extract duration`)
      }
    }
  }

  if (durations.length === 0) {
    console.log('No durations captured')
    return null
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const min = Math.min(...durations)
  const max = Math.max(...durations)

  const stats = {
    label,
    runs: durations.length,
    avg: avg.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    durations
  }

  console.log(`\nStats: avg=${stats.avg}ms, min=${stats.min}ms, max=${stats.max}ms`)
  return stats
}

// Get label from args or use timestamp
const label = process.argv[2] || `run-${Date.now()}`
const stats = runBenchmark(label)

if (stats) {
  // Append to results file
  const line = `${label}: avg=${stats.avg}ms, min=${stats.min}ms, max=${stats.max}ms (${stats.runs} runs)\n`
  fs.appendFileSync(RESULTS_FILE, line)
  console.log(`\nSaved to ${RESULTS_FILE}`)
}
