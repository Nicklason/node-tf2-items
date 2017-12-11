'use strict';

var core = require('./lib/core.js');

core.WebRequest = require('./classes/WebRequest.js');
core.Schema = require('./classes/Schema.js');
core.Inventory = require('./classes/Inventory.js');
core.Item = require('./classes/Item.js');

module.exports = core;