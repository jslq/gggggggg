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
    let exportNodes = [];

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
        default:
          break;
      }
    }

    this.importNodes = importNodes;
    this.exportDefaultNode = exportDefaultNode;
    this.variableNodes = variableNodes;
  }

  resolveImportNodes(dirname) {
    for(let i = 0; i < this.importNodes.length; i++) {
      const importNode = this.importNodes[i];
      const source = importNode.source.value;
      const rFilePath = ''
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

      this.context.dirname = path.dirname(rFilePath);
      const child = new FileParser(this.context)
      child.filePath = rFilePath;
      child.parseFile();
      this.children.push(child);
    }
  }

  findMatchedNamespaceNode() {
    
  }
}

module.exports = FileParser;