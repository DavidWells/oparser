const NUMBER_REGEX = /^\d+(\.\d+)?$/ // also match 1.222
const BOOLEAN_REGEX = /^(true|false)$/
const ARRAY_REGEX = /^\[.*\]$/

/**
 * Ensure string is wrapped with specified characters
 * @param {string} [s=''] - String to wrap
 * @param {string} [open] - Opening character
 * @param {string} [close] - Closing character (defaults to open)
 * @returns {string} Wrapped string
 */
function ensureWrap(s = '', open, close) {
  const isQuote = open === '"' || open === "'"
  // Don't wrap numbers
  if (NUMBER_REGEX.test(s) && isQuote) {
    return s
  }
  // Don't wrap booleans
  if (BOOLEAN_REGEX.test(s) && isQuote) {
    return s
  }
  // Don't wrap arrays
  if (ARRAY_REGEX.test(s) && isQuote) {
    return s
  }
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