


function ensureWrap(s = '', open, close) {
  let str = s
  close = close || open
  if (str[0] !== open) {
    str = open + str
  }
  if (str[str.length - 1] !== close) {
    str = str + close
  }
  return str
}

module.exports = {
  ensureWrap
}