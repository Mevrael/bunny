
const JS = require('assets-builder/node_scripts/js');
const fs = require('fs');

function file_exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch (err) {
    return false;
  }
}


const Examples = {
  run(args, isProd, Conf) {

    const examples = fs.readdirSync('examples');

    examples.forEach(folder => {

      const entryFile = 'examples/' + folder + '/index.js';
      const destFile = 'examples/' + folder + '/dist/index.js';

      if (file_exists(entryFile)) {
        JS.makeFile(null, entryFile, destFile);
      } else {
        console.info('No entry index.js for example "'+folder+'"');
      }
    });
  }
};

module.exports = Examples;
