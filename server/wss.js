
'use strict'

const webSocketServer = require('ws').Server; //ws服务
let wss = null;

const RoomSpace = 2;	//房间容量

let roomMap = {};

function Room(roomId) {
	this.roomId = roomId;	//房间号
	this.playerList = [null, null];
	this.join = function (playerName) {
		for (let i = 0; i < RoomSpace; i++) {
			if (this.playerList[i] == null) {
				this.playerList[i] = playerName;
				return i;
			}
			if (i == RoomSpace - 1) {
				return -1;
			}
		}
	};
	this.leave = function (idx) {
		this.playerList[idx] = null;

		//如果没人了，消除房间
		let have = false;
		this.playerList.forEach(v => {
			if (v != null) have = true;
		});
		if (!have) {
			delete roomMap[this.roomId];
			console.log('房间' + this.roomId + '解散');
		}
	};
	this.checkRoomMax = function () {
		let count = 0;
		for (let i = 0; i < this.playerList.length; i++) {
			if (this.playerList[i] != null) count++;
		}
		return count == RoomSpace;
	};
};



function hook(ws, _open, _message, _close, _error) {
	ws.on('open', _open);
	ws.on('message', _message);
	ws.on('close', _close);
	ws.on('error', _error);
};
(function start() {		//连接ws
	console.log('ws start');
	wss = new webSocketServer({ port: 3000 });
	wss.on('connection', (ws) => {
		console.log('client connected');
		//登陆返回clientId
		let clientId = Date.parse(new Date()) / 1000;
		//this.send('hello', clientId);
		hook(ws,
			onOpen.bind(ws),
			onMessage.bind(ws),
			onClose.bind(ws),
			onError.bind(ws));
	});
})();

//广播  
function broadcast(msg) {
	// console.log(ws);  
	wss.clients.forEach(function (client) {
		client.send(stringifyJson(msg));
	});
};

function broadcastToArr(arr, msg) {
	arr.forEach((client) => {
		client.send(stringifyJson(msg));
	})
};

//给某个客户端发消息
function send(msg) {
	let _msg = stringifyJson(msg)
	console.log('send:' + _msg);
	this.send(_msg);
}

//找到某个客户端
function findClient(roomId, playerIndex) {
	let client = null;
	wss.client.forEach(c => {
		if (c.roomId == roomId && playerIndex == playerIndex) {
			client = c;
		}
		break;
	})
};

function onOpen(event) {
	console.log('open');
};
function onMessage(event) {
	let self = this;
	let msg = parseJson(event);
	console.log(msg);
	if (msg && msg.f) {
		let m = msg.msg || {};
		switch (msg.f) {
			case 'createRoom':
				onCreateRoom.call(self, m);
				break;
			case 'roomList':
				//onRoomList.call(self, m);
				break;
			case 'joinRoom':
				onJoinRoom.call(self, m);
				break;
			default:
				break;
		}
	} else {
		console.log('bad package');
	}
};
function onClose(event) {
	console.log('onClose');
	//console.log(roomMap);

	let room = roomMap[this.roomId];
	if (room) {
		room.leave(this.playerIndex);
		console.log('leave', roomMap);
	}
};

function onError(event) {
	console.log('onError');
};

function onCreateRoom(msg) {
	console.log('onCreatRoom');
	let self = this;

	let playerName = msg[0];
	let roomId = msg[1];

	//查找是否有这个房间
	if (roomMap[roomId]) {
		let _msg = { f: 'roomError', msg: '该房间号已存在!' };
		send.call(this, _msg);
		return;
	}
	let room = new Room(roomId);
	roomMap[roomId] = room;

	let result = room.join(playerName);
	let _msg = {
		f: 'createRoom',
		msg: [room, result],
	};
	send.call(this, _msg);
	this.roomId = roomId;
	this.playerIndex = result;
};

function onJoinRoom(msg) {
	console.log('onJoinRoom');
	let playerName = msg[0];
	let roomId = msg[1];
	//查找是否有这个房间
	if (!roomMap[roomId]) {
		let _msg = { f: 'roomError', msg: '该房间不存在!' };
		send.call(this, _msg);
		return;
	}
	let room = roomMap[roomId];
	let result = room.join(playerName);
	let _msg = {
		f: 'joinRoom',
		msg: [room, result],
	};
	send.call(this, _msg);
	this.roomId = roomId;
	this.playerIndex = result;

	if (room.checkRoomMax()) {//开始对局
		let arr = [];
		wss.clients.forEach(client => {
			if (client.roomId == roomId) {
				arr.push(client);
			}
		});
		broadcastToArr(arr, { f: 'gameStart', msg: room });
	}
};

//申请房间列表
function onRoomList(msg) {
	console.log('onRoomList');
	let arr = Object.values(roomMap);
	let _msg = { f: 'roomList', msg: arr };
};

//字符串转json
function parseJson(s) {
	try {
		return JSON.parse(s);
	} catch (e) { }
};

//json转字符串
function stringifyJson(j) {
	try {
		return JSON.stringify(j);
	} catch (e) {
		console.log(e);
	}
};

//检测变量是否存在
function checkExist(obj) {
	return typeof obj != 'undefined';
};