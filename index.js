'use strict';

var Schema = require('./classes/Schema.js');
var Inventory = require('./classes/Inventory.js');

module.exports = Items;

require('util').inherits(Items, require('events').EventEmitter);

function Items(options) {
	options = options || {};

	this.apiKey = options.apiKey;
	/*
	this.retryTime = options.retryTime || 2000;
	this.retry = options.retry || true;
	this.maxRetries = options.maxRetries || 5;
	*/
	this.updateTime = options.updateTime || 8 * 60 * 60 * 1000; // 8 hours
	this.language = options.language || "English"
	this.ready = false;

	this.request = require('request');
};

Items.prototype.init = function(callback) {
	var self = this;
	self.updateTimer = setInterval(Items.prototype.getSchema.bind(self), self.updateTime);
	self.getSchema(function(err, success) {
		if (err || !success) {
			if (callback) {
				callback(err || new Error("Did not get a valid response"));
			}
			return;
		}

		self.ready = true;
		self.emit("ready");
		if (callback) {
			callback(null);
		}
	});
};

Items.prototype.getSchema = function(callback) {
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

Items.prototype.getInventory = function(steamid64, callback) {
	if (this.ready !== true) {
		callback(new Error("Not ready (yet)"));
		return;
	}

	var inventory = new Inventory(steamid64, this.schema);
	inventory.fetch(this.apiKey, function(err) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, inventory);
	});
};