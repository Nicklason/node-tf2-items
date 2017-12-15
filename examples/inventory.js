var tf2Items = require("../index.js");

var tf2 = new tf2Items({
	apiKey: "E8117DA7F89C16F0E70D3B171090CB92"
});

tf2.init();

tf2.on("ready", function() {
	tf2.getInventory("76561198120070906", function(err, inventory) {
		if (err) {
			return;
		}

		var summary = inventory.getSummary();
		console.log(summary);
	});
});