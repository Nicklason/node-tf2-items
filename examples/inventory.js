var tf2Items = require("tf2-items");

var tf2 = new tf2Items({
	apiKey: ""
});

tf2.init();

tf2.on("ready", function() {
	tf2.getInventory("76561198120070906", function(err, inventory) {
		if (err) {
			return;
		}

		var names = [];
		// Get display name and add to array
		inventory.items.forEach(function(item) {
			var name = inventory.getItemDisplayName(item);
			names.push(name);
		});

		// Alphabetic sort A -> Z
		names.sort(function(a, b) {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});

		console.log(names);
	});
});