const { convert, isObjectLike, isArrayLike, parseJSON } = require('./utils/convert') 
const { ensureWrap } = require('./utils/ensure-wrap')
const { replaceInnerCharPattern } = require('./utils/replace-inner')

const WHITE_SPACE = /[\s\n\r]/
const SURROUNDING_QUOTES = /^("|'|`)|("|'|`)$/g
// const SURROUNDING_QUOTES = /^("|'|`)(?:[^\1])*(\1)$/g
const VALID_KEY_CHAR = /^[A-Za-z0-9_@$]/
const VALID_VALUE_CHAR = /(.+)/
const TRAILING_COMMAS = /,+$/
const NOT_OBJECT_LIKE = /^{[^:,]+}/
const START_WITH_PAREN = /^\s*\(/
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

const QUOTE_CHARS = {
  "'": true,
  '"': true,
  '`': true,
}

function readQuotedToken(str, start) {
  const quote = str[start]
  let value = ''
  let escape = false

  for (let i = start + 1; i < str.length; i++) {
    const char = str[i]
    if (escape) {
      value += (char === quote || char === '\\') ? char : `\\${char}`
      escape = false
      continue
    }
    if (char === '\\') {
      escape = true
      continue
    }
    if (char === quote) {
      return { value, end: i }
    }
    value += char
  }

  return null
}

function startsKeyAssignmentAt(str, start) {
  let i = start
  while (i < str.length && WHITE_SPACE.test(str[i])) {
    i++
  }

  if (i >= str.length) {
    return false
  }

  if (QUOTE_CHARS[str[i]]) {
    const quoted = readQuotedToken(str, i)
    if (!quoted) {
      return false
    }
    i = quoted.end + 1
  } else {
    let hasKeyChar = false
    while (i < str.length && !WHITE_SPACE.test(str[i]) && str[i] !== '=') {
      hasKeyChar = true
      i++
    }
    if (!hasKeyChar) {
      return false
    }
  }

  while (i < str.length && WHITE_SPACE.test(str[i])) {
    i++
  }

  return str[i] === '='
}

function findClosingQuote(value, quote, start = 1) {
  let escape = false
  for (let i = start; i < value.length; i++) {
    const char = value[i]
    if (escape) {
      escape = false
      continue
    }
    if (char === '\\') {
      escape = true
      continue
    }
    if (char === quote) {
      return i
    }
  }
  return -1
}

function stripTrailingComment(value) {
  return value.replace(/\s+(?:#|\/\/|\/\*)[\s\S]*$/, '').trimEnd()
}

function parseIniDocument(str) {
  if (typeof str !== 'string' || str.indexOf('\n') === -1) {
    return null
  }

  const result = {}
  const lines = str.replace(/\r\n/g, '\n').split('\n')
  let pending = null

  function saveIniValue(key, rawValue, quote) {
    let value = rawValue
    if (!quote) {
      value = stripTrailingComment(value.trim())
      result[key] = convert(value)
      return
    }
    result[key] = removeTempCharacters(value)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (pending) {
      const closing = findClosingQuote(line, pending.quote, 0)
      if (closing !== -1) {
        pending.value += '\n' + line.slice(0, closing)
        saveIniValue(pending.key, pending.value, pending.quote)
        pending = null
        continue
      }

      if (startsKeyAssignmentAt(line, 0)) {
        saveIniValue(pending.key, pending.value, pending.quote)
        pending = null
        i--
        continue
      }

      pending.value += '\n' + line
      continue
    }

    if (!trimmed || /^(#|\/\/|\/\*)/.test(trimmed)) {
      continue
    }

    const eq = line.indexOf('=')
    if (eq === -1) {
      result[trimmed] = true
      continue
    }

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trimStart()
    if (!key) {
      return null
    }

    const quote = QUOTE_CHARS[value[0]] ? value[0] : ''
    if (!quote) {
      saveIniValue(key, value, '')
      continue
    }

    const closing = findClosingQuote(value, quote)
    if (closing !== -1) {
      saveIniValue(key, value.slice(1, closing), quote)
      continue
    }

    pending = {
      key,
      quote,
      value: value.slice(1)
    }
  }

  if (pending) {
    saveIniValue(pending.key, pending.value, pending.quote)
  }

  return Object.keys(result).length ? result : null
}

function hasInternalParseArtifacts(value) {
  return Object.keys(value).some((key) => {
    if (
      key.indexOf(SINGLE_QUOTE) > -1 ||
      key.indexOf(DOUBLE_QUOTE) > -1 ||
      key.indexOf(OUTER_SINGLE_QUOTE) > -1 ||
      key.indexOf(OUTER_DOUBLE_QUOTE) > -1
    ) {
      return true
    }
    const val = value[key]
    return typeof val === 'string' && (
      val.indexOf(SINGLE_QUOTE) > -1 ||
      val.indexOf(DOUBLE_QUOTE) > -1 ||
      val.indexOf(OUTER_SINGLE_QUOTE) > -1 ||
      val.indexOf(OUTER_DOUBLE_QUOTE) > -1
    )
  })
}

function removeTempCharacters(val, rep) {
  if (typeof val === 'string') {
    return val
      .replace(/_S_Q_/g, `'`)
      .replace(/_D_Q_/g, `"`)
      // .replace(/_O_C_/g, `{`)
      .replace(/_C_C_/g, `}`)
      // .replace(/_P_C_/g, `)`)
      .replace(/_STAR_/g, `*`)
      .replace(/_HASHP_/g, `#`)
      .replace(/_SLASH_SLASH_/g, `//`)
  }
  return val
}

const space = ' '
// bob='co ol' steve='c ool' --> add temp spaces
const SPACES_IN_SINGLE_QUOTE_RE = replaceInnerCharPattern(space, "'", "'", 2)
// console.log('SPACES_IN_SINGLE_QUOTE_RE', SPACES_IN_SINGLE_QUOTE_RE)
// bob="co ol" steve="c ool" --> add temp spaces
const SPACES_IN_DOUBLE_QUOTE_RE = replaceInnerCharPattern(space, '"', '"', 2)

// // bob='co ol' steve='c ool' --> add temp spaces
// const DOUBLE_IN_SINGLE_QUOTE_RE = replaceInnerCharPattern('"', "'", "'", 2)
// // bob="co ol" steve="c ool" --> add temp spaces
// const SINGLE_IN_DOUBLE_QUOTE_RE = replaceInnerCharPattern("'", '"', '"', 2)

// // bob={co ol} steve={co ol} --> add temp spaces
// const BRACKETS_PATTERN = replaceInnerCharPattern(space, '{', '}', 2, true)
// // bob=`co ol` steve=`c ool` --> add temp spaces
// const TICKS = replaceInnerCharPattern(space, '`', '`', 2)
// // bob={co ol} steve={co ol} --> add temp spaces
// const TAGS = replaceInnerCharPattern(space, '{<', '>}')
const LINEBREAKS_IN_SINGLE_QUOTE_RE = replaceInnerCharPattern('\\n', "'", "'", 2)
const LINEBREAKS_IN_DOUBLE_QUOTE_RE = replaceInnerCharPattern('\\n', '"', '"', 2)

/* Construct regex patterns */
const CONFLICTING_CURLIES_IN_SINGLE = replaceInnerCharPattern("}", `'`, `'`, 2)
const CONFLICTING_CURLIES_IN_DOUBLE = replaceInnerCharPattern("}", `"`, `"`, 2)
const CONFLICTING_HASH_IN_SINGLE = replaceInnerCharPattern("#", `'`, `'`, 2)
const CONFLICTING_HASH_IN_DOUBLE = replaceInnerCharPattern("#", `"`, `"`, 2)
const CONFLICTING_SLASHSLASH_IN_SINGLE = replaceInnerCharPattern("\\/\\/", `'`, `'`, 2)
const CONFLICTING_SLASHSLASH_IN_DOUBLE = replaceInnerCharPattern("\\/\\/", `"`, `"`, 2)
const SINGLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', `'`, `'`, 2)
const DOUBLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', '"', '"', 2)

// const ASYNC_ARROW_FULL_FN = /(?:async\s+)?\s?\(([\s\S]*)\)\s?(=>|_≡►)\s*(?:(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*(?:\s?\(.*\)\s?\)\s?)?)?(?:\;)?/
// https://regex101.com/r/XO8rRl/1
// const ASYNC_ARROW = /(?:async\s+)?\s?\(([\s\S]*)\)\s?(=>|_≡►)\s*{?/
// https://regex101.com/r/Es4r3P/1
const ASYNC_ARROW = /(?:async\s+)?\s?\(([\s\S]{0,1000}?)\)\s?(=>|_≡►)\s*{?/
// const ASYNC_ARROW = /(?:async\s+)?\s?\(([^\)]*)\)\s?(=>|_≡►)\s*{?/
/*
console.log('Patterns')
console.log('SPACES_IN_SINGLE_QUOTE_RE', SPACES_IN_SINGLE_QUOTE_RE)
console.log('SPACES_IN_DOUBLE_QUOTE_RE', SPACES_IN_DOUBLE_QUOTE_RE)

console.log('LINEBREAKS_IN_SINGLE_QUOTE_RE', LINEBREAKS_IN_SINGLE_QUOTE_RE)
console.log('LINEBREAKS_IN_DOUBLE_QUOTE_RE', LINEBREAKS_IN_DOUBLE_QUOTE_RE)
console.log('CONFLICTING_CURLIES_IN_SINGLE', CONFLICTING_CURLIES_IN_SINGLE)
console.log('CONFLICTING_CURLIES_IN_DOUBLE', CONFLICTING_CURLIES_IN_DOUBLE)
console.log('CONFLICTING_HASH_IN_SINGLE', CONFLICTING_HASH_IN_SINGLE)
console.log('CONFLICTING_HASH_IN_DOUBLE', CONFLICTING_HASH_IN_DOUBLE)
console.log('CONFLICTING_SLASHSLASH_IN_SINGLE', CONFLICTING_SLASHSLASH_IN_SINGLE)
console.log('CONFLICTING_SLASHSLASH_IN_DOUBLE', CONFLICTING_SLASHSLASH_IN_DOUBLE)
// console.log('DOUBLE_IN_SINGLE_QUOTE_RE', DOUBLE_IN_SINGLE_QUOTE_RE)
// console.log('SINGLE_IN_DOUBLE_QUOTE_RE', SINGLE_IN_DOUBLE_QUOTE_RE)
/** */

const DEBUG = false

/**
 * Parse config string into key-value object
 * @template {Record<string, any>} [T=Record<string, any>]
 * @param {string|null|undefined} s - Config string to parse
 * @returns {T}
 */
function parse(s) {
  if (typeof s === 'undefined' || s === null || s === '') {
    return {}
  }

  /* Trim string and remove comment blocks */
  let str = s.trim()
  const originalInput = str

  /* If surrounded by double quotes, remove them */
  const wrappedString = QUOTE_CHARS[str[0]] ? readQuotedToken(str, 0) : null
  if (str[0] === '"' && str[str.length - 1] === '"' && wrappedString && wrappedString.end === str.length - 1) {
    str = str.replace(/^"|"$/g, '')
  } else if (str[0] === "'" && str[str.length - 1] === "'" && wrappedString && wrappedString.end === str.length - 1) {
    str = str.replace(/^'|'$/g, '')
  } else if (str[0] === "`" && str[str.length - 1] === "`" && wrappedString && wrappedString.end === str.length - 1) {
    str = str.replace(/^`|`$/g, '')
  }
  
  /* If string is a single character, return it as bool */
  if (str.length === 1) {
    return { [str]: true }
  }

  // console.log(str.length)
  // return

  if (str.length > 20000) {
    // For large strings, try JSON.parse first (assuming well-formed data)
    try {
      return JSON.parse(str)
    } catch (e) {
      const largeKeyValue = parseLargeKeyValueJSON(str)
      if (largeKeyValue) {
        return largeKeyValue
      }
      throw new Error(`String is too long (${str.length} chars) for forgiving parser. JSON.parse failed: ${e.message}`)
    }
  }

  /* Fast path: if looks like JSON object/array, try JSON.parse first */
  const firstChar = str[0]
  const lastChar = str[str.length - 1]
  if ((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')) {
    try {
      return JSON.parse(str)
    } catch (e) {
      // Fall through to forgiving parser
    }
  }

  /*
  if (DEBUG) {
    console.log('>> start str')
    console.log(str)
    console.log('───────────────────────────────')
  }
  /** */

  const isMultiline = str.indexOf('\n') > -1
  if (isMultiline) {
    str = str
      /* fix unbalanced inner single quote conflicts https://regex101.com/r/kLNXg8/1 */
      .replace(/(=)(')([^\n']*)(')(\s*\n\s*)(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, `$1${OUTER_SINGLE_QUOTE}$3${OUTER_SINGLE_QUOTE}$5`)
      .replace(/(=)(")([^\n']*)(")(\s*\n\s*)(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, `$1${OUTER_DOUBLE_QUOTE}$3${OUTER_DOUBLE_QUOTE}$5`)
      /* Replace spaces in single quotes with temporary spaces */
      .replace(LINEBREAKS_IN_SINGLE_QUOTE_RE, `${LINE_BREAK}\n`)
      /* Replace spaces in double quotes with temporary spaces */
      .replace(LINEBREAKS_IN_DOUBLE_QUOTE_RE, `${LINE_BREAK}\n`)
  }

  /*
  if (DEBUG) {
    console.log('pre pass', str)
    console.log('end pre-pass')
  }
  /** */
  
  const hasInnerSpacesInSinglesQuote = str.search(SPACES_IN_SINGLE_QUOTE_RE) !== -1

  /*
  if (DEBUG) {
    console.log('end hasInnerSpacesInSinglesQuote', hasInnerSpacesInSinglesQuote)
  }
  /** */

  // const hasInnerDoubleInSinglesQuote = DOUBLE_IN_SINGLE_QUOTE_RE.test(str)
  // DOUBLE_IN_SINGLE_QUOTE_RE.lastIndex = 0 // Reset regex pattern due to g flag https://bit.ly/2UCNhJz

  // const hasInnerSingleInDoubleQuote = SINGLE_IN_DOUBLE_QUOTE_RE.test(str)
  // SINGLE_IN_DOUBLE_QUOTE_RE.lastIndex = 0 // Reset regex pattern due to g flag https://bit.ly/2UCNhJz

  // if (hasInnerSingleInDoubleQuote) {
  //    str = str.replace(SINGLE_IN_DOUBLE_QUOTE_RE, 'INNER_SINGLE')
  // }

  // if (hasInnerDoubleInSinglesQuote) {
  //    str = str.replace(DOUBLE_IN_SINGLE_QUOTE_RE, 'INNER_DOUBLE')
  // }

  if (hasInnerSpacesInSinglesQuote) {
    str = str
      /* Replace spaces in single quotes with temporary spaces */
      .replace(SINGLE_QUOTES_STAR_PATTERN, STARS)
      .replace(SPACES_IN_SINGLE_QUOTE_RE, SPACES)
      /* Fix inner conflicting single quotes */
      .replace(/__SPACE__'/g, ` ${SINGLE_QUOTE}`)
      .replace(/'__SPACE__/g, `${SINGLE_QUOTE} `)
      /* Unbalanced single or double quotes break previous regex, so we need to fix */
      /* Fix trailing close quote - match __SPACE__ placeholders or real spaces that precede _S_Q_ */
      .replace(/(\s*)((__SPACE__|\s)+)_S_Q_(\s*)$/g, `$1$2'$4`)
      .replace(/(\s*)((__SPACE__)+)+(\s*)_S_Q_(\s*)/g, `$1$2$4'$5`)
      /* Fix unbalanced quote bracket replacement */
      .replace(/}__SPACE__([\S])/, '} $1')

    if (isMultiline) {
      str = str.replace(/([^=\]\}])'((__LINEBREAK__)+)+$/gm, `$1${SINGLE_QUOTE}`)
    } else {
      /* Fix Single ' space key=val */
      str = str.replace(/_S_Q_ ([A-Za-z0-9_]*=)/, "' $1")
      /* Fix opening quote for whitespace-only single quoted values */
      str = str.replace(/=_S_Q_((?:__SPACE__|\s)+)'/g, "='$1'")
    }

    /*
    if (DEBUG) {
      console.log('end hasInnerSpacesInSinglesQuote fix')
    }
    /** */
  }

  /*
  console.log('>>>>> 1 pass')
  console.log(str)
  console.log('───────────────────────────────')
  /** */

  /* Fix conflicting double quotes bob="inner "quote" conflict" steve='cool' */
  const hasInnerSpacesInDoubleQuote = str.search(SPACES_IN_DOUBLE_QUOTE_RE) !== -1
  /*
  if (DEBUG) {
    console.log('end hasInnerSpacesInDoubleQuote', hasInnerSpacesInDoubleQuote)
  }
  /** */
  if (hasInnerSpacesInDoubleQuote) {
    str = str
      .replace(SPACES_IN_DOUBLE_QUOTE_RE, SPACES)
      .replace(DOUBLE_QUOTES_STAR_PATTERN, STARS)
      /* Fix inner conflicting double quotes */
      .replace(/__SPACE__"/g, ` ${DOUBLE_QUOTE}`)
      .replace(/"__SPACE__/g, `${DOUBLE_QUOTE} `)
      /* Unbalanced single or double quotes break previous regex, so we need to fix */
      /* Fix trailing close quote - match both __SPACE__ placeholders and real spaces */
      .replace(/(\s*)((__SPACE__|\s)+)+(\s*)_D_Q_(\s*)/g, `$1$2$4"$5`)
       /* Fix  unbalanced quote bracket replacement */
      .replace(/}__SPACE__([\S])/, '} $1')
 
    if (isMultiline) {
      str = str.replace(/([^=\]\}])"((__LINEBREAK__)+)+$/gm, `$1${DOUBLE_QUOTE}`)
    } else {
      /* Fix Double " space key=val */
      str = str.replace(/_D_Q_ ([A-Za-z0-9_]*=)/, '" $1')
    }
    /* Fix opening quote that was incorrectly converted (whitespace-only values) */
    str = str.replace(/=_D_Q_(\s+)((__SPACE__|\s)*)/g, '="$1$2')
    /*
    if (DEBUG) {
      console.log('end hasInnerSpacesInDoubleQuote fix')
    }
    /** */
  }
  
  /*
  console.log('>>>>> 2 pass')
  console.log(str)
  console.log('───────────────────────────────')
  /** */


  /* Conflicting inner  } */
  const hasConflictingCurliesInSingle = str.search(CONFLICTING_CURLIES_IN_SINGLE) !== -1
  const hasConflictingCurliesInDouble = str.search(CONFLICTING_CURLIES_IN_DOUBLE) !== -1
  /* Conflicting inner # */
  const hasConflictingHashesInSingle = str.search(CONFLICTING_HASH_IN_SINGLE) !== -1
  const hasConflictingHashesInDouble = str.search(CONFLICTING_HASH_IN_DOUBLE) !== -1
  /* Conflicting inner '//' */
  const hasConflictingSlashesInSingle = str.search(CONFLICTING_SLASHSLASH_IN_SINGLE) !== -1
  const hasConflictingSlashesInDouble = str.search(CONFLICTING_SLASHSLASH_IN_DOUBLE) !== -1
  /* conflicting inner JSON */

  /*
  console.log('Conflicts')
  console.log('hasInnerSpacesInSinglesQuote', hasInnerSpacesInSinglesQuote)
  console.log('hasInnerSpacesInDoubleQuote', hasInnerSpacesInDoubleQuote)
  console.log('hasConflictingCurliesInSingle', hasConflictingCurliesInSingle)
  console.log('hasConflictingCurliesInDouble', hasConflictingCurliesInDouble)
  console.log('hasConflictingHashesInSingle', hasConflictingHashesInSingle)
  console.log('hasConflictingHashesInDouble', hasConflictingHashesInDouble)
  console.log('hasConflictingSlashesInSingle', hasConflictingSlashesInSingle)
  console.log('hasConflictingSlashesInDouble', hasConflictingSlashesInDouble)
  /** */


  // const hasConflictingParen = CONFLICTING_PARENS_IN_SINGLE.test(str)
  // console.log('hasConflictingParen', hasConflictingParen)
  // if (hasConflictingParen) {
  //    str = str
  //     .replace(CONFLICTING_PARENS_IN_SINGLE, PAREN_CLOSE)
  //     // Fix trailing )} closes
  //     // .replace(/_P_C_(\s*})/g, ')$1')
  // }

  /* Has inner "}" in single quotes */
  if (hasConflictingCurliesInSingle) {
     str = str
      .replace(CONFLICTING_CURLIES_IN_SINGLE, `${CURLY_CLOSE}`)
      /* Replace conflicting inner close parens ) to support jsx */
      .replace(/(\s+)?\)_C_C_(__LINEBREAK__|__SPACE__|\s+)/g, '$1)}$2')
      // {{ color: 'red' }} val Object jsx style weird test
      .replace(/_C_C__C_C_ /g, '}} ')
  }
  /* Has inner "}" in double quotes */
  if (hasConflictingCurliesInDouble) {
    str = str
      .replace(CONFLICTING_CURLIES_IN_DOUBLE, `${CURLY_CLOSE}`)
      /* Replace conflicting inner close parens ) to support jsx */
      .replace(/(\s+)?\)_C_C_(__LINEBREAK__|__SPACE__|\s+)/g, '$1)}$2')
      // {{ color: 'red' }} val Object jsx style weird test
      .replace(/_C_C__C_C_ /g, '}} ')
  }

  /* Has inner "#" in single quotes */
  if (hasConflictingHashesInSingle) {
    str = str.replace(CONFLICTING_HASH_IN_SINGLE, HASH)
  }
  /* Has inner "#" in double quotes */
  if (hasConflictingHashesInDouble) {
    str = str.replace(CONFLICTING_HASH_IN_DOUBLE, HASH)
  }

  /* Has inner '//' in single quotes */
  if (hasConflictingSlashesInSingle) {
    str = str.replace(CONFLICTING_SLASHSLASH_IN_SINGLE, DOUBLE_SLASH)
  }
  /* Has inner "//" in double quotes */
  if (hasConflictingSlashesInDouble) {
    str = str.replace(CONFLICTING_SLASHSLASH_IN_DOUBLE, DOUBLE_SLASH)
  }

  /*
  console.log('>>>>> 3 pass')
  console.log(str)
  console.log('───────────────────────────────')
  /** */

  if (hasInnerSpacesInSinglesQuote || hasInnerSpacesInDoubleQuote) {
    str = str
      /* Replace temporary spaces */
      .replace(/__SPACE__/g, ' ')
      /* Replace temporary outer single quotes */
      .replace(/_OSQ_/g, "'")
       /* Replace temporary outer single quotes */
      .replace(/_ODQ_/g, '"')
  }

  if (isMultiline) {
    /* Replace temporary line breaks */
    str = str.replace(/__LINEBREAK__/g, '')
  }

  /* Remove all comments outside of values */
  // console.log('str', str)
  str = removeComments(str)

  /*
  console.log('>>> CLEAN str')
  console.log(str)
  console.log('───────────────────────────────')
  /** */

  const vals = {}
  let openQuote
  let bufferKey = ''
  let bufferValue = ''
  let keyIsOpen = false
  let valueIsOpen = false
  let openInnerQuote = ''
  let valueUsesInnerQuoteTracking = false

  function save(key, value, from) {
    /* Debug values
    console.log(`Save ${key} from "${from}" in quote ▶ ${openQuote} ◀`, value)
    /** */
    vals[key] = value
    // vals[removeTempCharacters(key)] = value
    openQuote = ''
    bufferKey = ''
    bufferValue = ''
    keyIsOpen = true
    valueIsOpen = false
    openInnerQuote = ''
    valueUsesInnerQuoteTracking = false
  }

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const nextChar = str[i + 1] || ''
    const prevChar = str[i - 1]
    /*
    console.log('───────────────────────────────')
    console.log(`> key "${bufferKey}"`, `char: "${char}"`)
    console.log(`> val "${bufferValue}"`, `char: "${char}"`)
    console.log('───────────────────────────────')
    /** */

    /*
    if (openQuote) {
      console.log('Inside Quote:', `"${openQuote}"`)
    }
    /** */

    if (keyIsOpen && char === ',') {
      // console.log('EXIT ON', bufferValue)
      continue;
    }

    if (!bufferKey && !valueIsOpen && QUOTE_CHARS[char]) {
      const quotedKey = readQuotedToken(str, i)
      if (quotedKey) {
        bufferKey = quotedKey.value
        keyIsOpen = true
        i = quotedKey.end
        continue
      }
    }

    /* If last char and not white space, add to key */
    if (keyIsOpen && !nextChar && VALID_KEY_CHAR.test(char)) {
      bufferKey+= char
      save(bufferKey, true, 'last key')
      continue;
    }

    /* If has key and is break, set bool */
    if (keyIsOpen && bufferKey && char !== '=' && (WHITE_SPACE.test(char) || !nextChar)) {
      if (!nextChar) {
        // Last char add it
        bufferKey+= char
      }
      /* If not white spaces before separator, set as true boolean */
      if (nextChar !== '=') {
        save(bufferKey, true, 'true bool')
        continue;
      }
    }

    /* If k/v separator, and not inside value, open up value collector */
    if (bufferKey && keyIsOpen && char === '=') {
      // console.log('Seal key and open value')
      keyIsOpen = false
      valueIsOpen = true
      continue;
    }

    if (valueIsOpen && !openQuote && !bufferValue && WHITE_SPACE.test(char) && startsKeyAssignmentAt(str, i + 1)) {
      save(bufferKey, '', 'empty value before key')
      continue
    }

    /* trim trailing spaces from after separator: "bob =( trimmed spaces )cool" */
    if (!openQuote && !bufferValue && char === ' ') {
      // console.log('EXIT ON', bufferValue)
      continue;
    }

    /* If collecting key pieces and is valid character add to key */
    if (keyIsOpen && !WHITE_SPACE.test(char)) {
      bufferKey+= char
      continue;
    }


    if (!bufferKey && VALID_KEY_CHAR.test(char)) {
      bufferKey+= char
      keyIsOpen = true
      continue;
    }

    /* If value buffer open, collect characters */
    if (valueIsOpen) {
      // if (openQuote) {
      //   console.log(`valueIsOpen openQuote >>>> ${openQuote}` )
      // }

      if (
        (openQuote === '[' && (valueUsesInnerQuoteTracking || shouldTrackSimpleArrayQuote(bufferValue))) ||
        (openQuote === '{' && (valueUsesInnerQuoteTracking || shouldTrackSimpleObjectQuote(bufferValue)))
      ) {
        if (openInnerQuote) {
          bufferValue+= char
          if (char === openInnerQuote && prevChar !== '\\') {
            openInnerQuote = ''
          }
          continue
        }

        if (QUOTE_CHARS[char]) {
          valueUsesInnerQuoteTracking = true
          openInnerQuote = char
          bufferValue+= char
          continue
        }
      }

      /* If key + value and not inside known quotes */
      if (
        (openQuote === INFERRED_QUOTE) &&
        ((char === ',' && WHITE_SPACE.test(nextChar)) || WHITE_SPACE.test(char))) {
        save(bufferKey, convert(bufferValue), 'inferred')
        continue
      }

      /* If opening bracket is brackets {}. Ensure balance */
      if (
        !openInnerQuote &&
        (openQuote === '{' && char === '}' && (!nextChar || nextChar !== '}') ||
        openQuote === '[' && char === ']' && (!nextChar || nextChar !== ']'))
      ) {
        /* Debug object values
        console.log('{} bufferValue', bufferValue)
        /** */

        // if (!isObjectLike(bufferValue)) {
        //   save(bufferKey, preFormat(bufferValue), 'NOT_OBJECT_LIKE')
        //   continue;
        // }
        
        if (bufferValue.match(NOT_OBJECT_LIKE)) {
          save(bufferKey, preFormat(trimBrackets(bufferValue, '{', '}')), 'NOT_OBJECT_LIKE')
          continue;
        }

        if (openQuote === '{' && isLooseCurlyScalar(bufferValue)) {
          save(bufferKey, preFormat(bufferValue), 'LOOSE_CURLY_SCALAR')
          continue
        }
        // console.log('hang')
        const theOpenQuote = START_WITH_PAREN.test(bufferValue) && !ASYNC_ARROW.test(bufferValue) ? '(' : openQuote
        const newBalance = isBalanced(bufferValue, theOpenQuote, valueUsesInnerQuoteTracking)

        if (newBalance) {
          const openIsBracket = openQuote === '['
          // bufferValue = bufferValue + char
          const value = (openIsBracket) ? `[${bufferValue}]` : ensureWrap(bufferValue, '{', '}')
          const cleanValue = preFormat(value)
          /*
          console.log('char', char)
          console.log(`>>>> Close bracket value`, value)
          console.log(`>>>> Close bracket cleanValue`, cleanValue)
          /** */
          save(bufferKey, cleanValue, 'New balance')
          continue
        }

        // const bracketsBalanced = areAllBracketsBalanced(bufferValue)
        // console.log('bracketsBalanced', bracketsBalanced)

        // if (bracketsBalanced) {
        //   const openIsBracket = openQuote === '['
        //   const value = (openIsBracket) ? `[${bufferValue}]` : ensureWrap(bufferValue, '{', '}')
        //   const cleanValue = preFormat(value)
        //   /*
        //   console.log(`>>>> Close bracket value`, value)
        //   console.log(`>>>> Close bracket cleanValue`, cleanValue)
        //   /** */
        //   save(bufferKey, cleanValue, 'Object')
        //   continue
        // }
      }

      /* Last loop */
      if (!nextChar) {
        bufferValue+= char
        save(bufferKey, preFormat(bufferValue, openQuote), 'LAST LOOP')
        continue
      }

      /* Reset inner quote */
      // if (openInnerQuote && char === "\\" && openInnerQuote === nextChar) {
      //   openInnerQuote = ''
      // }

      // if (openInnerQuote) {
      //   bufferValue+= char
      //   continue;
      // }

      // /* Set inner quote and escape text */
      // if (openQuote && char === "\\" && openQuote === nextChar) {
      //   console.log('Escaped quote', nextChar)
      //   console.log('Escaped quote current buffer', bufferValue)
      //   openInnerQuote = nextChar
      //   continue;
      // }

      if (
        (openQuote && openQuote !== '{' && openQuote !== '[') // Isn't value in brackets
        && (char === openQuote && (WHITE_SPACE.test(nextChar) || nextChar === ',')) // Matching closing close with trailing space
      ) {
        bufferValue+= char
        save(bufferKey, preFormat(bufferValue), 'quoteClose')
        continue
      }

      // Is inferred quote value
      if (
        openQuote === INFERRED_QUOTE && ((char === ',' && WHITE_SPACE.test(nextChar)))
      ) {
        // console.log('char', char)
        // console.log('nextChar', WHITE_SPACE.test(nextChar))
        bufferValue+= char
        save(bufferKey, preFormat(bufferValue), 'INFERRED_QUOTE')
        continue
      }

      const isBracketStart = char === '['
      if (!openQuote && isBracketStart) {
        // bufferValue+= char
        openQuote = char
        continue;
      }

      const isCurlyBracketStart = !openQuote && char === '{'
      if (!openQuote && isCurlyBracketStart) {
        openQuote = char
        continue;
      }
      
      const isQuoteStart = char === '\'' || char === '"' || char === '`'
      // console.log('isQuoteStart', isQuoteStart)
      
      if (!openQuote && isQuoteStart) {
        // bufferValue+= char
        openQuote = char
        bufferValue+= char
        continue;
      }
      
      if (!bufferValue && (prevChar === '=' || prevChar === ' ') && VALID_VALUE_CHAR.test(char)) {
        // console.log('Set inferred quote')
        openQuote = INFERRED_QUOTE
        bufferValue+= char
        continue;
      }

      if (openQuote === INFERRED_QUOTE && (char === ',' && WHITE_SPACE.test(nextChar))) {
        continue;
      }

      /* Add char to buffer */
      bufferValue+= char
    }
  }

  if (valueIsOpen && bufferKey && !bufferValue) {
    save(bufferKey, '', 'empty value at end')
  }

  if (hasInternalParseArtifacts(vals)) {
    const iniParsed = parseIniDocument(originalInput)
    if (iniParsed) {
      return iniParsed
    }
  }

  return vals
}

/**
* Parse freeform value into object
* @param {string|null|undefined} value - freeform string value to parse into object, array or value.
* @returns {any}
*/
function parseValue(value) {
  if (typeof value !== 'string' || !value) {
    return value
  }
  return parse(`internal=${value.trim()}`).internal
}

function parseLargeKeyValueJSON(str) {
  const eq = str.indexOf('=')
  if (eq === -1) {
    return null
  }

  const key = str.slice(0, eq).trim()
  const value = str.slice(eq + 1).trim()
  const first = value[0]
  const last = value[value.length - 1]
  if (!key || !((first === '{' && last === '}') || (first === '[' && last === ']'))) {
    return null
  }

  try {
    return { [key]: JSON.parse(value) }
  } catch (e) {
    return null
  }
}

function preFormat(val, quoteType) {
  // console.log('preFormat start', val, quoteType)
  let value = removeTempCharacters(val).replace(TRAILING_COMMAS, '')
  // console.log('preFormat value 1', value)

  if (quoteType === '{') {
    value = trimBrackets((!value.match(/^{{1,}/) ? quoteType + value : value))
  }
  // console.log('preFormat value 2', value)

  if (value.match(ASYNC_ARROW)) {
    // console.log('try', value)
    value = isBalanced(value, '{') ? removeSurroundingBrackets(value) : removeSurroundingBrackets(value + '}')
    // console.log('value', value)
  } else if (value.match(/^{\s*\(([\s\S]+?)\)\s*}$/)) {
    // JSX style tag value={( stuff )}
    value = value.replace(/^{\s*\(/, '').replace(/\)\s*}$/, '')
    // console.log('preFormat value tow', value)
  }
  // If Doesn't look like JSON object
  else if (value.match(/^{[^:,]+}/)) {
    value = removeSurroundingBrackets(value)
  } 
  // If looks like array in brackets {[ thing, thing, thing ]}
  else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ] }
    value = removeSurroundingBrackets(value)
    // console.log('preFormat value 2', value)
  }
  // If matches {` stuff `} & {[ stuff ]}
  else if (value.match(/^{(?:`|\[)([\s\S]*?)(?:`|\])}$/)) {
    value = removeSurroundingBrackets(value)
  } 
  // If matches JSX tag {<html>} & {(<html>)} https://regex101.com/r/KSARnK/1
  else if (value.match(/^{\s*\(?\s*<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]{0,4000}?)<\/\1>|\s?\/?>)\s*\)?\s*}$/)) {
  // else if (value.match(/^{\s*\(?\s*<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/?>)\s*\)?\s*}$/)) {
  // else if (isJSXElement(value)) { // Safer JSX check
    value = removeSurroundingBrackets(value)
  }
  // console.log('preFormat value 3', value)

  /* Check if remaining value is surrounded by quotes */
  const surroundingQuotes = value.match(SURROUNDING_QUOTES) || []
  // console.log('surroundingQuotes', surroundingQuotes)
  const hasSurroundingQuotes = surroundingQuotes.length === 2 && (surroundingQuotes[0] === surroundingQuotes[1])
  // console.log('hasSurroundingQuotes', hasSurroundingQuotes)

  return hasSurroundingQuotes ? value.replace(SURROUNDING_QUOTES, '') : convert(value)
}

const JSX_OPENING = /^{\s*\(?\s*</;  // Match opening {< or {(
const JSX_TAG_NAME = /([a-zA-Z][a-zA-Z0-9_-]*)/; // Match valid tag names 
const JSX_CLOSING = />|\/>/; // Match > or />
const JSX_END = /\s*\)?\s*}$/; // Match ending )} or }

function isJSXElement(value) {
  // Early exit if doesn't have basic JSX structure
  if (!JSX_OPENING.test(value)) return false;
  
  // Get the tag name from start of element
  const tagMatch = value.match(JSX_TAG_NAME);
  if (!tagMatch) return false;
  
  const tagName = tagMatch[1];
  
  // Look for matching closing tag
  // const closeTag = new RegExp(`</${tagName}>`);
  
  // Either self-closing or has matching end tag
  return (
    // Self-closing tag case: <tag/>}
    (value.match(JSX_CLOSING) && value.match(JSX_END)) ||
    // Full tag case: <tag>...</tag>}  
    (value.includes(`</${tagName}>`) && value.match(JSX_END))
  );
}

function isLooseCurlyScalar(value) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.indexOf('\n') > -1) return false
  if (START_WITH_PAREN.test(value) || /^\s*</.test(value)) return false
  if (trimmed.indexOf(':') > -1 || trimmed.indexOf(',') > -1) return false

  const open = (trimmed.match(/{/g) || []).length
  const close = (trimmed.match(/}/g) || []).length
  return close > open
}

function shouldTrackSimpleArrayQuote(value) {
  return value.indexOf('{') === -1 && value.indexOf('[') === -1
}

function shouldTrackSimpleObjectQuote(value) {
  const trimmed = value.trimStart()
  return trimmed.indexOf('\n') === -1 &&
    trimmed.indexOf('<') === -1 &&
    !START_WITH_PAREN.test(trimmed) &&
    (trimmed[0] === '{' || trimmed.indexOf(':') > -1 || trimmed.indexOf(',') > -1)
}

function removeSurroundingBrackets(val) {
  // console.log('val', val)
  return val.replace(/^{/, '').replace(/}$/, '')
}

function removeComments(input) {
  return input
    // Remove JS comment blocks and single line comments https://regex101.com/r/XKHU18/2 | alt https://regex101.com/r/ywd8TT/1
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    // Remove single line comments
    .replace(/^\s*(\/\/+|\/\*+|#+)(.*)\n?$/gm, '')
    // Trailing single line comments
    .replace(/\s*(\/\/+|\/\*+|#+)(.*)\n$/gm, '')
    // trailing yaml comments not in quotes
    .replace(/\s+(\/\/+|\/\*+|#+)([^"'\n]*)$/gm, '')
    // .replace(/#.*$/gm, '')
}

// trimBrackets(`{{cool}}}`) => cool}
// trimBrackets(`{{cool}}`) => cool
// trimBrackets(`{{{cool}}`) => {cool
function trimBrackets(value, open = '', close = '') {
  // console.log('>>> trimBrackets value', value)
  const leadingCurlyBrackets = value.match(/^{{1,}/)
  const trailingCurlyBrackets = value.match(/}{1,}$/)
  // console.log('leadingCurlyBrackets', leadingCurlyBrackets)
  // console.log('trailingCurlyBrackets', trailingCurlyBrackets)
  if (leadingCurlyBrackets && trailingCurlyBrackets) {
    const len = leadingCurlyBrackets[0].length <= trailingCurlyBrackets[0].length ? leadingCurlyBrackets : trailingCurlyBrackets
    const trimLength = len[0].length
    // console.log('trimLength', trimLength)
    const trimLeading = new RegExp(`^{{${trimLength}}`)
    const trimTrailing = new RegExp(`}{${trimLength}}$`)
    // console.log('trimLeading', trimLeading)
    // console.log('trimTrailing', trimTrailing)
    if (trimLength) {
      value = value
        // Trim extra leading brackets
        .replace(trimLeading, open)
        // Trim extra trailing brackets
        .replace(trimTrailing, close)
    }
  }
  // console.log('>>> trimBrackets out value', value)
  return value
}

/**
 * Verify brackets are balanced
 * @param  {string}  str - string with code
 * @return {Boolean}
 */
function areAllBracketsBalanced(str) {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === '(' || c === '{' || c === '[') count++
    else if (c === ')' || c === '}' || c === ']') count--
  }
  return count === 0
}

function isBalanced(str, open = '{', ignoreQuotedBrackets = false) {
  const close = BRACKET_TYPES[open]
  let count = 0
  let quote = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (ignoreQuotedBrackets) {
      if (quote) {
        if (c === quote && str[i - 1] !== '\\') {
          quote = ''
        }
        continue
      }

      if (QUOTE_CHARS[c]) {
        quote = c
        continue
      }
    }

    if (c === open) count++
    else if (c === close) count--
  }
  return count === 0
}

/**
 * Parse string of key value options. Template tag version
 * @template {Record<string, any>} [T=Record<string, any>]
 * @param {TemplateStringsArray} input - template strings array
 * @param {...any} substitutions - template substitutions
 * @returns {T}
 */
function options(input = '', ...substitutions) {
  const rendered = substitutions.map((value) => {
    if (typeof value === 'string') {
      return /\s/.test(value) ? JSON.stringify(value) : value
    }
    if (typeof value === 'undefined') {
      return ''
    }
    if (value === null || typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  })
  let str = String.raw(input, ...rendered)
  return parse(str)
}

module.exports = {
  parse,
  parseValue,
  options
}

// function repeatStringNumTimes(string, times) {
//   var repeatedString = "";
//   while (times > 0) {
//     repeatedString += string;
//     times--;
//   }
//   return repeatedString;
// }

// function replacer(match, open, content, close, offset) {
//   console.log(arguments)
//   return repeatStringNumTimes(CURLY_OPEN, open.length) + content + repeatStringNumTimes(CURLY_CLOSE, close.length)
//   // return (offset === 0 ? "FIRST" : "") + match
// }

// function replaceCloseCurly(match, open, _, extra) {
//   console.log(arguments)
//   console.log('close', open)
//   console.log('extra', extra)
//   return repeatStringNumTimes(CURLY_CLOSE, open.length) + (extra || '')
//   // return (offset === 0 ? "FIRST" : "") + match
// }
