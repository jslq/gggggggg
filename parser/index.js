const path = require('path')
const EntryParser = require('./entry')

const p = new EntryParser(path.resolve(__dirname, '../a.ts'))
p.execItem('translation.天')

process.exit(0)

const fs = require('fs')
const { Parser } = require('acorn')

const log = (obj) => {
  console.log(JSON.stringify(obj, null, 2))
}

const key = 'translation.天'
const lang = 'cn'
const undefinedNamespace = key.split('.')
const walkNamespaceIndex = 0
const namespace = undefinedNamespace[walkNamespaceIndex]

const entryFile = fs.readFileSync(path.resolve(__dirname, '../a.ts'), 'utf-8')
const entryAstResult = Parser.parse(entryFile, {
  sourceType: 'module',
})

const findExportDefaultDeclaration = (ast) => {
  return ast.body.find(node => node.type === 'ExportDefaultDeclaration')
}

const findVariableDeclaration = (ast) => {
  return ast.body.filter(node => node.type === 'VariableDeclaration')
}

const findImportDeclaration = (ast) => {
  return ast.body.filter(node => node.type === 'ImportDeclaration')
}

const exportNode = findExportDefaultDeclaration(entryAstResult)
const variableNodes = findVariableDeclaration(entryAstResult)
const importNodes = findImportDeclaration(entryAstResult)

const findMatchVariable = (variables, name) => {
  let node = null
  variables.forEach(variable => {
    variable.declarations.forEach(declaration => {
      if (declaration.id.name === name) {
        node = declaration
      }
    })
  })
  return node
}

const findMatchImport = (imports, name) => {
  let node = null
  imports.forEach(importNode => {
    importNode.specifiers.forEach(specifier => {
      if (specifier.local.name === name) {
        node = importNode
      }
    })
  })

  return node
}

const matchExportVariable = findMatchVariable(variableNodes, exportNode.declaration.name)

const findVariableDeclarationByNamespace = (variable, namespace) => {
  let node = null
  const properties = variable.init.properties
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    if (property.type === 'Property') {
      if (property.key.name === namespace) {
        node = property
        // break
      }
    } else if (property.type === 'SpreadElement') {
      const argument = property.argument
      if (argument.type === 'Identifier') {
        const name = argument.name
        const variable = findMatchVariable(variableNodes, name)
        if (variable === null) {
          const importNode = findMatchImport(importNodes, name)
          console.log(importNode.source.value)
        }
      }
    }
  }
  return node
}


const matchNamespaceVariable = findVariableDeclarationByNamespace(matchExportVariable, namespace)

// log(matchNamespaceVariable)

// console.log(JSON.stringify(entryAstResult, null, 2))
