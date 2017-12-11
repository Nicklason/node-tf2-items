'use strict';

var Core = require('./core.js');
var Schema = require('../classes/Schema.js');
var Inventory = require('../classes/Inventory.js');

Core.prototype.getSchema = function(callback) {
	var self = this;

	var schema = new Schema();
	schema.fetch(self.apiKey, function(err, success) {
		if (err) {
			callback(err);
			return;
		}

		if (success) {
			// Update schema if request was successful.
			self.schema = schema;
		}

		callback(null, schema);
	});
};

Core.prototype.getInventory = function(steamid64, callback) {
	var inventory = new Inventory(steamid64, this.schema);
	inventory.fetch(this.apiKey, function(err) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, inventory);
	});
};