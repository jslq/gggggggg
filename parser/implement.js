const acorn = require('acorn');

class Parser {
  constructor() {}
  parse(file) {
    return acorn.Parser.parse(file, {
      sourceType: 'module',
    })
  }
}

module.exports = Parser