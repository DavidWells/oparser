const { parse, parseValue, stringify, options } = require('./src')



//*
const val = parseValue("{<span foo='true'>jsx style</span>}")
console.log('val', val)
/** */


/*
const five = `isCool onClick={"() => { console.log('h i')}"}`
console.log(parse(five))
/** */
