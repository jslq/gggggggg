const Parser = require('./implement');
const fs = require('fs');
const path = require('path');

const probeExt = ['.ts', '.tsx']

class FileParser extends Parser {
  constructor(context) {
    super();
    this.children = [];
    this.context = context;
  }
  parseFile() {
    const file = fs.readFileSync(this.filePath, 'utf-8');
    const ast = this.parse(file);
    const nodes = ast.body;

    let variableNodes = [];
    let importNodes = [];
    let exportDefaultNode = null;
    let exportNamedNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      switch (node.type) {
        case 'ExportDefaultDeclaration':
          exportDefaultNode = node;
          break;
        case 'VariableDeclaration':
          variableNodes.push(node);
          break;
        case 'ImportDeclaration':
          importNodes.push(node);
          break;
        case 'ExportNamedDeclaration': 
          exportNamedNodes.push(node);
          break;
        default:
          console.log(node.type)
          break;
      }
    }

    this.importNodes = importNodes;
    this.exportDefaultNode = exportDefaultNode;
    this.variableNodes = variableNodes;
    this.exportNamedNodes = exportNamedNodes;

    this.resolveImportNodes();
  }

  resolveImportNodes() {
    for(let i = 0; i < this.importNodes.length; i++) {
      const importNode = this.importNodes[i];
      const source = importNode.source.value;
      let rFilePath = ''
      // 相对路径
      if (source.startsWith('.')) {
        probeExt.forEach(ext => {
          const filePath = path.resolve(this.context.dirname, `${source}${ext}`);
          if (fs.existsSync(filePath)) {
            rFilePath = filePath;  
          } 
        })
      } else {
        // path alias
        probeExt.forEach(ext => {
          const filePath = path.resolve(this.context.projectRoot, `${source}${ext}`);
          if (fs.existsSync(filePath)) {
            rFilePath = filePath;  
          }
        })
      } 

      if (!rFilePath) {
        console.error(`文件 ${source} 不存在`);
        return process.exit(1);
      }

      const context = Object.assign({}, this.context)
      context.dirname = path.dirname(rFilePath);
      context.source = source;

      const child = new FileParser(context)
      child.filePath = rFilePath;
      child.parseFile();
      this.children.push(child);
    }
  }

  findMatchedKeyword(keyword, node) {
    if (!node) {        
      if (this.exportDefaultNode) {
        const vname = this.exportDefaultNode.declaration.name;
        node = this.findVnameInKindsOfNodes(vname)  
      } else {
        node = this.findVnameInKindsOfNodes(this.context.lang)
      }
    }

    if (node.type === 'ObjectExpression') {
      return this.walkObjectExpression(node, keyword);
    }

    if (node.type === 'VariableDeclarator') {
      if (node.init.type === 'ObjectExpression') {
        return this.walkObjectExpression(node.init, keyword);
      }
    }
    
    return result
  }

  findVnameInKindsOfNodes(vname) {
    let node = null
    outer: for (let i = 0; i < this.variableNodes.length; i++) {
      const variableNode = this.variableNodes[i];
      for (let j = 0; j < variableNode.declarations.length; j++) {
        if (variableNode.declarations[j].id.name === vname) {
          node = variableNode.declarations[j];
          break outer;
        }
      }
    }
    if (!node) {
      outer2: for (let i = 0; i < this.importNodes.length; i++) {
        const importNode = this.importNodes[i];
        for (let j = 0; j < importNode.specifiers.length; j++) {
          if (importNode.specifiers[j].local.name === vname) {
            node = importNode;
            break outer2;
          }
        }
      }
    }
    if (!node) {
      outer3: for (let i = 0; i < this.exportNamedNodes.length; i++) {
        const exportNamedNode = this.exportNamedNodes[i];
        if (exportNamedNode.declaration.type === 'VariableDeclaration') {
          node = this.walkVariableDeclarationToFindVname(exportNamedNode.declaration, vname);
          break outer3;
        }
      }
    }

    return node;
  }

  walkObjectExpression(node, keyword) {
    const { type, value } = keyword
    const properties = node.properties;
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      if (property.type === 'Property') {
        if (property.key.name === value) {
          console.log(type, value)
          return type === 'namespace' ? {
            match: true,
            exhausted: false,
            node: property.value,
          } : {
            match: true,
            exhausted: true,
            node: property.value,
            filePath: this.filePath
          }
        }
      }

      if (property.type === 'SpreadElement') {
        const vname = property.argument.name;
        node = this.findVnameInKindsOfNodes(vname)
        if (node.type === 'ImportDeclaration') {
          const fileParser = this.children.find(child => child.context.source === node.source.value);
          return fileParser.findMatchedKeyword(keyword);
        }
      }

      return {
        exhausted: true,
        match: false,
      }
    }
  }

  walkVariableDeclarationToFindVname(variableNode, vname) {
    for (let j = 0; j < variableNode.declarations.length; j++) {
      if (variableNode.declarations[j].id.name === vname) {
        return variableNode.declarations[j].init;
      }
    }
  }
}

module.exports = FileParser;