#!/usr/bin/env ts-node
'use strict';
require('./cli');
require('./rewire-compiler');
require('./rewire-runner');
module.exports = require('testcafe');
