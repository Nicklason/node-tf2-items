'use strict';

module.exports = Core;

require('util').inherits(Core, require('events').EventEmitter);

function Core(options) {
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

Core.prototype.init = function(callback) {
	var self = this;
	self.updateTimer = setInterval(Core.prototype.getSchema.bind(self), self.updateTime);
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

require('./methods.js');