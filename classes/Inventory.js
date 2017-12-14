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

Inventory.prototype.getSummary = function() {
	var names = {};

	this.items.forEach((item) => {
		var name = this.getItemDisplayName(item);
		names[name] = (names[name] || 0) + 1;
	});

	return names;
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
	var attributes = this.getItemAttributes(item);
	item.attributes = attributes;

	var parsed = new Item(item);
	return parsed;
};

// We need a more sophisticated way of identifying items and getting the attributes, because this is bad in my oppinion.
Inventory.prototype.getItemAttributes = function(item) {
	if (!Array.isArray(item.attributes)) {
		// Item has no attributes.
		return {};
	}

	if (item.defindex == 20002 || item.defindex == 20003) {
		return this._getFabricatorValues(item);
	} else {
		return this._getAttributeValues(item);
	}
};

// I apologize for the mess... :/
Inventory.prototype._getFabricatorValues = function(item) {
	var attributes = {
		parts: []
	};

	for (var x = 0; x < item.attributes.length; x++) {
		var attribute = item.attributes[x];
		if (attribute.defindex == 2000 && attribute.is_output == false && attribute.match_all_attribs == true) {
			attributes.item = {
				quantity: attribute.quantity,
				quality: attribute.quality,
				killstreak: attribute.attributes[0].float_value
			};
		} else if (attribute.is_output == false) {
			attributes.parts.push({
				quanitity: attribute.quantity,
				defindex: attribute.itemdef,
				quality: attribute.quality
			});
		} else if (attribute.is_output == true) {
			attributes.reward = {
				quantity: attribute.quantity,
				quality: attribute.quality
			};
			for (var y = 0; y < attribute.attributes.length; y++) {
				var reward = attribute.attributes[y];
				if (reward.defindex == 2012) {
					attributes.reward.defindex = reward.float_value;
				} else if (reward.defindex == 2014) {
					attributes.reward.sheen = reward.float_value;
				} else if (reward.defindex == 2013) {
					attributes.reward.killstreaker = reward.float_value;
				}
			}
		}
	}

	return attributes;
};

Inventory.prototype._getAttributeValues = function(item) {
	var defindexes = {
		australium: 2027,
		killstreak: 2025,
		unusual_effect: 134
	};

	var attributes = {};

	for (var i = 0; i < item.attributes.length; i++) {
		var attribute = item.attributes[i];
		if (attribute.defindex == defindexes.killstreak) {
			attributes.killstreak = attribute.float_value;
		} else if (attribute.defindex == defindexes.australium) {
			attributes.australium = true;
		} else if (attribute.defindex == defindexes.unusual_effect) {
			attributes.effect = this.schema.getEffectWithId(attribute.float_value);
		}
	}

	return attributes;
};

Inventory.prototype.getItemDisplayName = function(item) {
	var name = "", schemaItem = this.schema.getItem(item.defindex);
	
	if (!item.tradeable) {
		name += "Non-Tradeable ";
	}
	if (!item.craftable) {
		name += "Non-Craftable ";
	}
	if (item.quality != 6 && item.quality != 15 && item.quality != 5) {
		name += this.schema.getQuality(item.quality) + " ";
	}
	if (item.isAustralium()) {
		name += "Australium ";
	}
	if (item.isKillstreak()) {
		name += EKillstreak[item.attributes.killstreak] + " ";
	}
	if (item.isUnusual()) {
		name += item.attributes.effect.name + " ";
	}
	// I am begging for forgiveness!
	if (item.attributes.hasOwnProperty("reward")) {
		var reward = this.schema.getItem(item.attributes.reward.defindex);
		name += (item.defindex == 20002 ? EKillstreak[2] : EKillstreak[3]) + " " + reward.name + " Kit Fabricator";
		return name;
		// But it works ¯\_ツ_/¯
	}
	if (name == "" && schemaItem.proper_name) {
		name += "The ";
	}

	name += schemaItem.name;
	return name;
};