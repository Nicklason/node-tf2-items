'use strict';

const WebRequest = require('./webrequest');

const async = require('async');
const moment = require('moment');
const values = require('object.values');
const vdf = require('vdf');
const request = require('@nicklason/request-retry');

/**
 * Creates a new Schema instance
 * @param {object} [details] Schema details
 * @param {string} [details.language=English] Schema language
 * @param {number} [details.time] When the schema was last fetched
 * @param {object} [options] Options
 */
function Schema (details, options) {
    this.fetched = false;
    this.options = options;

    if (details === undefined) {
        this.language = 'English';
        this.time = -1;
    } else {
        for (const key in details) {
            if (details.hasOwnProperty(key)) {
                this[key] = details[key];
            }
        }
        this.fetched = true;
    }
}

/**
 * Fetch schema details
 * @param {string} apiKey Your Steam API key
 * @param {function} [callback] Function to call when done
 */
Schema.prototype.fetch = function (apiKey, callback) {
    const now = moment().unix();
    const shouldUpdate = now - (this.options.updateTime / 1000) < this.time;
    if (this.fetched && (this.options.updateTime == -1 || shouldUpdate)) {
        if (callback !== undefined) {
            callback(null, false);
        }
        return;
    }

    const self = this;
    async.parallel([
        function (callback) {
            self._fetchOverview(apiKey, callback);
        },
        function (callback) {
            self._fetchItems(apiKey, callback);
        },
        function (callback) {
            self._fetchSkins(callback);
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
    const json = {};
    for (const key in this) {
        if (key === 'options' || key === 'fetched') {
            continue;
        }

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

/**
 * Gets either the id, or name or a skin
 * @param {number|string} search id or name to search by
 * @return {string|number} Returns the id or name of the skin
 */
Schema.prototype.getSkin = function (search) {
    const isNumber = /^\d+$/.test(search);

    let found = null;
    for (let i = 0; i < this.skins.length; i++) {
        const effect = this.skins[i];

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
 * Get name of an item object
 * @param {object} item Item object
 * @param {boolean} [proper=false] Use proper name when true (adds "The" if proper_name in schema is true)
 * @param {number} item.defindex
 * @param {number} item.quality Quality id
 * @param {boolean} item.craftable
 * @param {boolean} [item.tradeable]
 * @param {number} item.killstreak 0=None, 1=Basic, 2=Specialized, 3=Professional
 * @param {number|null} item.effect Effect id
 * @param {boolean} item.australium
 * @param {number} item.wear
 * @return {string} Name of item
 */
Schema.prototype.getName = function (item, proper=true) {
    const schemaItem = this.getItem(item.defindex);
    if (schemaItem === null) {
        return null;
    }

    let name = '';
    if (item.tradeable == false || item.tradeable == 'false') {
        name = 'Non-Tradeable ';
    }
    if (item.craftable == false || item.craftable == 'false') {
        name += 'Non-Craftable ';
    }
    if (item.quality != 6 && item.quality != 15 && item.quality != 5) {
        name += this.getQuality(item.quality) + ' ';
    }
    if (item.quality == 5 && item.effect === null) {
        name += this.getQuality(item.quality) + ' ';
    } else if (schemaItem.item_quality == 5) {
        name += this.getQuality(schemaItem.item_quality) + ' ';
    }
    if (item.effect !== null) {
        name += this.getEffect(item.effect) + ' ';
    }
    if (item.killstreak > 0) {
        name += ['None', 'Killstreak', 'Specialized Killstreak', 'Professional Killstreak'][item.killstreak] + ' ';
    }
    if (item.australium == true || item.australium == 'true') {
        name += 'Australium ';
    }

    if (schemaItem.item_quality == 15 && schemaItem.hasOwnProperty('item_slot') && ['primary', 'secondary', 'melee'].indexOf(schemaItem.item_slot) !== -1) {
        const search = schemaItem.name.split('_')[2];

        for (let i = 0; i < this.skins.length; i++) {
            const skin = this.skins[i];

            const lowercase = skin.name.replace(/ /g, '').toLowerCase();
            if (lowercase === search) {
                name += skin.name + ' ';
                break;
            }
        }
    }

    if (proper === true && name === '' && schemaItem.proper_name == true) {
        name = 'The ';
    }

    name += schemaItem.item_name;

    if (item.wear !== undefined) {
        const wears = ['', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle Scarred'];

        name += ' (' + wears[item.wear] + ')';
    }

    return name;
};

/**
 * Function used internally to fetch the skins using the tf2 wiki
 * @param {function} callback Function to call when done
 */
Schema.prototype._fetchSkins = function (callback) {
    request({
        method: 'GET',
        url: 'https://wiki.teamfortress.com/w/images/4/43/Tf_proto_obj_defs_english.txt',
        gzip: true
    }, (err, response, body) => {
        if (err) {
            return callback(err);
        }

        const parsed = vdf.parse(body);

        // ?
        const protodefs = parsed['﻿"lang"'].Tokens;

        const skins = [];

        for (const protodef in protodefs) {
            if (!protodefs.hasOwnProperty(protodef)) {
                continue;
            }

            const parts = protodef.slice(0, protodef.indexOf(' ')).split('_');
            if (parts.length !== 3) {
                continue;
            }

            const type = parts[0];
            if (type !== '9') {
                continue;
            }

            const def = parts[1];
            const name = protodefs[protodef];

            if (name.startsWith(def + ':')) {
                continue;
            }

            skins.push({
                id: def,
                name: name
            });
        }

        this.skins = skins;

        return callback(null, skins);
    });
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

        for (const key in result) {
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
    this._fetchAllItems(apiKey, callback);
};

/**
 * Function used internally to fetch all schema items
 * @param {string} apiKey Your Steam API key
 * @param {number} [next=0] Used to paginate, tells Steam what part of the schema items you want
 * @param {array} [items=[]] List of items fetched from the schema
 * @param {function} callback Function to call when done
 */
Schema.prototype._fetchAllItems = function (apiKey, next, items, callback) {
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

        items = (items || []).concat(result.items);

        if (result.next !== undefined) {
            self._fetchAllItems(apiKey, result.next, items, callback);
        } else {
            self.items = items;
            callback(null, self.items);
        }
    });
};

module.exports = Schema;
