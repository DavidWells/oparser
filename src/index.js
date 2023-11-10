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

const SINGLE_OUTER_QUOTE = '▪'
const DOUBLE_OUTER_QUOTE = '▫'

function replaceInnerCharPattern(char = '\\s', open, close, repeat = 0) {
  // og /\s(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g
  const repeatVal = (repeat) ? `{${repeat}}` : ''
  return new RegExp(`${char}(?=(?:(?:[^${open}]*(?:${open}))${repeatVal})*[^${close}]*(?:${close})[^${close}]*$)`, 'g')
}

function removeTempQuotes(val, rep) {
  if (typeof val === 'string') {
    return val
      .replace(/_S_Q_/g, `'`)
      .replace(/_D_Q_/g, `"`)
  }
  return val
}



const space = ' '
// bob='co ol' steve='c ool' --> add temp spaces
const SINGLE_QUOTES = replaceInnerCharPattern(space, "'", "'", 2)

// bob="co ol" steve="c ool" --> add temp spaces
const DOUBLE_QUOTES = replaceInnerCharPattern(space, '"', '"', 2)
// bob=`co ol` steve=`c ool` --> add temp spaces
const TICKS = replaceInnerCharPattern(space, '`', '`', 2)
// bob={co ol} steve={co ol} --> add temp spaces
const BRACKETS = replaceInnerCharPattern(space, '{', '}', 2)
// bob={co ol} steve={co ol} --> add temp spaces
const TAGS = replaceInnerCharPattern(space, '{<', '>}')

console.log('SINGLE_QUOTES', SINGLE_QUOTES)
console.log('DOUBLE_QUOTES', DOUBLE_QUOTES)
const LINEBREAKS_IN_SINGLE_QUOTE = replaceInnerCharPattern('\\n', "'", "'", 2)
const LINEBREAKS_IN_DOUBLE_QUOTE = replaceInnerCharPattern('\\n', '"', '"', 2)
console.log('LINEBREAKS_IN_SINGLE_QUOTE', LINEBREAKS_IN_SINGLE_QUOTE)

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

function replacer(match, offset, string) {
  console.log('offset', offset)
  return (offset === 0 ? "FIRSRT" : "") + match
}

function styleHyphenFormat(propertyName) {

  return propertyName.replace(/[A-Z]/g, upperToHyphenLower);
}

function getTextBetweenChars(text, start, end) {
  return text.slice(start, end)
}

function parse(s) {
  if (typeof s === 'undefined' || s === null || s === '') {
    return {}
  }

  /* Trim string and remove comment blocks */
  let str = removeComments(s.trim()) 
  console.log('str', str)
  /* Fix conflicting single quotes bob='inner 'quote' conflict' steve='cool' */

  /* is multiline config */
  if (str.indexOf('\n') > -1) {
    str = str
      /* Replace spaces in single quotes with temporary spaces */
      .replace(LINEBREAKS_IN_SINGLE_QUOTE, `${LINE_BREAK}\n`)
      /* Replace spaces in double quotes with temporary spaces */
      .replace(LINEBREAKS_IN_DOUBLE_QUOTE, `${LINE_BREAK}\n`)
  }
  
  if (true || str.indexOf('\n') > -1) {
      const hasInnerSpacesInSinglesQuote = SINGLE_QUOTES.test(str)
      const hasMultiLineSingleQuoteValue = LINEBREAKS_IN_SINGLE_QUOTE.test(str)
      console.log('hasInnerSpacesInSinglesQuote', s.match(SINGLE_QUOTES))

      if (hasInnerSpacesInSinglesQuote) {
        // const answer = findRawLinks(str, LINEBREAKS_IN_SINGLE_QUOTE)
        // const x = str.replace(LINEBREAKS_IN_SINGLE_QUOTE, replacer)
        // console.log('x', x)
        // console.log('answer', answer)

        str = str
          /* Replace spaces in single quotes with temporary spaces */
          // .replace(LINEBREAKS_IN_SINGLE_QUOTE, `${LINE_BREAK}\n`)
          .replace(SINGLE_QUOTES, SPACES)
          
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

      console.log('single pass', str)

      /* Fix conflicting double quotes bob="inner "quote" conflict" steve='cool' */
      const hasInnerSpacesInDoubleQuote = DOUBLE_QUOTES.test(str)
      console.log('hasInnerSpacesInDoubleQuote', s.match(LINEBREAKS_IN_DOUBLE_QUOTE))
      if (hasInnerSpacesInDoubleQuote) {
        str = str
          .replace(DOUBLE_QUOTES, SPACES)
          .replace(/__SPACE__"/g, ` ${DOUBLE_QUOTE}`)
          .replace(/"__SPACE__/g, `${DOUBLE_QUOTE} `)
          // needed
          .replace(/([^=\]\}])"__LINEBREAK__$/gm, `$1${DOUBLE_QUOTE}`)
          // /* Fix  trailing close quote */
          .replace(/(\s*)((__SPACE__)+)+(\s*)_D_Q_(\s*)/g, `$1$2$4"$5`)
          // // fix what='xnxnx_S_Q_
          .replace(/="(.*)_D_Q_$/gm, '="$1"')
      }

      console.log('double pass', str)
      
      /* Fix conflicting double quotes bob="inner "quote" conflict" steve='cool' */
      const hasInnerSpacesInBrackets = BRACKETS.test(str)
      // console.log('hasInnerSpacesInDoubleQuote', s.match(DOUBLE_QUOTES))
      // if (hasInnerSpacesInDoubleQuote) {
      //   str = str
      //     .replace(DOUBLE_QUOTES, SPACES)
      //     .replace(/__SPACE__"/g, ` ${DOUBLE_QUOTE}`)
      //     .replace(/"__SPACE__/g, `${DOUBLE_QUOTE} `)
      // }

      if (hasInnerSpacesInSinglesQuote || hasInnerSpacesInDoubleQuote) {
        str = str
          /* Replace temporary spaces */
          .replace(/__SPACE__/g, ' ')
          /* Replace temporary line breaks */
          .replace(/__LINEBREAK__/g, '')
          /* Replace single wrapper */
          .replace(/▪/g, "'")
          /* Replace double wrapper */
          .replace(/▫/g, '"')
      }
  }


  console.log('process str', str)
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
    //*
    console.log('───────────────────────────────')
    console.log(`> key "${bufferKey}"`, `char: "${char}"`)
    console.log(`> val "${bufferValue}"`, `char: "${char}"`)
    console.log('───────────────────────────────')
    /** */

    /*
    if (openQuote) {
      console.log('Inside Quote:', `"${openQuote}"`)
    }
    console.log("char === '\n'", char === '\n')
    console.log("char === r'", char === '\r')
    /** */

    /* trim leading spaces & trailing spaces from "bob = cool" */
    if (keyIsOpen && char === ' ' || (!openQuote && !bufferValue && char === ' ')) {
      // console.log('EXIT ON', bufferValue)
      continue;
    }

    if (keyIsOpen && char === ',') {
      // console.log('EXIT ON', bufferValue)
      continue;
    }

    /* If k/v separator, and not inside value exit & keep going through text */
    if (bufferKey && keyIsOpen && char === '=') {
      // console.log('SKIP')
      keyIsOpen = false
      valueIsOpen = true
      continue;
    }

    /* If key but no value, set as true boolean */
    if (keyIsOpen && bufferKey && (char === ',' || WHITE_SPACE.test(char) || !nextChar) ) {
      if (!nextChar) {
        bufferKey+= char
      }
      save(bufferKey, true, 'true')
      continue
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

        // if (bufferValue.match(NOT_OBJECT_LIKE)) {
        //   save(bufferKey, preFormat(bufferValue), 'NOT_OBJECT_LIKE')
        //   continue;
        // }

        const bracketsBalanced = isBalanced(bufferValue)
        console.log('bracketsBalanced', bracketsBalanced)

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
        save(bufferKey, preFormat(bufferValue), 'LAST LOOP')
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
        console.log('char', char)
        console.log('nextChar', WHITE_SPACE.test(nextChar))
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

function preFormat(val) {
  let value = removeTempQuotes(val)
  .replace(TRAILING_COMMAS, '')
  console.log('preFormat value', value)
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

  // If Doesn't look like JSON object
  if (value.match(/^{[^:,]*}/)) {
    value = removeSurroundingBrackets(value)
  // If looks like array in brackets {[ thing, thing, thing ]}
  } else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ] }
    value = removeSurroundingBrackets(value)
  // If matches {` stuff `} & {[ stuff ]}
  } else if (value.match(/^{(?:`|\[)([\s\S]*?)(?:`|\])}$/)) {
    value = removeSurroundingBrackets(value)
  }
  
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
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    // Remove single line comments
    .replace(/^\s*(\/\/+|\/\*+|#+)(.*)\n?/gm, '')
}

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