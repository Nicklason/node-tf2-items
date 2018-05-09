'use strict';

var CSchema = require('./classes/CSchema.js');
var CInventory = require('./classes/CInventory.js');

module.exports = Items;

require('util').inherits(Items, require('events').EventEmitter);

function Items(options) {
	options = options || {};

	this.apiKey = options.apiKey;
	this.updateTime = options.updateTime || 8 * 60 * 60 * 1000; // 8 hours
	this.language = options.language || 'English';
	this.ready = false;

	this.request = require('request');
}

Items.prototype.init = function(callback) {
	if (this.ready == true) {
		callback(null);
		return;
	}

	var self = this;
	self.getSchema(function(err) {
		if (err) {
			if (callback) {
				callback(err);
			}
			return;
		}

		self.updateTimer = setInterval(Items.prototype.getSchema.bind(self), self.updateTime);
		self.ready = true;
		self.emit('ready');
		if (callback) {
			callback(null);
		}
	});
};

Items.prototype.getSchema = function(callback) {
	var schema = new CSchema();

	var self = this;
	schema.fetch(self.apiKey, function(err) {
		if (err) {
			if (callback) {
				callback(err);
			}
			return;
		}

		self.schema = schema;

		if (callback) {
			callback(null, schema);
		}
	});
};

Items.prototype.getInventory = function(steamid64, callback) {
	if (!this.ready) {
		callback(new Error('Not ready (yet)'));
		return;
	}

	var inventory = new CInventory(steamid64, this.schema);
	inventory.fetch(this.apiKey, function(err) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, inventory);
	});
};