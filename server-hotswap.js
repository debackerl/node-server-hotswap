'use strict';

const commandLineArgs = require('command-line-args');
const userid = require('userid');

const net = require('net');
const process = require('process');
const childProcess = require('child_process');

const optionDefinitions = [
	{ name: 'port', alias: 'p', type: Number, defaultValue: 8080 },
	{ name: 'uid', type: String, group: 'child' },
	{ name: 'gid', type: String, group: 'child' },
	{ name: 'cwd', type: String, group: 'child' },
	{ name: 'module', type: String, multiple: true, defaultOption: true }
];

const options = commandLineArgs(optionDefinitions);
const mod = options._all.module[0];
const args = options._all.module.slice(1);
const port = options._all.port;

if(options.child.uid && !Number.isInteger(options.child.uid))
	options.child.uid = userid.uid(options.child.uid);

if(options.child.gid && !Number.isInteger(options.child.gid))
	options.child.gid = userid.gid(options.child.gid);

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
	restarting = true;
	console.log('Child process restart requested.');
	child.kill('SIGINT');
});

server.listen(port, startChild);
