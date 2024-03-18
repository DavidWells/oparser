
/**
 * Turn object into options string
 * @param {Record<string, any>} obj 
 * @param {object} opts 
 * @returns {string}
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

function jsonToJsObjectTwo(jsonStr = '') {
  return jsonStr
    .replace(/^([\t ]*)("([^\\"]*|\\.)*")([\t ]*):([\t ]*)/gm, '$1$3: ')
    .replace(/^([\t ]*){?[\t ]*("([^\\"]*|\\.)*")([\t ]*):([\t ]*)/gm, '$1{ $3: ')
}

function jsonToJsObject(str){
  // console.log('str', str)
  arr = str.match(/"[^"\n]*?":/g)
  for (var i = 0; i < arr.length; i++) {
    // console.log('arr[i]', arr[i])
    str = str.replace(arr[i], arr[i].replace(/"/g, ''))
  }
  return str
}

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

// https://github.com/lydell/json-stringify-pretty-compact/blob/main/index.js
function prettier(passedObj, options = {}) {
  const indent = JSON.stringify([1], undefined, options.indent === undefined ? 2 : options.indent).slice(2, -3)
  const maxLength = indent === "" ? Infinity : options.maxLength === undefined ? 80 : options.maxLength
  let { replacer } = options

  return (function _stringify(obj, currentIndent, reserved) {
    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    const string = JSON.stringify(obj, replacer)

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