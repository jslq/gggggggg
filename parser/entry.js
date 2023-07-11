const FileParser = require('./file');
const fs = require('fs');
const path = require('path');

/**
 * @class EntryParser
 * @extends FileParser
 * @description 解析入口文件
 * @param {string} fileName 绝对路径
 * @param {string} projectRoot 项目根目录,应该包含src路径
 */
class EntryParser extends FileParser {
  constructor(fileName, projectRoot) {
    // 判断文件是否存在
    if (!fs.existsSync(fileName)) {
      console.error(`文件 ${fileName} 不存在`);
      return process.exit(1);
    }
    super({
      projectRoot,
      dirname: path.dirname(fileName),
    });
    this.root = fileName;
    // 文件所在目录
    this.filePath = fileName;
    this.parseFile(this.context);

    this.resolveImportNodes(this.context);
  }
  // 遍历词条
  execItem(key) {
    const undefinedNamespace = key.split('.');
    const walkNamespaceIndex = 0;
    const namespace = undefinedNamespace[walkNamespaceIndex];

    const node = this.findMatchedNamespaceNode(namespace);
    console.log(node)
  }
}

module.exports = EntryParser;