
/**
 * Create regex pattern to match characters inside quoted strings
 * @param {string} [char='\\s'] - Character pattern to match
 * @param {string} [open] - Opening quote character
 * @param {string} [close] - Closing quote character
 * @param {number} [repeat=0] - Repeat count for quote pairs
 * @param {string} [flags] - Regex flags
 * @returns {RegExp} Regular expression pattern
 */
function replaceInnerCharPattern(char = '\\s', open, close, repeat = 0, flags) {
  // og /\s(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g
  const repeatVal = (repeat) ? `{${repeat}}` : ''
  // const o = (allSpace) ? '' : open
  const o = open
  const f = flags || 'g'
  return new RegExp(`${char}(?=(?:(?:[^${open}]*(?:${open}))${repeatVal})*[^${o}]*(?:${close})[^${close}]*$)`, f)
}

module.exports = {
  replaceInnerCharPattern
}