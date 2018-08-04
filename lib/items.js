'use strict';

const Schema = require('./schema.js');
const Inventory = require('./inventory.js');

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

/**
 * Creates a new instance of tf2-items
 * @class
 * @param {object} options Optional settings
 * @param {string} [options.apiKey] Steam API key
 * @param {number} [options.updateTime=86400000] Time in milliseconds to update the schema (can't be less than 3600000), -1 to disable periodic updating
 */
function Items (options) {
    options = options || {};

    EventEmitter.call(this);

    this.apiKey = options.apiKey;
    this.updateTime = options.updateTime || 86400000; // 24 hours
    if (this.updateTime < 3600000 && this.updateTime != -1) {
        this.updateTime = 3600000;
    }
    this.ready = false;
}

inherits(Items, EventEmitter);

/**
 * Use a previously saved instance of the schema
 * @param {Object} details Details from Schema.toJSON()
 */
Items.prototype.setSchema = function (details) {
    const schema = new Schema(details, { updateTime: this.updateTime });
    this.schema = schema;
};

/**
 * Initializes the module by getting the schema
 * @param {funciton} [callback] Function to call when done
 * @throws Will throw an error if an apiKey is not set
 */
Items.prototype.init = function (callback) {
    if (this.apiKey === undefined) {
        throw new Error('No apiKey set (yet)');
    }

    if (this.schema === undefined) {
        this.schema = new Schema(undefined, { updateTime: this.updateTime });
    }

    const self = this;
    self._refresh(function (err) {
        if (err) {
            if (callback !== undefined) {
                callback(err);
            }
            return;
        }

        if (self.updateTime != -1) {
            self._interval = setInterval(Items.prototype._refresh.bind(self), self.updateTime);
        }
        self.ready = true;

        callback(null);
    });
};

Items.prototype.getInventory = function (steamid64, callback) {
    if (!this.ready) {
        throw new Error('Initialize the module before doing anything');
    }

    const inventory = new Inventory(steamid64, this.schema);
    inventory.fetch(this.apiKey, function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, inventory);
    });
};

/**
 * Function used internally to refresh the schema
 * @param {function} [callback] Function to call when done
 */
Items.prototype._refresh = function (callback) {
    const self = this;
    self.schema.fetch(this.apiKey, function (err, updated) {
        if (err) {
            if (callback !== undefined) {
                callback(err);
            }
            return;
        }

        if (updated === true) {
            self.emit('schema', self.schema);
        }

        if (callback !== undefined) {
            callback(null);
        }
    });
};

module.exports = Items;
