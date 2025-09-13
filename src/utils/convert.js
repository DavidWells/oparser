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

/**
 * Check if string looks like an array
 * @param {string} str - String to check
 * @returns {boolean} True if string has array-like syntax
 */
function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(ARRAY_REGEX.test(str))
}

/**
 * Check if string looks like an object
 * @param {string} str - String to check
 * @returns {boolean} True if string has object-like syntax
 */
function isObjectLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(OBJECT_REGEX.test(str))
}

/**
 * Replace double quotes with placeholder tokens
 * @param {string} input - Input string
 * @returns {string} String with double quotes replaced
 */
function replaceDoubleQuotes(input) {
  return replaceBetweenMarkers(input, /"/g, '__inner_dbl_quote__')
}

/**
 * Replace commas with placeholder tokens
 * @param {string} input - Input string
 * @returns {string} String with commas replaced
 */
function replaceCommas(input) {
  return replaceBetweenMarkers(input, /,/g, COMMA)
}

/**
 * Replace pattern between JSON object markers
 * @param {string} input - Input string
 * @param {RegExp} pattern - Pattern to replace
 * @param {string} replace - Replacement string
 * @returns {string} String with replacements made between markers
 */
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

/**
 * Clean object string by restoring placeholder tokens
 * @param {string} value - String with placeholder tokens
 * @returns {string} Cleaned string with tokens restored
 */
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

/**
 * Format object-like string into proper JSON
 * @param {string} value - Object-like string to format
 * @returns {string} Formatted object string
 */
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

/**
 * Convert string value to appropriate JavaScript type
 * @param {string} value - String value to convert
 * @returns {any} Converted value (boolean, number, object, array, or string)
 */
function convert(value) {
  /*
  console.log('convert value', value)
  console.log('convert type', typeof value)
  /** */
  if (value === 'false') {
    return false
  }
  if (value === 'true') {
    return true
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
      const val = parseJSON(value) // last attempt to format an array like [ one, two ]
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
        const inner = value.match(ARRAY_REGEX)
        // console.log('try array', inner)

        if (inner && inner[1]) {
          let innerValue = inner[1]

          const composeValue = innerValue
            .replace(TRAILING_COMMAS, '') // remove dangling commas JSON alt MATCH_DANGLING_COMMAS /}(,[^}]*?)]}?$/
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
            // if (curr.match(/:|{/)) {
              return {
                ...acc,
                next: acc.next + curr + ','
              }
            }

            if (sealObject || sealArray) {
              return {
                ...acc,
                ...(!sealObject) ? {} : {
                  objectOpenCount: 0,
                  objectCloseCount: 0,
                },
                ...(!sealArray) ? {} : {
                  arrayOpenCount: 0,
                  arrayCloseCount: 0,
                },
                next: '',
                values: acc.values.concat(acc.next + curr)
              }
            }

            // default
            return {
              ...acc,
              values: acc.values.concat(curr)
            }
          }, {
            next: '',
            values: [],
            arrayOpenCount: 0,
            arrayCloseCount: 0,
            objectOpenCount: 0,
            objectCloseCount: 0,
          })
          // console.log('composeValue', composeValue)
          if (composeValue.values.length) {
            const newVal = composeValue.values.map((x) => {
              // console.log('x', x)
              return convert(x.trim())
            })
            return newVal
          }
        }
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