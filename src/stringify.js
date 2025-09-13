
/**
 * Convert object to configuration string format
 * @param {Record<string, any>} obj - Object to stringify
 * @param {object} [opts={}] - Formatting options
 * @param {string} [opts.joiner='='] - Character to join keys and values
 * @param {boolean} [opts.asJs=true] - Convert to JavaScript object notation
 * @param {boolean} [opts.compressed=false] - Use compressed JSON format
 * @param {boolean} [opts.singleLineValues] - Format values on single lines
 * @param {boolean} [opts.expanded] - Use expanded JSON format with indentation
 * @param {string} [opts.separator='\n'] - Separator between key-value pairs
 * @returns {string} Formatted configuration string
 */
function stringify(obj, opts = {}) {
  if (typeof obj !== 'object') return ''
  const joiner = opts.joiner || '='
  if (typeof opts.asJs === 'undefined') {
    opts.asJs = true
  }
  if (typeof opts.compressed === 'undefined') {
    opts.compressed = false
  }
  if (Array.isArray(obj)) {
    return formatObject(obj, opts)
  }
  const attrs = Object.entries(obj)
    // filter out non-serializable values
    .filter(([attr, val]) => {
      const type = typeof val
      /* Trim empty arrays */
      if (Array.isArray(val) && val.length === 0) {
        return false
      }
      /* Trim empty objects */
      if (val && type === 'object' && Object.keys(val).length === 0) {
        return false
      }
      return type !== 'undefined' && val !== null && type !== 'function'
    })
    .map(([attr, val], i) => {
      // console.log(`start val ${attr}`, val)
      let value = format(val, opts)
      // console.log(`check 1 ${attr}`, value)

      /* return array of items */
      if (Array.isArray(value)) {
        // console.log('val', val)
        const mapped = format(val, opts)
        // console.log('mapped', mapped)
        const joined = mapped.map((x) => {
          if (typeof x === 'object') {
            return formatObject(x, opts)
          }
          return x
        }).join(', ')
        // console.log('joined', joined)
        return `${attr}${joiner}{[${joined}]}`
      }
      if (typeof val === 'object') {
        const formatted = formatObject(val, opts)
        return `${attr}${joiner}{${formatted}}`
      }
      /* wrap in brackets for multiline values */
      if (typeof val === 'string' && value.indexOf('\n') > -1) {
        value = `{${value.replace(/^"|"$/g, '`')}}`
      }
      return `${attr}${joiner}${value}`
    }).join(opts.separator || '\n')
  return attrs
}

/**
 * Format object for stringification
 * @param {any} obj - Object to format
 * @param {object} opts - Formatting options
 * @returns {string} Formatted object string
 */
function formatObject(obj, opts) {
  let cleanObj = ''
  if (opts.compressed) {
    cleanObj = JSON.stringify(obj)
    /*
    console.log('single line JSON no spaces', cleanObj)
    /** */
  } else if (opts.singleLineValues) {
    cleanObj = stringifyWithSpaces(obj)
    /*  
    console.log('single line clean JSON', cleanObj)
    /** */

  } else if (opts.expanded) {
    cleanObj = JSON.stringify(obj, null, 2)
    /*
    console.log('Deep JSON with newlines', cleanObj)
    /** */
  } else {
    cleanObj = prettier(obj, { bracketSpacing: true })
    /*
    console.log('prettier obj', cleanObj)
    /** */
  }
  return opts.asJs ? jsonToJsObject(cleanObj) : cleanObj
}

/**
 * Convert JSON string to JavaScript object notation (alternative implementation)
 * @param {string} [jsonStr=''] - JSON string to convert
 * @returns {string} JavaScript object notation string
 */
function jsonToJsObjectTwo(jsonStr = '') {
  return jsonStr
    .replace(/^([\t ]*)("([^\\"]*|\\.)*")([\t ]*):([\t ]*)/gm, '$1$3: ')
    .replace(/^([\t ]*){?[\t ]*("([^\\"]*|\\.)*")([\t ]*):([\t ]*)/gm, '$1{ $3: ')
}

/**
 * Convert JSON string to JavaScript object notation by removing quotes from keys
 * @param {string} str - JSON string to convert
 * @returns {string} JavaScript object notation string
 */
function jsonToJsObject(str){
  // console.log('str', str)
  const arr = str.match(/"[^"\n]*?":/g)
  if (!arr) {
    return ''
  }

  for (var i = 0; i < arr.length; i++) {
    // console.log('arr[i]', arr[i])
    str = str.replace(arr[i], arr[i].replace(/"/g, ''))
  }
  return str
}

/**
 * Format individual values for stringification
 * @param {any} val - Value to format
 * @param {object} opts - Formatting options
 * @param {boolean} [insideArray] - Whether value is inside an array
 * @param {boolean} [insideObject] - Whether value is inside an object
 * @returns {any} Formatted value
 */
function format(val, opts, insideArray, insideObject) {
  // console.log(typeof val, val)
  const type = typeof val
  if (type === 'undefined' || val === null) {
    return val
  }
  if (type === 'string' && !insideArray && !insideObject) {
    return ensureQuote(val)
  }
  if (Array.isArray(val)) {
    return val.map((v) => {
      // console.log('v', v)
      return format(v, opts, insideArray, insideObject)
    })
  }
  if (typeof val === 'object') {
    const obj = {}
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = format(val[keys[i]], opts, null, true)
    }
    // console.log('ret obj', obj)
    return obj
  }
  return val
}

/**
 * Stringify object with minimal spacing
 * @param {any} obj - Object to stringify
 * @returns {string} Compact JSON string with spaces
 */
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

const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g

/**
 * Pretty print JSON with compact formatting
 * Based on https://github.com/lydell/json-stringify-pretty-compact/blob/main/index.js
 * @param {any} passedObj - Object to stringify
 * @param {object} [options={}] - Formatting options
 * @param {number|string} [options.indent=2] - Indentation size or string
 * @param {number} [options.maxLength=80] - Maximum line length
 * @param {Function} [options.replacer] - JSON replacer function
 * @param {boolean} [options.bracketSpacing] - Add spacing inside brackets
 * @returns {string} Formatted JSON string
 */
function prettier(passedObj, options = {}) {
  const indent = JSON.stringify([1], undefined, options.indent === undefined ? 2 : options.indent).slice(2, -3)
  const maxLength = indent === "" ? Infinity : options.maxLength === undefined ? 80 : options.maxLength
  let { replacer } = options

  return (function _stringify(obj, currentIndent, reserved) {
    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    const string = JSON.stringify(obj, /** @type {any} */ (replacer))

    if (string === undefined) {
      return string;
    }

    const length = maxLength - currentIndent.length - reserved;

    if (string.length <= length) {
      const prettified = string.replace(stringOrChar, (match, stringLiteral) => {
        return stringLiteral || `${match} `
      })
      // console.log('prettified', prettified)
      if (prettified.length <= length) {
        //return prettified
        return options.bracketSpacing ? bracketSpacing(prettified) : prettified
      }
    }

    if (replacer != null) {
      obj = JSON.parse(string)
      replacer = undefined
    }

    if (typeof obj === "object" && obj !== null) {
      const nextIndent = currentIndent + indent
      const items = [];
      let index = 0
      let start
      let end

      if (Array.isArray(obj)) {
        start = "[";
        end = "]";
        const { length } = obj
        for (; index < length; index++) {
          items.push(_stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) || "null")
        }
      } else {
        start = "{"
        end = "}"
        const keys = Object.keys(obj)
        const { length } = keys
        for (; index < length; index++) {
          const key = keys[index]
          const keyPart = `${JSON.stringify(key)}: `
          const value = _stringify(obj[key], nextIndent, keyPart.length + (index === length - 1 ? 0 : 1))
          if (value !== undefined) {
            items.push(keyPart + value)
          }
        }
      }

      if (items.length > 0) {
        return [start, indent + items.join(`,\n${nextIndent}`), end].join(`\n${currentIndent}`)
      }
    }

    return string;
  })(passedObj, "", 0)
}

/**
 * Add proper spacing inside brackets and braces
 * @param {string} str - String to add bracket spacing to
 * @returns {string} String with proper bracket spacing
 */
function bracketSpacing(str) {
  return str
    .replace(/^\[{/, '[{ ')
    .replace(/}\]$/, ' }]')
    .replace(/^{\s*/, '{ ')
    .replace(/\s*}$/, ' }')
    .replace(/^\[([^{])\s*/, '[ $1')
    .replace(/\s*([^}])\]$/, '$1 ]')
}

/**
 * Ensure string is wrapped in quotes if not already quoted
 * @param {string|string[]} value - String or array of strings to quote
 * @param {string} [open='"'] - Opening quote character
 * @param {string} [close] - Closing quote character (defaults to open)
 * @returns {string|string[]} Quoted string or array of quoted strings
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

/**
 * Get opening character if not already present
 * @param {string} str - String to check
 * @param {string} char - Character to prepend if missing
 * @returns {string} Character or empty string
 */
function startChar(str, char) {
  return (str[0] === char) ? '' : char
}

/**
 * Get closing character if not already present
 * @param {string} str - String to check
 * @param {string} char - Character to append if missing
 * @returns {string} Character or empty string
 */
function endChar(str, char) {
  return (str[str.length -1] === char) ? '' : char
}

module.exports = {
  stringify
}