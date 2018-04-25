var tf2Items = require('../');

var tf2 = new tf2Items({
	apiKey: ''
});

tf2.init();

tf2.on('ready', function() {
	tf2.getInventory('76561198120070906', function(err, inventory) {
		if (err) {
			return;
		}

		var summary = inventory.getSummary();
		console.log(summary);
	});
});