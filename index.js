'use strict';

var state = {};

process.on('SIGINT', () => {
	var timeout = state.timeout ? state.timeout : 10000;
	
	if(state.server) {
		state.server.close(() => {
			process.exit();
		});
		
		setTimeout(() => {
			process.exit(1);
		}, timeout);
	} else
		process.exit();
});

process.on('message', (msg, server) => {
	if(msg === 'server') {
		state.server = server;
		
		if(state.callback)
			state.callback(server);
	}
});

module.exports = function(callback, options) {
	state.options = options || {};
	
	if(state.server)
		callback(state.server);
	else
		state.callback = callback;
};
