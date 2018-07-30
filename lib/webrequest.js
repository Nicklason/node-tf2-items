'use strict';

const request = require('requestretry').defaults({
    json: true,
    gzip: true,
    timeout: 10000
});

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

    let options = {
        uri: `${url}/${face}/${method}/${version}`,
        method: httpMethod
    };

    options[httpMethod === 'GET' ? 'qs' : 'body'] = input;

    request(options, function (err, response, body) {
        if (err) {
            return callback(err);
        }

        if (!body || typeof body != 'object') {
            err = new Error('Invalid API response');
            err.body = body;
            callback(err);
            return;
        }

        const result = body.result;
        if (result.status != 1) {
            callback(new Error(result.note));
            return;
        }

        callback(null, result);
    });
}

module.exports = WebRequest;
