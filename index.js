'use strict';

var state = {};

process.on('message', (msg, server) => {
	if(msg === 'server') {
		state.server = server;
		
		if(state.callback)
			state.callback(server);
	}
});

exports = function(callback) {
	if(state.server)
		callback(state.server);
	else
		state.callback = callback;
};
