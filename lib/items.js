'use strict';

const Schema = require('./schema.js');

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

/**
 * Creates a new instance of tf2-items
 * @class
 * @param {object} options Optional settings
 * @param {string} [options.apiKey] Steam API key
 * @param {number} [options.updateTime=86400000] Time of interval in milliseconds to update the schema (can't be less than 3600000)
 */
function Items (options) {
    options = options || {};

    EventEmitter.call(this);

    this.apiKey = options.apiKey;
    this.updateTime = options.updateTime || 86400000; // 24 hours
    if (this.updateTime < 3600000) {
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
    const schema = new Schema(details);
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
        this.schema = new Schema();
    }

    const self = this;
    self._refresh(function (err) {
        if (err) {
            if (callback !== undefined) {
                callback(err);
            }
            return;
        }

        self._interval = setInterval(Items.prototype._refresh.bind(self), self.updateTime);

        callback(null);
    });
};

/**
 * Get name of an item object
 * @param {object} item Item object
 * @param {number} item.defindex
 * @param {number} item.quality Quality id
 * @param {boolean} item.craftable
 * @param {boolean} [item.tradeable]
 * @param {number} item.killstreak 0=None, 1=Killstreak, 2=Specialized Killstreak, 3=Professional Killstreak
 * @param {number|null} item.effect Effect id
 * @param {boolean} item.australium
 * @return {string} Name of item
 */
Items.prototype.getName = function (item) {
    const schemaItem = this.schema.getItem(item.defindex);
    if (schemaItem === null) {
        return null;
    }

    let name = '';
    if (item.tradeable === false) {
        name = 'Non-Tradeable ';
    }
    if (item.craftable === false) {
        name += 'Non-Craftable ';
    }
    if (item.quality != 6 && item.quality != 15 || (item.quality == 5 && item.effect == null)) {
        name += this.schema.getQuality(item.quality) + ' ';
    }
    if (schemaItem.item_quality == 5) {
        name += this.schema.getQuality(schemaItem.item_quality) + ' ';
    }
    if (item.effect !== null) {
        name += this.schema.getEffect(item.effect) + ' ';
    }
    if (item.killstreak > 0) {
        name += ['None', 'Killstreak', 'Specialized Killstreak', 'Professional Killstreak'][item.killstreak] + ' ';
    }
    if (item.australium === true) {
        name += 'Australium ';
    }
    if (name === '' && schemaItem.proper_name === true) {
        name = 'The ';
    }
    if (schemaItem.item_quality == 15) {
        name += schemaItem.name;
    }

    name += schemaItem.item_name;
    return name;
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
