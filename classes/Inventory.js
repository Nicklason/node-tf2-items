module.exports = Inventory;

var WebRequest = require('./WebRequest.js');
var Item = require('./Item.js');

var EKillstreak = require('../resources/EKillstreak.js');

function Inventory(steamid64, schema) {
	this.schema = schema;
	this.steamid64 = steamid64;
}

Inventory.prototype.fetch = function(apiKey, callback) {
	var self = this;
	new WebRequest("GET", "GetPlayerItems", "v0001", { steamid: self.steamid64, key: apiKey }, function(err, body) {
		if (err) {
			callback(err);
			return;
		}

		var result = body.result;
		self.status = result.status;

		self._parse(result);

		callback(null, self.status == 1);
	});
};

Inventory.prototype._parse = function(result) {
	if (this.status == 15) {
		this.isPrivate = true;
	} else if (this.status == 1) {
		this.maxItems = result.num_backpack_slots;
		this._parseItems(result.items);
	}
};

Inventory.prototype.isPrivate = function() {
	return this.status == 15;
};

Inventory.prototype._parseItems = function(items) {
	var parsed = [];
	for (var i = 0; i < items.length; i++) {
		var item = this._parseItem(items[i]);
		parsed.push(item);
	}
	this.items = parsed;
};

Inventory.prototype._parseItem = function(item) {
	var attributes = this.getItemAttributes(item.attributes);
	item.attributes = attributes;

	var parsed = new Item(item);
	return parsed;
};

Inventory.prototype.getItemAttributes = function(attributes) {
	if (!Array.isArray(attributes)) {
		// Item has no attributes.
		return {};
	}

	var australium = 2027,
		killstreak = 2025,
		unusualEffect = 134;

	var attribs = {};
	for (var i = 0; i < attributes.length; i++) {
		if (attributes[i].defindex == killstreak) {
			attribs.killstreak = attributes[i].float_value;
		} else if (attributes[i].defindex == australium) {
			attribs.australium = true;
		} else if (attributes[i].defindex == unusualEffect) {
			attribs.effect = this.schema.getEffectWithId(attributes[i].float_value);
		}
	}
	return attribs;
};

Inventory.prototype.getItemDisplayName = function(item) {
	var name = "", schemaItem = this.schema.getItem(item.defindex);
	
	if (!item.tradeable) {
		name = "Non-Tradeable ";
	}
	if (!item.craftable) {
		name = "Non-Craftable ";
	}
	var qualityName = this.schema.getQuality(item.quality);
	if (qualityName != "Unique" && qualityName != "Decorated Weapon" && qualityName != "Unusual") {
		name += qualityName + " ";
	}
	if (item.isAustralium()) {
		name += "Australium ";
	}
	if (item.isKillstreak()) {
		name += EKillstreak[item.attributes.killstreak];
	}
	if (item.isUnusual()) {
		name += item.attributes.effect.name + " ";
	}
	if (name == "" && schemaItem.proper_name) {
		name = "The ";
	}

	name += schemaItem.name;
	return name;
};