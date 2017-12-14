module.exports = Item;

function Item(item) {
	this.id = item.id;
	this.original_id = item.original_id;
	this.defindex = item.defindex;
	this.level = item.level;
	this.quality = item.quality;
	this.quantity = item.quantity;
	this.origin = item.origin;
	this.tradeable = !item.flag_cannot_trade;
	this.craftable = item.hasOwnProperty("flag_cannot_craft") ? false : true;
	this.attributes = item.attributes;
}

Item.prototype.isKillstreak = function() {
	return this.attributes.hasOwnProperty("killstreak") && this.attributes.killstreak != 0;
};

Item.prototype.isAustralium = function() {
	return this.attributes.hasOwnProperty("australium") && this.attributes.australium == true;
};

Item.prototype.isUnusual = function() {
	return this.quality == 5;
};

Item.prototype.getImageUrl = function() {
	if (this.schema !== null) {
		return "http://media.steampowered.com/apps/440/icons/" + this.schema.image;
	}
	return null;
};