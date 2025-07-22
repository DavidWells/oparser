function invertQuotes(str, quoteType, objectType) {
  // log('Original', str)
  // const replaceOuterQuotes = new RegExp(`(${quoteType})(?=(?:[^${quoteType}]|${quoteType}[^]*${quoteType})*)`, 'g')
  // log('replaceOuterQuotes', replaceOuterQuotes)
  const quotePairsRegex = new RegExp(`${quoteType}[^\\\\${quoteType}]*(\\\\${quoteType}[^\\\\${quoteType}]*)*${quoteType}`, 'g')

  const quotePairs = str.match(quotePairsRegex)
  if (!quotePairs) {
    return str
  }
  const redactedOuter = cleanInner(str, quotePairs, quoteType)
  const redactedString = redactedOuter
    .replace(/'/g, 'INNERSINGLEQUOTE')
    .replace(/"/g, 'INNERDOUBLEQUOTE')
  // log('redactedString', redactedString)
  const repInner = (objectType === 'array') ? '"' : `\\"`
  const fixed = redactedString
    .replace(/OUTERDOUBLEQUOTE|OUTERSINGLEQUOTE/g, '"')
    .replace(/INNERSINGLEQUOTE/g, `'`)
    .replace(/INNERDOUBLEQUOTE/g, repInner)
  // log('fixed', fixed)
  return fixed
}

function cleanInner(str, pairs, quoteType) {
  const word = (quoteType === '"') ? 'OUTERDOUBLEQUOTE' : 'OUTERSINGLEQUOTE'
  const inverse = (quoteType === '"') ? "'" : '"'
  const replaceInnerConflict = new RegExp(`${quoteType}`, 'g')
  // log('replaceInnerConflict', replaceInnerConflict)
  const replaceInverseStart = new RegExp(`^${inverse}`)
  // log('replaceInverseStart', replaceInverseStart)
  const replaceInverseEnd = new RegExp(`${inverse}$`)
  // log('replaceInverseEnd', replaceInverseEnd)
  return pairs.reduce((acc, curr) => {
    const fix = curr
      // replace inner "
      .replace(replaceInnerConflict, `${word}`)
      // replace beginning quote
      .replace(replaceInverseStart, quoteType)
      // replace ending quote
      .replace(replaceInverseEnd, quoteType)
    acc = acc.replace(curr, fix)
    return acc
  }, str)
}

const str = "'Wow 'this' is great'"
const x = invertQuotes(str, "'", 'string')
// console.log('x', x)