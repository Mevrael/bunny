
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
    // Polyfills
    ['polyfills/Promise', 'polyfill-promise.min'],
    ['polyfills/ObjectAssign', 'polyfill-object-assign.min'],
    ['polyfills/fetch', 'polyfill-fetch.min'],

    // BunnyJS specific core helpers
    ['utils/core', 'core-helpers.min'],

    // Utility (helper) functions
    ['utils/DOM/events', 'utils-dom.min'],
    ['utils/svg', 'utils-svg.min'],
    ['utils/string', 'utils-string.min'],

    // Basic components, JavaScript extensions
    ['url', 'url.min'],
    ['BunnyDate', 'date.min'],
    ['BunnyElement', 'element.min'],

    // Basic app components
    ['bunny.template', 'template.min'],
    ['bunny.route', 'route.min'],

    // AJAX and files
    ['bunny.ajax', 'ajax.min'],
    ['file/file', 'file.min'],
    ['file/image', 'image.min', ['src/file/file.js']],

    // Components
    ['Pagination', 'pagination.min', ['src/url.js']],
    ['Spinner', 'spinner.min', ['src/utils/svg.js']],
    ['TabSection', 'tabsection.min'],
    ['bunny.datepicker', 'datepicker.min'],

    // Dropdown components
    ['Dropdown', 'dropdown.min', ['src/utils/DOM.js', 'src/utils/core.js']],
    ['CustomSelect', 'customselect.min', ['src/Dropdown.js', 'src/utils/core.js']],
    ['Autocomplete', 'autocomplete.min', ['src/utils/DOM.js', 'src/Dropdown.js', 'src/utils/core.js']],
    ['plugins/AutocompleteIcons', 'autocomplete.icons.min', ['src/utils/DOM.js', 'src/Autocomplete.js']],

    // Higher-level components
    ['Validation', 'validation.min', ['src/file/file.js', 'src/file/image.js', 'src/bunny.ajax.js', 'src/BunnyElement.js']],
    ['DataTable', 'datatable.min', ['src/bunny.ajax.js', 'src/bunny.template.js', 'src/Pagination.js', 'src/utils/DOM.js']],

  ];

  dists.forEach(dist => {
    const entryFile = `src/${dist[0]}.js`;
    const destFile = `dist/${dist[1]}.js`;
    const ignoreFiles = dist[2] !== undefined ? dist[2] : [];
    buildJs(null, entryFile, destFile, ignoreFiles).catch(e => console.error(e));
  })

} else if (Core.args[0] === 'svg') {
  const exec = require('child_process').exec;
  const cmd = 'svg-sprite-generate -d examples/autocomplete2/icons -o examples/autocomplete2/sprites.svg';

  exec(cmd, function(error, stdout, stderr) {
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
  });
} else {
  const examples = fs.readdirSync('examples');

  examples.forEach(example => {
    build_example(example);
  });
}

