#!/usr/bin/env node
'use strict';

const path = require('path');
const dirname = path.dirname;

// redirect commands to dist/cli subfolder
process.argv[1] = dirname(process.argv[1], '.js') + "/dist/src/cli/cli.js"

require("./dist/src/cli/cli");
