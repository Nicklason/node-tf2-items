var tf2Items = require('../');

var tf2 = new tf2Items({
	apiKey: ''
});

tf2.init(function(err) {
	if (err) {
		// something went wrong getting the schema
	}
});

tf2.on('ready', function() {
	// init finished successfully, we are ready to go
});