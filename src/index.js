const { convert, isObjectLike } = require('./utils/convert') 
const { ensureWrap } = require('./utils/ensure-wrap')

const WHITE_SPACE = /[\s\n\r]/
const SURROUNDING_QUOTES = /^("|'|`)|("|'|`)$/g
const VALID_KEY_CHAR = /^[A-Za-z0-9_]/
const VALID_VALUE_CHAR = /(.*)/
const TRAILING_COMMAS = /,+$/
const NOT_OBJECT_LIKE = /^{[^:,]*}/
const INFERRED_QUOTE = 'INFERRED'
const SPACES = '__SPACE__'
const LINE_BREAK = '__LINEBREAK__'
const SINGLE_QUOTE = '_S_Q_'
const DOUBLE_QUOTE = '_D_Q_'
const STARS = '_STAR_'
const HASH = '_HASHP_'
const DOUBLE_SLASH = '_SLASH_SLASH_'
const CURLY_OPEN = '_O_C_'
const CURLY_CLOSE = '_C_C_'

function removeTempQuotes(val, rep) {
  if (typeof val === 'string') {
    return val
      .replace(/_S_Q_/g, `'`)
      .replace(/_D_Q_/g, `"`)
      .replace(/_O_C_/g, `{`)
      .replace(/_C_C_/g, `}`)
      .replace(/_STAR_/g, `*`)
      .replace(/_HASHP_/g, `#`)
      .replace(/_SLASH_SLASH_/g, `//`)
  }
  return val
}

const SINGLE_OUTER_QUOTE = '▪'
const DOUBLE_OUTER_QUOTE = '▫'

function replaceInnerCharPattern(char = '\\s', open, close, repeat = 0, allSpace) {
  // og /\s(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g
  const repeatVal = (repeat) ? `{${repeat}}` : ''
  const o = (allSpace) ? '' : open
  return new RegExp(`${char}(?=(?:(?:[^${open}]*(?:${open}))${repeatVal})*[^${o}]*(?:${close})[^${close}]*$)`, 'g')
}



const space = ' '
// bob='co ol' steve='c ool' --> add temp spaces
const SINGLE_QUOTES_PATTERN = replaceInnerCharPattern(space, "'", "'", 2)
// bob="co ol" steve="c ool" --> add temp spaces
const DOUBLE_QUOTES_PATTERN = replaceInnerCharPattern(space, '"', '"', 2)
// bob={co ol} steve={co ol} --> add temp spaces
const BRACKETS_PATTERN = replaceInnerCharPattern(space, '{', '}', 2, true)

// // bob=`co ol` steve=`c ool` --> add temp spaces
// const TICKS = replaceInnerCharPattern(space, '`', '`', 2)
// // bob={co ol} steve={co ol} --> add temp spaces
// const TAGS = replaceInnerCharPattern(space, '{<', '>}')

const BREAKS_IN_SINGLE_PATTERN = replaceInnerCharPattern('\\n', "'", "'", 2)
const BREAKS_IN_DOUBLE_PATTERN = replaceInnerCharPattern('\\n', '"', '"', 2)

console.log('SINGLE_QUOTES_PATTERN', SINGLE_QUOTES_PATTERN)
console.log('DOUBLE_QUOTES_PATTERN', DOUBLE_QUOTES_PATTERN)
console.log('BRACKETS_PATTERN', BRACKETS_PATTERN)
console.log('BREAKS_IN_SINGLE_PATTERN', BREAKS_IN_SINGLE_PATTERN)
// process.exit(1)

function findRawLinks(text, pattern) {
  let matches
  let firstChar 
  let last 
  let i = 0
  console.log('Check pattern', pattern)
  while ((matches = pattern.exec(text)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    if (!i) {
      firstChar = text[matches.index - 1] + text[matches.index]
    }
    console.log(getTextBetweenChars(text, matches.index - 1, matches.index))
    console.log(matches)
    i++
    last = matches
  }
  if (last) {
    console.log('last', last)
    console.log('last', text[last.index] + text[last.index + 1])
  }
  return firstChar
}

// trimBrackets(`{{cool}}}`) => cool}
// trimBrackets(`{{cool}}`) => cool
// trimBrackets(`{{{cool}}`) => {cool
function trimBrackets(value, open = '', close = '') {
  console.log('>>> trimBrackets value', value)
  const leadingCurleyBrackets = value.match(/^{{1,}/)
  const trailingCurleyBrackets = value.match(/}{1,}$/)
  console.log('leadingCurleyBrackets', leadingCurleyBrackets)
  console.log('trailingCurleyBrackets', trailingCurleyBrackets)
  if (leadingCurleyBrackets && trailingCurleyBrackets) {
    const len = leadingCurleyBrackets[0].length <= trailingCurleyBrackets[0].length ? leadingCurleyBrackets : trailingCurleyBrackets
    const trimLength = len[0].length
    console.log('trimLength', trimLength)
    const trimLeading = new RegExp(`^{{${trimLength}}`)
    const trimTrailing = new RegExp(`}{${trimLength}}$`)
    console.log('trimLeading', trimLeading)
    console.log('trimTrailing', trimTrailing)
    if (trimLength) {
      value = value
        // Trim extra leading brackets
        .replace(trimLeading, open)
        // Trim extra trailing brackets
        .replace(trimTrailing, close)
    }
  }
  console.log('>>> trimBrackets out value', value)
  return value
}

function getTextBetweenChars(text, start, end) {
  return text.slice(start, end)
}

function parse(s) {
  if (typeof s === 'undefined' || s === null || s === '') {
    return {}
  }

  /* Trim string and remove comment blocks */
  let str = s.trim()
  // str = removeComments(str)
  console.log('>> start str')
  console.log(str)
  console.log('───────────────────────────────')
  /* Fix conflicting single quotes bob='inner 'quote' conflict' steve='cool' */

  /* is multiline config */
  if (str.indexOf('\n') > -1) {
    str = str
      /* Replace spaces in single quotes with temporary spaces */
      .replace(BREAKS_IN_SINGLE_PATTERN, `${LINE_BREAK}\n`)
      /* Replace spaces in double quotes with temporary spaces */
      .replace(BREAKS_IN_DOUBLE_PATTERN, `${LINE_BREAK}\n`)
  }
  
  const hasInnerSpacesInSinglesQuote = SINGLE_QUOTES_PATTERN.test(str)
  // Reset regex pattern due to g flag https://bit.ly/2UCNhJz
  SINGLE_QUOTES_PATTERN.lastIndex = 0

  // const hasMultiLineSingleQuoteValue = BREAKS_IN_SINGLE_PATTERN.test(str)
  // console.log('hasInnerSpacesInSinglesQuote', s.match(SINGLE_QUOTES_PATTERN))

  if (hasInnerSpacesInSinglesQuote) {
    const SINGLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', `'`, `'`, 2)
    console.log('SINGLE_QUOTES_STAR_PATTERN', SINGLE_QUOTES_STAR_PATTERN)
    str = str
      /* Replace spaces in single quotes with temporary spaces */
      // .replace(BREAKS_IN_SINGLE_PATTERN, `${LINE_BREAK}\n`)
      .replace(SINGLE_QUOTES_STAR_PATTERN, STARS)
      .replace(SINGLE_QUOTES_PATTERN, SPACES)
      /* Fix inner single quotes */
      .replace(/__SPACE__'/g, ` ${SINGLE_QUOTE}`)
      /* Fix inner single quotes */
      .replace(/'__SPACE__/g, `${SINGLE_QUOTE} `)
      
      // not needed
      // // /* Replace empty lines with closing quote */
      // .replace(/^(\s*)'(\s*)$/gm, `$1${SINGLE_OUTER_QUOTE}$2`)
      // // /* Replace =' newline with special char */
      // .replace(/[=]'(\s*)$/, `=${SINGLE_OUTER_QUOTE}$1`)

      // needed
      // // /* Remove trailing quote for special char */
      .replace(/([^=\]\}])'__LINEBREAK__$/gm, `$1${SINGLE_QUOTE}`)
      // /* Fix  trailing close quote */
      .replace(/(\s*)((__SPACE__)+)+(\s*)_S_Q_(\s*)/g, `$1$2$4'$5`)
      // // fix what='xnxnx_S_Q_
      .replace(/='(.*)_S_Q_$/gm, "='$1'")
  }
  console.log('>>>>> 1 pass')
  console.log(str)
  console.log('───────────────────────────────')

  /* Fix conflicting double quotes bob="inner "quote" conflict" steve='cool' */
  const hasInnerSpacesInDoubleQuote = DOUBLE_QUOTES_PATTERN.test(str)
  console.log('hasInnerSpacesInDoubleQuote', s.match(BREAKS_IN_DOUBLE_PATTERN))
  if (hasInnerSpacesInDoubleQuote) {
    const DOUBLE_QUOTES_STAR_PATTERN = replaceInnerCharPattern('\\*', '"', '"', 2)
    console.log('DOUBLE_QUOTES_STAR_PATTERN', DOUBLE_QUOTES_STAR_PATTERN)
    str = str
      .replace(DOUBLE_QUOTES_PATTERN, SPACES)
      .replace(DOUBLE_QUOTES_STAR_PATTERN, STARS)
      .replace(/__SPACE__"/g, ` ${DOUBLE_QUOTE}`)
      .replace(/"__SPACE__/g, `${DOUBLE_QUOTE} `)
      // needed
      .replace(/([^=\]\}])"__LINEBREAK__$/gm, `$1${DOUBLE_QUOTE}`)
      // /* Fix  trailing close quote */
      .replace(/(\s*)((__SPACE__)+)+(\s*)_D_Q_(\s*)/g, `$1$2$4"$5`)
      // // fix what='xnxnx_S_Q_
      .replace(/="(.*)_D_Q_$/gm, '="$1"')
  }
  console.log('>>>>> 2 pass')
  console.log(str)
  console.log('───────────────────────────────')

  /* Construct regex patterns */
  const CONFLICTING_BRACKETS_IN_SINGLE = replaceInnerCharPattern("}", `'`, `'`, 2)
  const CONFLICTING_BRACKETS_IN_DOUBLE = replaceInnerCharPattern("}", `"`, `"`, 2)
  const CONFLICTING_HASH_IN_SINGLE = replaceInnerCharPattern("#", `'`, `'`, 2)
  const CONFLICTING_HASH_IN_DOUBLE = replaceInnerCharPattern("#", `"`, `"`, 2)
  const CONFLICTING_SLASHSLASH_IN_SINGLE = replaceInnerCharPattern("\\/\\/", `'`, `'`, 2)
  const CONFLICTING_SLASHSLASH_IN_DOUBLE = replaceInnerCharPattern("\\/\\/", `"`, `"`, 2)

  /* Conflicting inner  } */
  const hasConflictingCurliesInSingle = CONFLICTING_BRACKETS_IN_SINGLE.test(str)
  const hasConflictingCurliesInDouble = CONFLICTING_BRACKETS_IN_DOUBLE.test(str)
  /* Conflicting inner # */
  const hasConflictingHashesInSingle = CONFLICTING_HASH_IN_SINGLE.test(str)
  const hasConflictingHashesInDouble = CONFLICTING_HASH_IN_DOUBLE.test(str)
  /* Conflicting inner '//' */
  const hasConflictingSlashesInSingle = CONFLICTING_SLASHSLASH_IN_SINGLE.test(str)
  const hasConflictingSlashesInDouble = CONFLICTING_SLASHSLASH_IN_DOUBLE.test(str)

  /*
  console.log('Patterns')
  console.log('CONFLICTING_BRACKETS_IN_SINGLE', CONFLICTING_BRACKETS_IN_SINGLE)
  console.log('CONFLICTING_BRACKETS_IN_DOUBLE', CONFLICTING_BRACKETS_IN_DOUBLE)
  console.log('CONFLICTING_HASH_IN_SINGLE', CONFLICTING_HASH_IN_SINGLE)
  console.log('CONFLICTING_HASH_IN_DOUBLE', CONFLICTING_HASH_IN_DOUBLE)
  console.log('CONFLICTING_SLASHSLASH_IN_SINGLE', CONFLICTING_SLASHSLASH_IN_SINGLE)
  console.log('CONFLICTING_SLASHSLASH_IN_DOUBLE', CONFLICTING_SLASHSLASH_IN_DOUBLE)
  /** */

  /*
  console.log('Conflicts')
  console.log('hasConflictingCurliesInSingle', hasConflictingCurliesInSingle)
  console.log('hasConflictingCurliesInDouble', hasConflictingCurliesInDouble)
  console.log('hasConflictingHashesInSingle', hasConflictingHashesInSingle)
  console.log('hasConflictingHashesInDouble', hasConflictingHashesInDouble)
  console.log('hasConflictingSlashesInSingle', hasConflictingSlashesInSingle)
  console.log('hasConflictingSlashesInDouble', hasConflictingSlashesInDouble)
  /** */

  /* Has inner "}" in single quotes */
  if (hasConflictingCurliesInSingle) {
     str = str.replace(CONFLICTING_BRACKETS_IN_SINGLE, `${CURLY_CLOSE}`)
  }
  /* Has inner "}" in double quotes */
  if (hasConflictingCurliesInDouble) {
    str = str.replace(CONFLICTING_BRACKETS_IN_DOUBLE, `${CURLY_CLOSE}`)
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

  console.log('>>>>> 3 pass')
  console.log(str)
  console.log('───────────────────────────────')


  if (hasInnerSpacesInSinglesQuote || hasInnerSpacesInDoubleQuote) {
    str = str
      /* Replace temporary spaces */
      .replace(/__SPACE__/g, ' ')
      /* Replace temporary line breaks */
      .replace(/__LINEBREAK__/g, '')
      // /* Replace single wrapper */
      // .replace(/▪/g, "'")
      // /* Replace double wrapper */
      // .replace(/▫/g, '"')
  }

  str = removeComments(str)

  console.log('>>> FIN str')
  console.log(str)
  console.log('───────────────────────────────')

  const vals = {}
  let openQuote
  let bufferKey = ''
  let bufferValue = ''
  let keyIsOpen = false
  let valueIsOpen = false
  let openInnerQuote = ''

  function save(key, value, from) {
    //* Debug values
    console.log(`Save from "${from}" in quote ▶ ${openQuote} ◀`, value)
    /** */
    vals[key] = value
    openQuote = ''
    bufferKey = ''
    bufferValue = ''
    keyIsOpen = true
    valueIsOpen = false
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

    /* If has key and is break, set bool */
    if (keyIsOpen && bufferKey && (WHITE_SPACE.test(char) || !nextChar) ) {
      if (!nextChar) {
        // Last char add it
        bufferKey+= char
      }
      /* If not white spaces before seperator, set as true boolean */
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

    /* trim trailing spaces from after seperator: "bob =( trimmed spaces )cool" */
    if (!openQuote && !bufferValue && char === ' ') {
      // console.log('EXIT ON', bufferValue)
      continue;
    }

    /* If key + value and not inside known quotes */
    if (
      valueIsOpen && 
      (openQuote === INFERRED_QUOTE) && 
      ((char === ',' && WHITE_SPACE.test(nextChar)) || WHITE_SPACE.test(char))) {
      save(bufferKey, convert(bufferValue), 'inferred')
      continue
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

      const isBreak = char === ',' && WHITE_SPACE.test(nextChar)

      /* If opening bracket is brackets {}. Ensure balance */
      if (
        openQuote === '{' && char === '}' && (!nextChar || nextChar !== '}') || 
        openQuote === '[' && char === ']' && (!nextChar || nextChar !== ']')
      ) {
        //* Debug object values
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

        const bracketsBalanced = isBalanced(bufferValue)
        console.log('bracketsBalanced', bracketsBalanced)

        // if (!bracketsBalanced) {
        //   const tester = trimBrackets(bufferValue)
        //   console.log('tester', tester)
        // }

        if (bracketsBalanced) {
          const openIsBracket = openQuote === '['
          const value = (openIsBracket) ? `[${bufferValue}]` : ensureWrap(bufferValue, '{', '}')
          const cleanValue = preFormat(value)
          /*
          console.log(`>>>> Close bracket value`, value)
          console.log(`>>>> Close bracket cleanValue`, cleanValue)
          /** */
          save(bufferKey, cleanValue, 'Object')
          continue
        }
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
        (openQuote && openQuote !== '{' && openQuote !== '[') // Isnt value in brackets
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

      const isCulryBracketStart = !openQuote && char === '{'
      if (!openQuote && isCulryBracketStart) {
        openQuote = char
        continue;
      }
      
      const isQuoteStart = char === '\'' || char === '"' || char === '`'
      // console.log('isQuoteStart', isQuoteStart)
      if (!openQuote && isQuoteStart) {
        openQuote = char
        bufferValue+= char
        continue;
      }
      
      if (!bufferValue && (prevChar === '=' || prevChar === ' ') && VALID_VALUE_CHAR.test(char)) {
        // console.log('Set infered quote')
        openQuote = INFERRED_QUOTE
        bufferValue+= char
        continue;
      }

      if (openQuote === INFERRED_QUOTE && (char === ',' && WHITE_SPACE.test(nextChar))) {
        continue;
      }

      bufferValue+= char
    }
  }

  return vals
}

/**
* Parse freeform value into object
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

  let value = removeTempQuotes(val)
    .replace(TRAILING_COMMAS, '')

  console.log('preFormat value', value)
  console.log(value.match(/^{\s*\(([\s\S]*?)\)\s*}$/))

  if (quoteType === '{') {
    value = trimBrackets((!value.match(/^{{1,}/) ? quoteType + value : value))
  }

  // TODO remove this for trimBrackets
  const leadingBrackets = value.match(/^{{2,}/)
  const trailingBrackets = value.match(/}{2,}$/)
  // console.log('leadingBrackets', leadingBrackets)
  // console.log('trailingBrackets', trailingBrackets)
  if (leadingBrackets && trailingBrackets) {
    const len = (leadingBrackets[0].length <= trailingBrackets[0].length) ? leadingBrackets : trailingBrackets
    const trimLength = len[0].length
    const trimLeading = new RegExp(`^{{${trimLength}}`)
    const trimTrailing = new RegExp(`}{${trimLength}}$`)
    if (trimLength) {
      /*
      console.log('TRIM', trimLength)
      console.log('trimLeading', trimLeading)
      console.log('trimTrailing', trimTrailing)
      /** */

      value = value
        // Trim extra leading brackets
        .replace(trimLeading, '{')
        // Trim extra trailing brackets
        .replace(trimTrailing, '}')
    }
  }
  console.log('preFormat value 2', value)
  // JSX style tag value={( stuff )}
  if (value.match(/^{\s*\(([\s\S]+?)\)\s*}$/)) {
    if (value.match(/\{(\(.*\))(\s*)=>(\s*){?([^}]*)+[^}]?}/)) {
      value = removeSurroundingBrackets(value)
    } else {
      value = value.replace(/^{\s*\(/, '').replace(/\)\s*}$/, '')
    }
    console.log('preFormat value 3', value)
  }
  // If Doesn't look like JSON object
  else if (value.match(/^{[^:,]*}/)) {
    value = removeSurroundingBrackets(value)
  } 
  // If looks like array in brackets {[ thing, thing, thing ]}
  else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ] }
    value = removeSurroundingBrackets(value)
  }
  // If matches {` stuff `} & {[ stuff ]}
  else if (value.match(/^{(?:`|\[)([\s\S]*?)(?:`|\])}$/)) {
    value = removeSurroundingBrackets(value)
  } 
  // If matches JSX tag {<html>} & {(<html>)} https://regex101.com/r/KSARnK/1
  else if (value.match(/^{\s*\(?\s*<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/?>)\s*\)?\s*}$/)) {
    value = removeSurroundingBrackets(value)
  }
  console.log('value', value)
  // // Remove trailing object commas
  // value = value.replace(/(?:,*[^\S]*)*?}(,)*/gm, '}$1')
  // // Remove trailing array commas
  // value = value.replace(/(?:,+[^\S]*)+?]\s*$/gm, ']')
  // console.log(JSON.parse(value))

  /* Check if remaining value is surrounded by quotes */
  const surroundingQuotes = value.match(SURROUNDING_QUOTES) || []
  const hasSurroundingQuotes = surroundingQuotes.length === 2 && (surroundingQuotes[0] === surroundingQuotes[1])
  // console.log('hasSurroundingQuotes', hasSurroundingQuotes)

  return hasSurroundingQuotes ? value.replace(SURROUNDING_QUOTES, '') : convert(value)
}


function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

function removeComments(input) {
  return input
    // Remove JS comment blocks and single line comments https://regex101.com/r/XKHU18/2 | alt https://regex101.com/r/ywd8TT/1
    .replace(/\s?\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    // Remove single line comments
    .replace(/^\s*(\/\/+|\/\*+|#+)(.*)\n?$/gm, '')
    // Trailing single line comments
    .replace(/\s*(\/\/+|\/\*+|#+)(.*)\n$/gm, '')
    // trailing yaml comments not in quotes
    .replace(/\s*(\/\/+|\/\*+|#+)([^"'\n]*)$/gm, '')
    // .replace(/#.*$/gm, '')
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
//   // return (offset === 0 ? "FIRSRT" : "") + match
// }

// function replaceCloseCurly(match, open, _, extra) {
//   console.log(arguments)
//   console.log('close', open)
//   console.log('extra', extra)
//   return repeatStringNumTimes(CURLY_CLOSE, open.length) + (extra || '')
//   // return (offset === 0 ? "FIRSRT" : "") + match
// }

/**
 * Verify brackets are balanced
 * @param  {string}  str - string with code
 * @return {Boolean}
 */
function isBalanced(str) {
  return !str.split('').reduce((uptoPrevChar, thisChar) => {
    if (thisChar === '(' || thisChar === '{' || thisChar === '[') {
      return ++uptoPrevChar
    } else if (thisChar === ')' || thisChar === '}' || thisChar === ']') {
      return --uptoPrevChar
    }
    return uptoPrevChar
  }, 0)
}

module.exports = {
  parse,
  parseValue
}