
const buildJs = require('assets-builder/node_scripts/js');
const Core = require('assets-builder/node_scripts/core');
const fs = require('fs');

function file_exists(file) {
    try {
        fs.accessSync(file);
        return true;
    } catch (err) {
        return false;
    }
}

function build_example(folder) {

  const entryFile = 'examples/' + folder + '/index.js';
  const destFile = 'examples/' + folder + '/dist/index.js';

    if (file_exists(entryFile)) {
        buildJs(null, entryFile, destFile)
        .then(function() {
            console.log('Bundle for example "' + folder + '" created');
        }).catch(function(e) {
            console.error(e);
        });
    } else {
        console.info('No entry index.js for example "'+folder+'"');
    }
}



//buildJs('dom-utils', 'src/Dropdown.js', 'dist/dropdown.min.js', ['src/utils/DOM/events.js']);

if (Core.args[0] === 'dist') {
  const dists = [
    ['Dropdown', 'dropdown.min', ['src/utils/DOM/events.js']],
    ['Autocomplete', 'autocomplete.min', ['src/utils/DOM/events.js', 'src/Dropdown.js', 'src/utils/core.js']],
    ['utils/core', 'core-helpers.min'],
    ['utils/DOM/events', 'utils-dom.min']
  ];

  dists.forEach(dist => {
    const entryFile = `src/${dist[0]}.js`;
    const destFile = `dist/${dist[1]}.js`;
    const ignoreFiles = dist[2] !== undefined ? dist[2] : [];
    buildJs(null, entryFile, destFile, ignoreFiles).catch(e => console.error(e));
  })

} else {
  const examples = fs.readdirSync('examples');

  examples.forEach(example => {
    build_example(example);
  });
}

