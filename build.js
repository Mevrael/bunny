
const CLI = require('assets-builder/node_scripts/cli');
const Dist = require('./node_scripts/Dist');
const Examples = require('./node_scripts/Examples');

CLI.init();

CLI.registerCmd('dist', 'Build dists', [], Dist);
CLI.registerCmd('examples', 'Build examples', [], Examples);

CLI.run();
