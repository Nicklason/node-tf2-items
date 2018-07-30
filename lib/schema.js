'use strict';

const WebRequest = require('./webrequest');

const async = require('async');
const moment = require('moment');
const values = require('object.values');

/**
 * Creates a new Schema instance
 * @param {Object[]} [options] Schema details
 * @param {string} [options.language=English] Schema language
 * @param {number} [options.time] When the schema was last fetched
 */
function Schema (options) {
    if (options === undefined) {
        this.language = 'English';
        this.time = -1;
    } else {
        for (let key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }
}

/**
 * Fetch schema details
 * @param {string} apiKey Your Steam API key
 * @param {function} [callback] Function to call when done
 */
Schema.prototype.fetch = function (apiKey, callback) {
    const now = moment().unix();
    if (now - 3600 < this.time) {
        if (callback !== undefined) {
            callback(null, false);
        }
        return;
    }

    const self = this;
    async.parallel([
        function (callback) {
            self._fetchItems(apiKey, callback);
        },
        function (callback) {
            self._fetchOverview(apiKey, callback);
        }
    ], function (err) {
        if (err) {
            if (callback !== undefined) {
                callback(err);
            }
            return;
        }

        self.time = now;
        if (callback !== undefined) {
            callback(null, true);
        }
    });
};

/**
 * Converts schema into an object that can easily be saved
 * @return {Object} Schema details
 */
Schema.prototype.toJSON = function () {
    let json = {};
    for (let key in this) {
        if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
            json[key] = this[key];
        }
    }

    return json;
};

/**
 * Gets either the id, or name or an quality
 * @param {number|string} search id or name to search by
 * @return {string|number} Returns the id or name of the quality
 */
Schema.prototype.getQuality = function (search) {
    const isNumber = /^\d+$/.test(search);

    const ids = values(this.qualities);
    const names = values(this.qualityNames);

    const current = isNumber === true ? ids : names;
    const opposite = isNumber === true ? names : ids;

    let found = null;
    for (let i = 0; i < ids.length; i++) {
        if (current[i] == search) {
            found = opposite[i];
        }
    }

    return found;
};

/**
 * Get either the id, or name of an effect
 * @param {number|string} search id or name to search by
 * @return {string|number} Returns the id or name of quality
 */
Schema.prototype.getEffect = function (search) {
    const isNumber = /^\d+$/.test(search);

    let found = null;
    for (let i = 0; i < this.attribute_controlled_attached_particles.length; i++) {
        const effect = this.attribute_controlled_attached_particles[i];

        const current = isNumber === true ? 'id' : 'name';
        const opposite = isNumber === true ? 'name' : 'id';
        if (effect[current] == search) {
            found = effect[opposite];
        }
    }

    return found;
};

Schema.prototype.getItem = function (defindex) {
    let found = null;
    for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.defindex == defindex) {
            found = item;
        }
    }
    return found;
};

/**
 * Function used internally to fetch the schema overview
 * @param {string} apiKey Your Steam API key
 * @param {function} callback Function to call when done
 */
Schema.prototype._fetchOverview = function (apiKey, callback) {
    const input = {
        language: this.language,
        key: apiKey
    };

    const self = this;
    new WebRequest('GET', 'GetSchemaOverview', 'v0001', input, function (err, result) {
        if (err) {
            return callback(err);
        }

        delete result.status;

        for (let key in result) {
            if (result.hasOwnProperty(key)) {
                self[key] = result[key];
            }
        }

        callback(null, result);
    });
};

/**
 * Function used internally to fetch the schema items
 * @param {string} apiKey Your Steam API key
 * @param {function} callback Function to call when done
 */
Schema.prototype._fetchItems = function (apiKey, callback) {
    this.items = [];
    this._fetchAllItems(apiKey, callback);
};

/**
 * Function used internally to fetch all schema items
 * @param {string} apiKey Your Steam API key
 * @param {number} [next=0] Used to paginate, tells Steam what part of the schema items you want
 * @param {function} callback Function to call when done
 */
Schema.prototype._fetchAllItems = function (apiKey, next, callback) {
    if (callback === undefined) {
        callback = next;
        next = 0;
    }

    const input = {
        language: this.language,
        key: apiKey,
        start: next
    };

    const self = this;
    new WebRequest('GET', 'GetSchemaItems', 'v0001', input, function (err, result) {
        if (err) {
            return callback(err);
        }

        self.items = (self.items || []).concat(result.items);

        if (result.next !== undefined) {
            self._fetchAllItems(apiKey, result.next, callback);
        } else {
            callback(null, self.items);
        }
    });
};

module.exports = Schema;
