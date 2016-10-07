'use strict';

const net = require('net');
const process = require('process');

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
	
	if(state.options.port) {
		var server = net.createServer({allowHalfOpen: true});
		server.listen(state.options.port, () => {callback(server);});
	} else {
		if(state.server)
			callback(state.server);
		else
			state.callback = callback;
	}
};
