const { parseJSON } = require('json-alexander')
const { ensureWrap } = require('./ensure-wrap')
const { replaceInnerCharPattern } = require('./replace-inner')

const COMMA = '_COMMA_'

// const ARRAY_REGEX = /^\[(.*)\]$/
const ARRAY_REGEX = /^\s*\[([\s\S]*?)\]\s*$/
//const OBJECT_REGEX = /^\{(.*)\}$/
const OBJECT_REGEX = /^\s*\{([\s\S]*?)\}\s*$/
const TRAILING_COMMAS = /,+$/
// https://regex101.com/r/99mkDt/1 old /(?:,*[^\S]*)+?]$/
const TRAILING_ARRAY_COMMAS = /(?:,+[^\S]*)+?](,)*\s*/
// https://regex101.com/r/cy7mLe/4
const TRAILING_OBJECT_COMMAS = /(?:,[^\S]*)+(})(,*)\s*$/

const TRAILING_ARRAY_COMMAS_GLOBAL = /(?:,+[^\S]*)+?](,)*\s*/gm

const TRIM_INNER_TRAILING_OBJECT_COMMA = /(,+[^\S]*)*?}\s*/m
  // // Remove trailing object commas
  // value = value.replace(/(?:,*[^\S]*)*?}(,)*/gm, '}$1')
  // // Remove trailing array commas
  // value = value.replace(/(?:,+[^\S]*)+?]\s*$/gm, ']')
  // console.log(JSON.parse(value))

function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(ARRAY_REGEX.test(str))
}

function isObjectLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(OBJECT_REGEX.test(str))
}

function replaceDoubleQuotes(input) {
  return replaceBetweenMarkers(input, /"/g, '__inner_dbl_quote__')
}

function replaceCommas(input) {
  return replaceBetweenMarkers(input, /,/g, COMMA)
}

function replaceBetweenMarkers(input, pattern, replace) {
  // Match content between __OPEN_JSON__OBJECT__ and __CLOSE_JSON__OBJECT__
  const regexMarkers = /(__OPEN_JSON__OBJECT__)([\s\S]*?)(__CLOSE_JSON__OBJECT__)/g
  
  // Replace the double quotes within the markers
  const updatedString = input.replace(regexMarkers, (match, openMarker, content, closeMarker) => {
    // Replace all double quotes in the content between the markers
    const updatedContent = content.replace(pattern, replace)
    
    // Return the full string with markers and updated content
    return `${openMarker}${updatedContent}${closeMarker}`
  })

  return updatedString
}

const CONFLICTING_INNER_JSON_IN_SINGLE = replaceInnerCharPattern("{\\[{", `'`, `'`, 2)
const CONFLICTING_INNER_JSON_IN_DOUBLE = replaceInnerCharPattern("{\\[{", `"`, `"`, 2)

const CONFLICTING_INNER_JSON_CLOSE_IN_DOUBLE = replaceInnerCharPattern("}\\]}", `"`, `"`, 2)
const CONFLICTING_INNER_JSON_CLOSE_IN_SINGLE = replaceInnerCharPattern("}\\]}", `'`, `'`, 2)

// const CONFLICTING_INNER_COLONS_SINGLE = replaceInnerCharPattern(":", `'`, `'`, 2)
// const CONFLICTING_INNER_COLONS_DOUBLE = replaceInnerCharPattern(":", `"`, `"`, 2)

function splitTopLevel(input, delimiter = ',') {
  const values = []
  let quote = ''
  let escape = false
  let curlyDepth = 0
  let arrayDepth = 0
  let parenDepth = 0
  let start = 0

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      if (escape) {
        escape = false
      } else if (char === '\\') {
        escape = true
      } else if (char === quote) {
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '{') curlyDepth++
    else if (char === '}' && curlyDepth) curlyDepth--
    else if (char === '[') arrayDepth++
    else if (char === ']' && arrayDepth) arrayDepth--
    else if (char === '(') parenDepth++
    else if (char === ')' && parenDepth) parenDepth--

    if (
      char === delimiter &&
      curlyDepth === 0 &&
      arrayDepth === 0 &&
      parenDepth === 0
    ) {
      values.push(input.slice(start, i))
      start = i + 1
    }
  }

  values.push(input.slice(start))
  return values
}

function parseArrayString(value) {
  const inner = value.match(ARRAY_REGEX)
  if (!inner || typeof inner[1] === 'undefined') {
    return value
  }

  return splitTopLevel(inner[1].replace(TRAILING_COMMAS, '')).map((x) => {
    return convert(x.trim())
  })
}

function parseArrayStringByBalance(value) {
  const inner = value.match(ARRAY_REGEX)
  if (!inner || !inner[1]) {
    return value
  }

  const composeValue = inner[1]
    .replace(TRAILING_COMMAS, '')
    .split(',')
    .reduce((acc, curr) => {
      const open = (curr.match(/{/g) || []).length
      const close = (curr.match(/}/g) || []).length
      const arrayOpen = (curr.match(/\[/g) || []).length
      const arrayClose = (curr.match(/\]/g) || []).length
      acc.objectOpenCount += open
      acc.objectCloseCount += close
      acc.arrayOpenCount += arrayOpen
      acc.arrayCloseCount += arrayClose
      const sealObject = acc.objectOpenCount > 0 && acc.objectOpenCount === acc.objectCloseCount
      const sealArray = acc.arrayOpenCount > 0 && acc.arrayOpenCount === acc.arrayCloseCount

      if (acc.objectOpenCount > 0 && !sealObject || acc.arrayOpenCount > 0 && !sealArray) {
        acc.next += curr + ','
        return acc
      }

      if (sealObject || sealArray) {
        if (sealObject) {
          acc.objectOpenCount = 0
          acc.objectCloseCount = 0
        }
        if (sealArray) {
          acc.arrayOpenCount = 0
          acc.arrayCloseCount = 0
        }
        acc.values.push(acc.next + curr)
        acc.next = ''
        return acc
      }

      acc.values.push(curr)
      return acc
    }, {
      next: '',
      values: [],
      arrayOpenCount: 0,
      arrayCloseCount: 0,
      objectOpenCount: 0,
      objectCloseCount: 0,
    })

  return composeValue.values.map((x) => {
    return convert(x.trim())
  })
}

function hasQuotedArrayDelimiter(value) {
  let quote = ''
  let escape = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (quote) {
      if (escape) {
        escape = false
      } else if (char === '\\') {
        escape = true
      } else if (char === quote) {
        quote = ''
      } else if (char === ',' || char === '[' || char === ']') {
        return true
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
    }
  }

  return false
}

function shouldUseArrayFallback(value, parsed) {
  if (!Array.isArray(parsed) || !hasQuotedArrayDelimiter(value)) {
    return false
  }

  const inner = value.match(ARRAY_REGEX)
  if (!inner || typeof inner[1] === 'undefined') {
    return false
  }

  const topLevelValues = splitTopLevel(inner[1].replace(TRAILING_COMMAS, ''))
  return topLevelValues.every((x) => {
    const item = x.trim()
    return !isArrayLike(item) && !isObjectLike(item) && item.indexOf('\n') === -1
  })
}

function cleanObjectString(value) {
  return value
      .replace(/\n/g, '\\n')
      // .replace(/__INNER_COLON__/g, ':')
      .replace(/_COMMA_/g, ',')
      // .replace(/__EQ__/g, '=')
      .replace(/__inner_dbl_quote__/g, '\\"')
      .replace(/__OPEN_JSON__OBJECT__/g, '{[{')
      .replace(/__CLOSE_JSON__OBJECT__/g, '}]}')
}

// const CONFLICTING_CURLIES_IN_SINGLE = replaceInnerCharPattern("}", `'`, `'`, 2)
// const CONFLICTING_CURLIES_IN_DOUBLE = replaceInnerCharPattern("}", `\\[`, `\\]`, 1)

function formatObj(value) {

  // const hasConflictingInnerColonInSingle = CONFLICTING_INNER_COLONS_SINGLE.test(value)
  // const hasConflictingInnerColonInDouble = CONFLICTING_INNER_COLONS_DOUBLE.test(value)

  const hasConflictingInnerJsonInSingle = CONFLICTING_INNER_JSON_IN_SINGLE.test(value)
  const hasConflictingInnerJsonInDouble = CONFLICTING_INNER_JSON_IN_DOUBLE.test(value)

  // const hasConflictingCurliesInSingle = CONFLICTING_CURLIES_IN_SINGLE.test(value)
  // const hasConflictingCurliesInDouble = CONFLICTING_CURLIES_IN_DOUBLE.test(value)

  const hasConflictingJsonClose = CONFLICTING_INNER_JSON_CLOSE_IN_DOUBLE.test(value)
  const hasConflictingJsonCloseSingle = CONFLICTING_INNER_JSON_CLOSE_IN_SINGLE.test(value)

  if (hasConflictingInnerJsonInDouble) {
    value = value.replace(CONFLICTING_INNER_JSON_IN_DOUBLE, '__OPEN_JSON__OBJECT__')
  }
  if (hasConflictingInnerJsonInSingle) {
    value = value.replace(CONFLICTING_INNER_JSON_IN_SINGLE, '__OPEN_JSON__OBJECT__')
  }

  if (hasConflictingJsonClose) {
    value = value.replace(CONFLICTING_INNER_JSON_CLOSE_IN_DOUBLE, '__CLOSE_JSON__OBJECT__')
  }
  if (hasConflictingJsonCloseSingle) {
    value = value.replace(CONFLICTING_INNER_JSON_CLOSE_IN_SINGLE, '__CLOSE_JSON__OBJECT__')
  }

  // if (hasConflictingInnerColonInSingle) {
  //   value = value.replace(CONFLICTING_INNER_COLONS_SINGLE, '__INNER_COLON__')
  // }
  // if (hasConflictingInnerColonInDouble) {
  //   value = value.replace(CONFLICTING_INNER_COLONS_DOUBLE, '__INNER_COLON__')
  // }
  // console.log('CONFLICTING_INNER_COLONS_SINGLE', CONFLICTING_INNER_COLONS_SINGLE)
  // console.log('CONFLICTING_INNER_COLONS_DOUBLE', CONFLICTING_INNER_COLONS_DOUBLE)

  /*
  console.log('BEFORE', value)
  console.log('───────────────────────────────')
  /** */

  const inner = replaceDoubleQuotes(
    replaceCommas(
      value.replace(/^{|}$/g, '')
    )
  )
  const kvs = inner.split(',').map((x) => x.trim())
  /*
  console.log('inner', inner)
  console.log('kvs', kvs)
  /** */
  const splitter = ':'
  const newObjectString = kvs.reduce((acc, c, i) => {
    const curr = c.trim()
    /*
    console.log('curr', curr)
    /** */
    const comma = (kvs.length - 1 === i) ? '' : ',\n'
    if (isObjectLike(curr)) {
      acc += `{` + formatObj(curr) + `}${comma}`
      return acc
    }

    // const splitter = curr.match(/^([A-Z-a-z0-9]*)__INNER_COLON__/) ? '__INNER_COLON__' : ':'
    const parts = curr.split(splitter)
    /*
    console.log('splitter', splitter)
    console.log(`parts ${parts.length}`, parts)
    /** */

    // if (parts.length !== 2) {
    //   return acc
    // }

    /* Pop off key */
    const k = parts.shift().trim()
    // console.log('k', k)
    /* Join the rest of the parts */
    const value = parts.join(splitter).trim()
    
    const v = cleanObjectString(value)
    /*
    console.log('New value', value)
    console.log('Cleaned value', v)
    /** */
      
    // console.log('v', v)
    acc += `${ensureWrap(k, '"')}: ${ensureWrap(v, '"')}${comma}`
    // console.log('parts', parts)
    return acc
  }, '')

  /*
  console.log('newObjectString', newObjectString)
  /** */
  return newObjectString
}

function convert(value) {
  /*
  console.log('convert value', value)
  console.log('convert type', typeof value)
  /** */
  if (/^false$/i.test(value)) {
    return false
  }
  if (/^true$/i.test(value)) {
    return true
  }

  // Empty or whitespace-only strings should stay as-is, not become 0
  if (value === '' || /^\s+$/.test(value)) {
    return value
  }

  const isNumber = Number(value)
  if (typeof isNumber === 'number' && !isNaN(isNumber)) {
    return isNumber
  }

  // remove double escaped quotes
  if (value.indexOf('\\"') > -1) {
    value = value.replace(/\\"/g, '\"') // .replace(/\\\"/g, '\"')
  }

  let cleaner
  try {
    /* First try simple parse */
    return JSON.parse(value)
  } catch (e) {
    /* Then try deeper parse */
    try {
      /* Remove trailing commas */
      // console.log('value', value)
      if (isArrayLike(value) || isObjectLike(value)) {
        /* Clean JSON lines */
        const cleanLines = value
          .split('\n')
          .map((line) => {
            return line
              .replace(TRIM_INNER_TRAILING_OBJECT_COMMA, '}')
              // .replace(TRAILING_OBJECT_COMMAS, '}$1')
              .replace(TRAILING_ARRAY_COMMAS, ']')
          }).join('\n')
        // console.log('cleanLines', cleanLines)
        // console.log('isArrayLike', value)
        /* Trim trailing commas in arrays ,] */
        value = cleanLines
          /* Trim trailing commas in object ,}, */
          .replace(TRAILING_OBJECT_COMMAS, '}')
          /* Trim trailing commas in arrays ,] */
          .replace(TRAILING_ARRAY_COMMAS_GLOBAL, ']')
          // trim inner newlines
          // .replace(/(,*[^\S]*)*?},\n*\s*/g, '},')
        cleaner = value
        // console.log('cleaner', value)
      }
      // console.log('value', value)
      const val = parseJSON(value) // last attempt to format an object like { one: two }
      if (isArrayLike(value) && shouldUseArrayFallback(value, val)) {
        return parseArrayString(value)
      }
      // console.log('Do it', val)
      return val
    } catch (err) {
      // console.log('parse error', err)
      // console.log('json val', value)

      /* Convert object looking string into values */
      if (isObjectLike(value) && value.indexOf(':') > -1) {
        // console.log('isObjectLike value', cleaner)
        const newObjectString = formatObj(cleaner || value)
        if (!newObjectString) {
          throw new Error('Could not parse object')
        }
        // console.log('newObjectString', newObjectString)
        const objToTry =`{ ${newObjectString.replace(/,$/, '')} }`
        /*
        console.log('objToTry', objToTry)
        /** */
        return parseJSON(objToTry)
      }
      /* Convert array looking string into values */
      if (typeof value === 'string' && ARRAY_REGEX.test(value)) {
        return parseArrayStringByBalance(value)
      }
    }
    /* Fix fallthrough strings remove surrounding strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.replace(/^"|"$/g, '')
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.replace(/^'|'$/g, '')
    }
    */
  }
  return value
}

module.exports = {
  convert,
  isObjectLike,
  isArrayLike,
  parseJSON,
  COMMA
}
