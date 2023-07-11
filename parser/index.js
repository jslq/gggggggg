const path = require('path')
const EntryParser = require('./entry')

const p = new EntryParser(path.resolve(__dirname, '../a.ts'), 'cn')
p.execItem('translation.天')

process.exit(0)

