#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');

const net = require('net');
const process = require('process');
const childProcess = require('child_process');

const optionDefinitions = [
	{ name: 'port', alias: 'p', type: Number, defaultValue: 8080 },
	{ name: 'uid', type: String },
	{ name: 'gid', type: String },
	{ name: 'cwd', type: String, group: 'child' },
	{ name: 'module', type: String, multiple: true, defaultOption: true }
];

const options = commandLineArgs(optionDefinitions);
const mod = options._all.module[0];
const args = options._all.module.slice(1);
const port = options._all.port;

let child;
let restarting = false;

const server = net.createServer({allowHalfOpen: true});

function startChild() {
	restarting = false;
	
	child = childProcess.fork(mod, args, options.child);
	console.log('Child process started.');
	
	child.send('server', server);
	
	child.on('exit', (code, signal) => {
		console.log('Child process exited, code:', code);
		
		if(restarting)
			startChild();
		else
			process.exit(code);
	});
}

process.on('SIGHUP', () => {
	if(child) {
		restarting = true;
		console.log('Child process restart requested.');
		child.kill('SIGINT');
	}
});

process.on('SIGTERM', () => {
	if(child) {
		restarting = false;
		child.kill('SIGTERM');
	} else {
		process.exit();
	}
});

server.listen(port, () => {
	if(options._all.gid) process.setgid(options._all.gid);
	if(options._all.uid) process.setuid(options._all.uid); 
	startChild();
});
