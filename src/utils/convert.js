const { parseJSON } = require('json-alexander')
const { ensureWrap } = require('./ensure-wrap')

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

const TRIM_INNER_TRAILING_OBJECT_COMMA = /(,*[^\S]*)*?}\s*/m
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

function formatObj(value) {
  const inner = value.replace(/^{|}$/g, '')
  const kvs = inner.split(',').map((x) => x.trim())
  // console.log('inner', inner)
  // console.log('kvs', kvs)
  const newObjectString = kvs.reduce((acc, curr, i) => {
    const comma = (kvs.length - 1 === i) ? '' : ',\n'
    if (isObjectLike(curr)) {
      acc += `{` + formatObj(curr) + `}${comma}`
      return acc
    }
    const parts = curr.trim().split(':')
    if (parts.length !== 2) {
      return acc
    }
    const k = parts[0].trim()
    const v = parts[1].trim()
    // console.log('v', v)
    acc += `${ensureWrap(k, '"')}: ${ensureWrap(v, '"')}${comma}`
    // console.log('parts', parts)
    return acc
  }, '')
  return newObjectString
}

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
      const val = parseJSON(value) // last attempt to format an array like [ one, two ]
      // console.log('Do it', val)
      return val
    } catch (err) {
      // console.log('parse error', err)
      // console.log('json val', value)

      /* Convert object looking string into values */
      if (isObjectLike(value) && value.indexOf(':') > -1) {
        // console.log('value', cleaner)
        const newObjectString = formatObj(cleaner || value)
        const objToTry =`{ ${newObjectString.replace(/,$/, '')} }`
        // console.log('objToTry', objToTry)
        return parseJSON(objToTry)
      }
      /* Convert array looking string into values */
      if (typeof value === 'string' && ARRAY_REGEX.test(value)) {
        const inner = value.match(ARRAY_REGEX)
        // console.log('try array', inner)

        if (inner && inner[1]) {
          const composeValue = inner[1]
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
  isArrayLike
}