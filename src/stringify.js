/**
 * Turn object into options string
 * @param {Record<string, any>} obj 
 * @param {object} opts 
 * @returns {string}
 */
function stringify(obj, opts = {}) {
  if (typeof obj !== 'object') return ''
  const joiner = opts.joiner || '='
  const attrs = Object.entries(obj)
    // filter out non-serializable values
    .filter(([attr, val]) => {
      const type = typeof val
      return type !== 'undefined' && val !== null && type !== 'function'
    })
    .map(([attr, val], i) => {
      let value = format(val, opts)
      /* return array of items */
      if (Array.isArray(value)) {
        const mapped = format(val, opts)
        return `${attr}${joiner}{[${mapped.join(', ')}]}`
      }
      if (typeof val === 'object') {
        return `${attr}${joiner}{${stringifyWithSpaces(val)}}`
      }
      /* wrap in brackets for multiline values */
      if (typeof val === 'string' && value.indexOf('\n') > -1) {
        value = `{${value.replace(/^"|"$/g, '`')}}`
      }
      return `${attr}${joiner}${value}`
    }).join(opts.separator || ' ')
  return attrs
}

function format(val, opts, insideArray) {
  // console.log(typeof val, val)
  const type = typeof val
  if (type === 'undefined' || val === null) {
    return val
  }
  if (type === 'string') {
    return ensureQuote(val)
  }
  if (Array.isArray(val)) {
    return val.map((v) => format(v, opts, 'array'))
  }
  if (typeof val === 'object') {
    const obj = {}
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = format(val[keys[i]], opts)
    }
    const multiline = opts.separator === '\n' ? 2 : 0
    return (insideArray) ? `${JSON.stringify(obj, null, multiline).replace(/"\\"/g, '"').replace(/\\""/g, '"')}` : obj
  }
  return val
}

function stringifyWithSpaces(obj) {
  // stringify, with line-breaks and indents
	let result = JSON.stringify(obj, null, 1)
  // remove all but the first space for each line
	result = result.replace(/^ +/gm, " ")
  // remove line-breaks
	result = result.replace(/\n/g, "")
  // remove spaces between object-braces and first/last props
	result = result.replace(/{ /g, "{").replace(/ }/g, "}")
  // remove spaces between array-brackets and first/last items
	result = result.replace(/\[ /g, "[").replace(/ \]/g, "]")
	return result
}

/**
 * Wrap string in characters if not already wrapped in them
 * @param {string|Array<string>} value
 * @param {string} open
 * @param {string} close
 * @returns {string|string[]}
 */
function ensureQuote(value, open = '"', close) {
  let i = -1
  const result = []
  const end = close || open
  if (typeof value === 'string') {
    return startChar(value, open) + value + endChar(value, end)
  }
  while (++i < value.length) {
    result[i] = startChar(value[i], open) + value[i] + endChar(value[i], end)
  }
  return result
}

function startChar(str, char) {
  return (str[0] === char) ? '' : char
}

function endChar(str, char) {
  return (str[str.length -1] === char) ? '' : char
}

module.exports = {
  stringify
}