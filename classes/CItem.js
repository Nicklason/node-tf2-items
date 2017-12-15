module.exports = CItem;

function CItem(item) {
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
	this.killstreak = this.isKillstreak();
	this.australium = this.isAustralium();

	if (this.attributes.hasOwnProperty("effect")) {
		this.effect = this.attributes.effect;
	}
}

CItem.prototype.isKillstreak = function() {
	return this.attributes.hasOwnProperty("killstreak") ? this.attributes.killstreak : 0;
};

CItem.prototype.isAustralium = function() {
	return this.attributes.hasOwnProperty("australium") && this.attributes.australium == true;
};