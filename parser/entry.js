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
  constructor(fileName, lang, projectRoot) {
    // 判断文件是否存在
    if (!fs.existsSync(fileName)) {
      console.error(`文件 ${fileName} 不存在`);
      return process.exit(1);
    }
    super({
      projectRoot,
      dirname: path.dirname(fileName),
      lang,
    });
    this.root = fileName;
    // 文件所在目录
    this.filePath = fileName;
    this.parseFile();
  }
  // 遍历词条
  execItem(key) {
    const undefinedNamespace = key.split('.');
    let walkNamespaceIndex = -1;

    let result = { exhausted: false, match: true };
    while (result.exhausted === false) {
      if (result.match) {
        if (walkNamespaceIndex === undefinedNamespace.length - 2) {
          result = this.findMatchedKeyword({ type: 'key', value: undefinedNamespace[++walkNamespaceIndex]}, result?.node);
        } else {
          result = this.findMatchedKeyword({ type: 'namespace', value: undefinedNamespace[++walkNamespaceIndex]}, result?.node);
        }
      } else {
        console.log(result, '错误记录')
        // TODO: 记录错误
      }
    }

    console.log(result, 'shit')
  }
}

module.exports = EntryParser;