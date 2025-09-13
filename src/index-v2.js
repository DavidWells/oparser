const { convert, isObjectLike, isArrayLike, parseJSON } = require('./utils/convert') 
const { ensureWrap } = require('./utils/ensure-wrap')
const { replaceInnerCharPattern } = require('./utils/replace-inner')

// Pre-compiled regex patterns for better performance
const WHITE_SPACE = /[\s\n\r]/
const SURROUNDING_QUOTES = /^("|'|`)|("|'|`)$/g
const VALID_KEY_CHAR = /^[A-Za-z0-9_]/
const VALID_VALUE_CHAR = /(.+)/
const TRAILING_COMMAS = /,+$/
const NOT_OBJECT_LIKE = /^{[^:,]*}/
const START_WITH_PAREN = /^\s*\(/
const ASYNC_ARROW = /(?:async\s+)?\s?\(([\s\S]{0,1000}?)\)\s?(=>|_≡►)\s*{?/

// Constants
const INFERRED_QUOTE = 'INFERRED'
const SPACES = '__SPACE__'
const LINE_BREAK = '__LINEBREAK__'
const SINGLE_QUOTE = '_S_Q_'
const OUTER_SINGLE_QUOTE = '_OSQ_'
const OUTER_DOUBLE_QUOTE = '_ODQ_'
const DOUBLE_QUOTE = '_D_Q_'
const STARS = '_STAR_'
const HASH = '_HASHP_'
const DOUBLE_SLASH = '_SLASH_SLASH_'
const CURLY_CLOSE = '_C_C_'
const CURLY_OPEN = '_O_C_'
const PAREN_CLOSE = '_P_C_'

const BRACKET_TYPES = {
  '(': ')',
  '{': '}',
  '[': ']',
}

// Pre-compile regex patterns that are used frequently
const space = ' '
const SPACES_IN_SINGLE_QUOTE_RE = replaceInnerCharPattern(space, "'", "'", 2)
const SPACES_IN_DOUBLE_QUOTE_RE = replaceInnerCharPattern(space, '"', '"', 2)
const LINEBREAKS_IN_SINGLE_QUOTE_RE = replaceInnerCharPattern('\\n', "'", "'", 2)
const LINEBREAKS_IN_DOUBLE_QUOTE_RE = replaceInnerCharPattern('\\n', '"', '"', 2)
const CONFLICTING_CURLIES_IN_SINGLE = replaceInnerCharPattern("}", `'`, `'`, 2)
const CONFLICTING_CURLIES_IN_DOUBLE = replaceInnerCharPattern("}", `"`, `"`, 2)
const CONFLICTING_HASH_IN_SINGLE = replaceInnerCharPattern("#", `'`, `'`, 2)
const CONFLICTING_HASH_IN_DOUBLE = replaceInnerCharPattern("#", `"`, `"`, 2)
const CONFLICTING_SLASHSLASH_IN_SINGLE = replaceInnerCharPattern("\\/\\/", `'`, `'`, 2)
const CONFLICTING_SLASHSLASH_IN_DOUBLE = replaceInnerCharPattern("\\/\\/", `"`, `"`, 2)

// Cache for temp character replacements
const tempCharReplacements = [
  [/_S_Q_/g, `'`],
  [/_D_Q_/g, `"`],
  [/_C_C_/g, `}`],
  [/_STAR_/g, `*`],
  [/_HASHP_/g, `#`],
  [/_SLASH_SLASH_/g, `//`]
]

function removeTempCharacters(val) {
  if (typeof val !== 'string') return val
  
  let result = val
  for (const [pattern, replacement] of tempCharReplacements) {
    result = result.replace(pattern, replacement)
  }
  return result
}

const DEBUG = false

/**
 * Optimized parse function with performance improvements
 * @param {string} s - Config string to parse
 * @returns {object}
 */
function parse(s) {
  if (typeof s === 'undefined' || s === null || s === '') {
    return {}
  }

  let str = s.trim()

  // Quick quote trimming without regex for simple cases
  const firstChar = str[0]
  const lastChar = str[str.length - 1]
  
  if ((firstChar === '"' && lastChar === '"') ||
      (firstChar === "'" && lastChar === "'") ||
      (firstChar === "`" && lastChar === "`")) {
    str = str.slice(1, -1)
  }
  
  if (str.length === 1) {
    return { [str]: true }
  }

  if (str.length > 20000) {
    throw new Error(`String is too long at ${str.length} characters. Max length is 20000 characters.`)
  }

  const isMultiline = str.includes('\n')
  
  // Pre-process multiline strings more efficiently
  if (isMultiline) {
    str = str
      .replace(/(=)(')([^\n']*)(')(\s*\n\s*)(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, `$1${OUTER_SINGLE_QUOTE}$3${OUTER_SINGLE_QUOTE}$5`)
      .replace(/(=)(")([^\n']*)(")(\s*\n\s*)(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, `$1${OUTER_DOUBLE_QUOTE}$3${OUTER_DOUBLE_QUOTE}$5`)
      .replace(LINEBREAKS_IN_SINGLE_QUOTE_RE, `${LINE_BREAK}\n`)
      .replace(LINEBREAKS_IN_DOUBLE_QUOTE_RE, `${LINE_BREAK}\n`)
  }

  // Optimize quote handling - check once, store result
  const hasInnerSpacesInSinglesQuote = SPACES_IN_SINGLE_QUOTE_RE.test(str)
  SPACES_IN_SINGLE_QUOTE_RE.lastIndex = 0

  if (hasInnerSpacesInSinglesQuote) {
    const SINGLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', `'`, `'`, 2)
    str = str
      .replace(SINGLE_QUOTES_STAR_PATTERN, STARS)
      .replace(SPACES_IN_SINGLE_QUOTE_RE, SPACES)
      .replace(/__SPACE__'/g, ` ${SINGLE_QUOTE}`)
      .replace(/'__SPACE__/g, `${SINGLE_QUOTE} `)
      .replace(/(\s*)((__SPACE__)+)+(\s*)_S_Q_(\s*)/g, `$1$2$4'$5`)
      .replace(/}__SPACE__([\S])/, '} $1')

    if (isMultiline) {
      str = str.replace(/([^=\]\}])'((__LINEBREAK__)+)+$/gm, `$1${SINGLE_QUOTE}`)
    } else {
      str = str.replace(/_S_Q_ ([A-Za-z0-9_]*=)/, "' $1")
    }
  }

  const hasInnerSpacesInDoubleQuote = SPACES_IN_DOUBLE_QUOTE_RE.test(str)
  if (hasInnerSpacesInDoubleQuote) {
    const DOUBLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', '"', '"', 2)
    str = str
      .replace(SPACES_IN_DOUBLE_QUOTE_RE, SPACES)
      .replace(DOUBLE_QUOTES_STAR_PATTERN, STARS)
      .replace(/__SPACE__"/g, ` ${DOUBLE_QUOTE}`)
      .replace(/"__SPACE__/g, `${DOUBLE_QUOTE} `)
      .replace(/(\s*)((__SPACE__)+)+(\s*)_D_Q_(\s*)/g, `$1$2$4"$5`)
      .replace(/}__SPACE__([\S])/, '} $1')
 
    if (isMultiline) {
      str = str.replace(/([^=\]\}])"((__LINEBREAK__)+)+$/gm, `$1${DOUBLE_QUOTE}`)
    } else {
      str = str.replace(/_D_Q_ ([A-Za-z0-9_]*=)/, '" $1')
    }
  }

  // Batch conflict detection for better performance
  const conflicts = {
    curliesInSingle: CONFLICTING_CURLIES_IN_SINGLE.test(str),
    curliesInDouble: CONFLICTING_CURLIES_IN_DOUBLE.test(str),
    hashesInSingle: CONFLICTING_HASH_IN_SINGLE.test(str),
    hashesInDouble: CONFLICTING_HASH_IN_DOUBLE.test(str),
    slashesInSingle: CONFLICTING_SLASHSLASH_IN_SINGLE.test(str),
    slashesInDouble: CONFLICTING_SLASHSLASH_IN_DOUBLE.test(str)
  }

  // Process conflicts in batch
  if (conflicts.curliesInSingle) {
    str = str
      .replace(CONFLICTING_CURLIES_IN_SINGLE, `${CURLY_CLOSE}`)
      .replace(/(\s+)?\)_C_C_(__LINEBREAK__|__SPACE__|\s+)/g, '$1)}$2')
      .replace(/_C_C__C_C_ /g, '}} ')
  }
  
  if (conflicts.curliesInDouble) {
    str = str
      .replace(CONFLICTING_CURLIES_IN_DOUBLE, `${CURLY_CLOSE}`)
      .replace(/(\s+)?\)_C_C_(__LINEBREAK__|__SPACE__|\s+)/g, '$1)}$2')
      .replace(/_C_C__C_C_ /g, '}} ')
  }

  if (conflicts.hashesInSingle) {
    str = str.replace(CONFLICTING_HASH_IN_SINGLE, HASH)
  }
  if (conflicts.hashesInDouble) {
    str = str.replace(CONFLICTING_HASH_IN_DOUBLE, HASH)
  }

  if (conflicts.slashesInSingle) {
    str = str.replace(CONFLICTING_SLASHSLASH_IN_SINGLE, DOUBLE_SLASH)
  }
  if (conflicts.slashesInDouble) {
    str = str.replace(CONFLICTING_SLASHSLASH_IN_DOUBLE, DOUBLE_SLASH)
  }

  // Clean up temporary replacements
  if (hasInnerSpacesInSinglesQuote || hasInnerSpacesInDoubleQuote) {
    str = str
      .replace(/__SPACE__/g, ' ')
      .replace(/_OSQ_/g, "'")
      .replace(/_ODQ_/g, '"')
  }

  if (isMultiline) {
    str = str.replace(/__LINEBREAK__/g, '')
  }

  str = removeComments(str)

  // Optimized parsing with fewer allocations
  const vals = Object.create(null) // Use null prototype for better performance
  let openQuote = ''
  let keyBuffer = []
  let valueBuffer = []
  let keyIsOpen = false
  let valueIsOpen = false

  function save(key, value, from) {
    vals[key] = value
    openQuote = ''
    keyBuffer.length = 0
    valueBuffer.length = 0
    keyIsOpen = true
    valueIsOpen = false
  }

  // Use for loop with cached length for better performance
  const strLength = str.length
  for (let i = 0; i < strLength; i++) {
    const char = str[i]
    const nextChar = str[i + 1] || ''
    const prevChar = str[i - 1]

    if (keyIsOpen && char === ',') {
      continue
    }

    if (keyIsOpen && !nextChar && VALID_KEY_CHAR.test(char)) {
      keyBuffer.push(char)
      save(keyBuffer.join(''), true, 'last key')
      continue
    }

    if (keyIsOpen && keyBuffer.length > 0 && (WHITE_SPACE.test(char) || !nextChar)) {
      if (!nextChar) {
        keyBuffer.push(char)
      }
      if (nextChar !== '=') {
        save(keyBuffer.join(''), true, 'true bool')
        continue
      }
    }

    if (keyBuffer.length > 0 && keyIsOpen && char === '=') {
      keyIsOpen = false
      valueIsOpen = true
      continue
    }

    if (!openQuote && valueBuffer.length === 0 && char === ' ') {
      continue
    }

    if (valueIsOpen && 
        (openQuote === INFERRED_QUOTE) && 
        ((char === ',' && WHITE_SPACE.test(nextChar)) || WHITE_SPACE.test(char))) {
      save(keyBuffer.join(''), convert(valueBuffer.join('')), 'inferred')
      continue
    }

    if (keyIsOpen && !WHITE_SPACE.test(char)) {
      keyBuffer.push(char)
      continue
    }

    if (keyBuffer.length === 0 && VALID_KEY_CHAR.test(char)) {
      keyBuffer.push(char)
      keyIsOpen = true
      continue
    }

    if (valueIsOpen) {
      if ((openQuote === '{' && char === '}' && (!nextChar || nextChar !== '}')) || 
          (openQuote === '[' && char === ']' && (!nextChar || nextChar !== ']'))) {
        
        const bufferValue = valueBuffer.join('')
        
        if (bufferValue.match(NOT_OBJECT_LIKE)) {
          save(keyBuffer.join(''), preFormat(trimBrackets(bufferValue, '{', '}')), 'NOT_OBJECT_LIKE')
          continue
        }
        
        const theOpenQuote = START_WITH_PAREN.test(bufferValue) && !ASYNC_ARROW.test(bufferValue) ? '(' : openQuote
        const newBalance = isBalanced(bufferValue, theOpenQuote)

        if (newBalance) {
          const openIsBracket = openQuote === '['
          const value = (openIsBracket) ? `[${bufferValue}]` : ensureWrap(bufferValue, '{', '}')
          const cleanValue = preFormat(value)
          save(keyBuffer.join(''), cleanValue, 'New balance')
          continue
        }
      }

      if (!nextChar) {
        valueBuffer.push(char)
        save(keyBuffer.join(''), preFormat(valueBuffer.join(''), openQuote), 'LAST LOOP')
        continue
      }

      if ((openQuote && openQuote !== '{' && openQuote !== '[') && 
          (char === openQuote && (WHITE_SPACE.test(nextChar) || nextChar === ','))) {
        valueBuffer.push(char)
        save(keyBuffer.join(''), preFormat(valueBuffer.join('')), 'quoteClose')
        continue
      }

      if (openQuote === INFERRED_QUOTE && ((char === ',' && WHITE_SPACE.test(nextChar)))) {
        valueBuffer.push(char)
        save(keyBuffer.join(''), preFormat(valueBuffer.join('')), 'INFERRED_QUOTE')
        continue
      }

      const isBracketStart = char === '['
      if (!openQuote && isBracketStart) {
        openQuote = char
        continue
      }

      const isCulryBracketStart = !openQuote && char === '{'
      if (!openQuote && isCulryBracketStart) {
        openQuote = char
        continue
      }
      
      const isQuoteStart = char === '\'' || char === '"' || char === '`'
      
      if (!openQuote && isQuoteStart) {
        openQuote = char
        valueBuffer.push(char)
        continue
      }
      
      if (valueBuffer.length === 0 && (prevChar === '=' || prevChar === ' ') && VALID_VALUE_CHAR.test(char)) {
        openQuote = INFERRED_QUOTE
        valueBuffer.push(char)
        continue
      }

      if (openQuote === INFERRED_QUOTE && (char === ',' && WHITE_SPACE.test(nextChar))) {
        continue
      }

      valueBuffer.push(char)
    }
  }

  return vals
}

/**
* Parse freeform value into object - optimized version
* @param {string} value - freeform string value to parse into object, array or value.
* @returns {any}
*/
function parseValue(value) {
  if (typeof value !== 'string' || !value) {
    return value
  }
  return parse(`internal=${value.trim()}`).internal
}

function preFormat(val, quoteType) {
  let value = removeTempCharacters(val).replace(TRAILING_COMMAS, '')

  if (quoteType === '{') {
    value = trimBrackets((!value.match(/^{{1,}/) ? quoteType + value : value))
  }

  if (value.match(ASYNC_ARROW)) {
    value = isBalanced(value, '{') ? removeSurroundingBrackets(value) : removeSurroundingBrackets(value + '}')
  } else if (value.match(/^{\s*\(([\s\S]+?)\)\s*}$/)) {
    value = value.replace(/^{\s*\(/, '').replace(/\)\s*}$/, '')
  }
  else if (value.match(/^{[^:,]*}/)) {
    value = removeSurroundingBrackets(value)
  } 
  else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    value = removeSurroundingBrackets(value)
  }
  else if (value.match(/^{(?:`|\[)([\s\S]*?)(?:`|\])}$/)) {
    value = removeSurroundingBrackets(value)
  } 
  else if (value.match(/^{\s*\(?\s*<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]{0,4000}?)<\/\1>|\s?\/?>)\s*\)?\s*}$/)) {
    value = removeSurroundingBrackets(value)
  }

  const surroundingQuotes = value.match(SURROUNDING_QUOTES) || []
  const hasSurroundingQuotes = surroundingQuotes.length === 2 && (surroundingQuotes[0] === surroundingQuotes[1])

  return hasSurroundingQuotes ? value.replace(SURROUNDING_QUOTES, '') : convert(value)
}

function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

function removeComments(input) {
  return input
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    .replace(/^\s*(\/\/+|\/\*+|#+)(.*)\n?$/gm, '')
    .replace(/\s*(\/\/+|\/\*+|#+)(.*)\n$/gm, '')
    .replace(/\s+(\/\/+|\/\*+|#+)([^"'\n]*)$/gm, '')
}

function trimBrackets(value, open = '', close = '') {
  const leadingCurleyBrackets = value.match(/^{{1,}/)
  const trailingCurleyBrackets = value.match(/}{1,}$/)
  
  if (leadingCurleyBrackets && trailingCurleyBrackets) {
    const len = leadingCurleyBrackets[0].length <= trailingCurleyBrackets[0].length ? leadingCurleyBrackets : trailingCurleyBrackets
    const trimLength = len[0].length
    const trimLeading = new RegExp(`^{{${trimLength}}`)
    const trimTrailing = new RegExp(`}{${trimLength}}$`)
    
    if (trimLength) {
      value = value
        .replace(trimLeading, open)
        .replace(trimTrailing, close)
    }
  }
  return value
}

function areAllBracketsBalanced(str) {
  return !str.split('').reduce((uptoPrevChar, thisChar) => {
    if (thisChar === '(' || thisChar === '{' || thisChar === '[') {
      return ++uptoPrevChar
    } else if (thisChar === ')' || thisChar === '}' || thisChar === ']') {
      return --uptoPrevChar
    }
    return uptoPrevChar
  }, 0)
}

function isBalanced(str, open = '{') {
  return !str.split('').reduce((uptoPrevChar, thisChar) => {
    if (thisChar === open) {
      return ++uptoPrevChar
    } else if (thisChar === BRACKET_TYPES[open]) {
      return --uptoPrevChar
    }
    return uptoPrevChar
  }, 0)
}

/**
 * Parse string of key value options. Template tag version - optimized
 * @param {string} input - string of options. Can be multiline
 * @returns {Record<string, any>}
 */
function options(input = '', ...substitutions) {
  let str = String.raw(input, ...substitutions)
  return parse(str)
}

module.exports = {
  parse,
  parseValue,
  options
}