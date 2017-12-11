var TF2Items = require('../index.js');

var tf2 = new TF2Items({
	apiKey: ""
});

tf2.init(function(err) {
	if (err) {
		console.log(err);
	}
});

tf2.on("ready", function() {
	tf2.getInventory("76561198120070906", function(err, inventory) {
		if (err) {
			console.log(err);
			return;
		}
		for (var i = 0; i < inventory.items.length; i++) {
			console.log(inventory.getItemDisplayName(inventory.items[i]));
		}
	});
});