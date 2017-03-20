
const JS = require('assets-builder/node_scripts/js');

const dists = [
  ['normalize', 'normalize.min'],
  //['babel-helpers', 'babel-helpers.min'],

  // Polyfills
  ['polyfills/Promise', 'polyfill-promise.min'],
  ['polyfills/ArrayFrom', 'polyfill-array-from.min'],
  ['polyfills/ObjectAssign', 'polyfill-object-assign.min'],
  ['polyfills/fetch', 'polyfill-fetch.min'],
  ['polyfills/template', 'polyfill-template.min'],
  ['polyfills/polyfills', 'polyfills.min'],

  // BunnyJS specific core helpers
  ['utils/core', 'core-helpers.min'],

  // Utility (helper) functions
  ['utils/DOM', 'utils-dom.min'],
  ['utils/svg', 'utils-svg.min'],
  ['utils/string', 'utils-string.min'],

  // Basic components, JavaScript extensions
  ['url', 'url.min'],
  ['BunnyDate', 'date.min'],
  ['BunnyElement', 'element.min'],
  ['bunny.ajax', 'ajax.min'],
  ['file/file', 'file.min'],
  ['file/image', 'image.min', ['src/file/file.js']],

  // Basic app components
  ['bunny.template', 'template.min'],
  ['Route', 'route.min'],
  ['Api', 'api.min', ['src/Notify.js']],
  ['Notify', 'notify.min'],
  ['Modal', 'modal.min', ['src/utils/DOM.js']],

  // Experimental Components based on DOMObserver
  //['DOMObserver', 'dom-observer/min'],
  ['Component', 'component.min'],

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

  ['DataTable', 'datatable.min', ['src/bunny.ajax.js', 'src/bunny.template.js', 'src/Pagination.js', 'src/utils/DOM.js', 'src/url.js', 'src/BunnyElement.js']],
  ['plugins/DataTableIcons', 'datatable.icons.min', ['src/Spinner.js', 'src/DataTable.js']],
  ['plugins/DataTableScrollTop', 'datatable.scrolltop.min', ['src/BunnyElement.js', 'src/DataTable.js']],

  ['ImageProcessor', 'image-processor.min', ['src/utils/DOM.js', 'src/file/image.js']],
  ['ImageUpload', 'image-upload.min', ['src/file/file.js', 'src/file/image.js', 'src/Modal.js', 'src/ImageProcessor.js']],

];

const Dist = {
  run(args, isProd, Conf) {
    dists.forEach(dist => {
      const entryFile = `src/${dist[0]}.js`;
      const destFile = `dist/${dist[1]}.js`;
      const ignoreFiles = dist[2] !== undefined ? dist[2] : [];
      JS.isProduction = isProd;
      return JS.makeFile(null, entryFile, destFile, ignoreFiles);
    })
  }
};

module.exports = Dist;
