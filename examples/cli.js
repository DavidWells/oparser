const { parse } = require('../src')

const args = process.argv.slice(2).join(' ')
console.log('CLI Args', args)

const parsedArgs = parse(args)
console.log('Parsed Args', parsedArgs)

/*

node examples/cli.js foo bar = baz lol='{ foo: bar }' array='[1, 2, 'bob']'
> { foo: true, bar: 'baz', lol: { foo: 'bar' }, array: [ 1, 2, 'bob' ] }
*/