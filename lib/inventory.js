'use strict';

const WebRequest = require('./webrequest');

/**
 * Creates a new Inventory instance
 * @param {string} steamid64 Id of the user to get the inventory of
 * @param {Schema} schema An instance of the Schema
 */
function Inventory (steamid64, schema) {
    this.fetched = false;
    this.steamid64 = steamid64;
    this.schema = schema;
}

/**
 * Fetch schema details
 * @param {string} apiKey Your Steam API key
 * @param {function} [callback] Function to call when done
 */
Inventory.prototype.fetch = function (apiKey, callback) {
    const self = this;
    new WebRequest('GET', 'GetPlayerItems', 'v0001', { steamid: self.steamid64, key: apiKey }, function (err, result) {
        if (err) {
            if (callback !== undefined) {
                callback(err);
            }
            return;
        }

        for (const key in result) {
            if (result.hasOwnProperty(key)) {
                self[key] = result[key];
            }
        }

        self.fetched = true;

        if (callback) {
            callback(null, result);
        }
    });
};

/**
 * Check if the inventory is private
 * @return {boolean} True or false if the inventory is private or not
 */
Inventory.prototype.isPrivate = function () {
    return this.status == 15;
};

/**
 * Get a summary of the items in the inventory
 * @return {object} An object with the keys being the name of the items, and the value being an array of the asset ids
 */
Inventory.prototype.getOverview = function () {
    const overview = {};

    for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];

        const parsed = {
            defindex: item.defindex,
            quality: item.quality,
            craftable: item.hasOwnProperty('flag_cannot_craft') == false,
            killstreak: getKillstreak(item),
            australium: isAustralium(item),
            effect: getEffect(item)
        };

        const name = this.schema.getName(parsed);
        if (name != null) {
            (overview[name] = (overview[name] || [])).push(item.id);
        }
    }

    return overview;
};

Inventory.prototype.findItem = function (id) {
    const item = this.items.find((item) => item.id == id) || null;
    return item;
};

/**
 * Get the killstreak value of an item
 * @param {object} item
 * @return {number} Numeric representation of the killstreak (0=None, 1=Basic, 2=Specialized, 3=Professional)
 */
function getKillstreak (item) {
    if (item.attributes === undefined) {
        return 0;
    }
    const attribute = item.attributes.find((attribute) => attribute.defindex == 2025);
    if (attribute !== undefined) {
        return attribute.float_value;
    }
    return 0;
}

/**
 * Check if the item is australium or not
 * @param {object} item
 * @return {boolean} True or false if the item is australium or not
 */
function isAustralium (item) {
    if (item.attributes === undefined) {
        return false;
    }
    const australium = item.attributes.some((attribute) => attribute.defindex == 2027);
    return australium;
}

/**
 * Get the effect id of the item if there is one, otherwise null
 * @param {object} item
 * @return {number} The effect id of the item
 */
function getEffect (item) {
    if (item.attributes === undefined) {
        return null;
    }
    const attribute = item.attributes.find((attribute) => attribute.defindex == 134);
    if (attribute !== undefined) {
        return attribute.float_value;
    }
    return null;
}

/**
 * Converts inventory into an object that can easily be saved
 * @return {Object} Inventory details
 */
Inventory.prototype.toJSON = function () {
    const json = {};
    for (const key in this) {
        if (key === 'fetched' || key === 'steamid64' || key === 'schema') {
            continue;
        }

        if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
            json[key] = this[key];
        }
    }

    return json;
};

module.exports = Inventory;
