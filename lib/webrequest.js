'use strict';

const request = require('@nicklason/request-retry');

/**
 * Sends a request to the Steam api
 * @param {string} httpMethod Request method
 * @param {string} method API method
 * @param {string} version Version of API method
 * @param {Object} input Query string or body to send in the request
 * @param {function} callback Function to call when done
 */
function WebRequest (httpMethod, method, version, input, callback) {
    const url = 'https://api.steampowered.com';
    const face = 'IEconItems_440';

    const options = {
        uri: `${url}/${face}/${method}/${version}`,
        method: httpMethod,
        gzip: true,
        json: true
    };

    options[httpMethod === 'GET' ? 'qs' : 'body'] = input;

    request(options, function (err, response, body) {
        if (err) {
            return callback(err);
        }

        const result = body.result;
        if (Object.keys(body).length === 0 || result === undefined) {
            // It is probably best if we assume that it is down, and only notify when it is actually up :thinksmart:
            err = new Error('API is down');
            return callback(err);
        }

        if (result.status != 1) {
            return callback(new Error(result.note));
        }

        callback(null, result);
    });
}

module.exports = WebRequest;
