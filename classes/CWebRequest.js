'use strict';

module.exports = CWebRequest;

var request = require('request');

function CWebRequest(httpMethod, method, version, input, callback) {
	input = input || {};
	if (!input.key) {
		callback(new Error('No API-Key set (yet)'));
		return;
	}

	var face = 'IEconItems_440';

	var options = {
		'uri': `https://api.steampowered.com/${face}/${method}/${version}/`,
		'method': httpMethod,
		'gzip': true,
		'json': true,
		'qs': input
	};

	// Retry until valid response, or too many attempts.
	this._retryUntilResponse(options, callback);
}

CWebRequest.prototype._retryUntilResponse = function(attempts, options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = attempts;
		attempts = 0;
	} else if (attempts >= 5) {
		// Attempted to get a valid response but failed multiple times.
		callback(new Error('Failed to get a valid response'));
		return;
	}

	var self = this;
	self.httpRequest(options, function(err, response, body) {
		attempts++;
		if (err) {
			// Retry if an error occurred.
			setTimeout(CWebRequest.prototype._retryUntilResponse.bind(self, attempts, options, callback), 2000);
			return;
		}

		if (!body || typeof body != 'object') {
			// Missing body, something went wrong.
			callback(new Error('Invalid API response'));
			return;
		}

		var result = body.result;

		if (result.status != 1) {
			callback(new Error(result.note));
			return;
		}

		// Got a valid response, running the callback.
		callback(null, result);
	});
};

CWebRequest.prototype.httpRequest = function(uri, options, callback) {
	if (typeof uri === 'object') {
		callback = options;
		options = uri;
		uri = options.url || options.uri;
	} else if (typeof options == 'function') {
		callback = options;
		options = {};
	}

	options.url = options.uri = uri;
	options.timeout = options.timeout || 10000;

	var self = this;
	request(options, function(err, response, body) {
		var hasCallback = !!callback;
		var httpError = options.checkHttpError != false && self._checkHttpError(err, response, callback, body);
		var jsonError = options.json && options.checkJsonError != false && !body ? new Error('Malformed response') : null;

		if (hasCallback && !(httpError || jsonError)) {
			if (jsonError) {
				callback.call(self, jsonError, response);
			} else {
				callback.apply(self, arguments);
			}
		}
	});
};

CWebRequest.prototype._checkHttpError = function(err, response, callback, body) {
	if (err) {
		callback(err, response, body);
		return err;
	}

	if (response.statusCode > 499 && response.statusCode < 600) {
		err = new Error('Team Fortress 2 APIs are down');
		err.code = response.statusCode;
		callback(err, response, body);
		return err;
	}

	return false;
};