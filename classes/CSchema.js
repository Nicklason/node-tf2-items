module.exports = CSchema;

var CWebRequest = require('./CWebRequest.js');

var EKillstreak = require('../resources/EKillstreak.js');

function CSchema() {}

CSchema.prototype.fetch = function(apiKey, language, callback) {
	if (typeof language == 'function') {
		callback = language;
		language = 'English';
	}

	var self = this;
	new CWebRequest('GET', 'GetSchema', 'v0001', { language: language, key: apiKey, format: 'vdf' }, function(err, body) {
		if (err) {
			callback(err);
			return;
		}

		var result = body.result;

		self.status = result.status;
		if (self.status == 1) {
			self.qualities = {};
			// Get all qualities with their 'proper' name and id paired.
			for (var quality in result.qualities) {
				var id = result.qualities[quality];
				var name = result.qualityNames[quality];
				self.qualities[name] = id;
			}
			self.items = result.items;
			self.origins = result.originNames;
			self.effects = result.attribute_controlled_attached_particles;
			self.attributes = result.attributes;
		}

		callback(null, self.status == 1);
	});
};

CSchema.prototype.getItem = function(defindex) {
	for (var i in this.items) {
		var item = this.items[i];
		if (item.defindex == defindex) {
			return {
				name: item.name,
				item_name: item.item_name,
				proper_name: item.proper_name == 1 || item.proper_name == true ? true : false,
				item_class: item.item_class,
				item_type_name: item.item_type_name,
				image: (item.image_url_large || item.image_url).replace('http://media.steampowered.com/apps/440/icons/', ''),
				attributes: item.attributes || []
			};
		}
	}
	return null;
};

CSchema.prototype.getQuality = function(search) {
	// Check if we are searching with a name or id and return the opposite if found.
	var isID = isNaN(parseInt(search)) == false;
	if (isID) {
		for (var quality in this.qualities) {
			if (this.qualities[quality] == search) {
				return quality;
			}
		}
	} else if (this.qualities.hasOwnProperty(search)) {
		return this.qualities[search];
	}

	return null;
};

CSchema.prototype.getEffectWithId = function(id) {
	for (var i in this.effects) {
		if (this.effects[i].id == id) {
			return this.effects[i];
		}
	}
	return null;
};

CSchema.prototype.getEffectId = function(effect) {
	for (var i in this.effects) {
		if (this.effects[i].name == effect) {
			return this.effects[i].id;
		}
	}
	return null;
};

CSchema.prototype.getDisplayName = function(item) {
	var name = '', schema = this.getItem(item.defindex);
	
	if (item.hasOwnProperty('tradeable') && item.tradeable == false) {
		name += 'Non-Tradeable ';
	}
	if (item.craftable == false) {
		name += 'Non-Craftable ';
	}
	if (item.quality != 6 && item.quality != 15 && item.quality != 5) {
		name += this.getQuality(item.quality) + ' ';
	} else if (item.quality == 5 && !item.hasOwnProperty('effect')) {
		// Add unusual to the name if item is unusual without effect.
		name += this.getQuality(item.quality) + ' ';
	}

	if (item.killstreak > 0) {
		name += EKillstreak[item.killstreak] + ' ';
	}
	if (item.quality == 5 && item.hasOwnProperty('effect')) {
		name += this.getEffectWithId(item.effect).name + ' ';
	}
	if (item.australium == true) {
		name += 'Australium ';
	}
	if (name == '' && schema.proper_name) {
		name += 'The ';
	}

	name += schema.item_name;
	return name;
};