
var fs = require('fs');

var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var npm = require('rollup-plugin-node-resolve');

var examples = fs.readdirSync('examples');

function file_exists(file) {
    try {
        fs.accessSync(file);
        return true;
    } catch (err) {
        return false;
    }
}

function build_example(folder) {
    if (file_exists('examples/' + folder + '/index.js')) {
        rollup.rollup({
            // tell rollup our main entry point
            entry: 'examples/' + folder + '/index.js',
            plugins: [
                // configure rollup-babel to use the ES2015 Rollup preset
                // and not transpile any node_modules files
                babel(),
                npm()
                // minify with uglify
            ]
        }).then(function(bundle) {
            // write bundle to a file and use the IIFE format so it executes immediately
            return bundle.write({
                //format: 'iife',
                dest: 'examples/' + folder + '/dist/index.js'
            });
        }).then(function() {
            console.log('Bundle for example "' + folder + '" created');
        }).catch(function(e) {
            console.error(e);
        });
    } else {
        console.info('No entry index.js for example "'+folder+'"');
    }
}

examples.forEach(example => {
    build_example(example);
});
