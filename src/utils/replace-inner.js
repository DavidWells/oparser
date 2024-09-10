
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