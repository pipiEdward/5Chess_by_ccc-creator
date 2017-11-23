cc.Class({
    extends: require('NetComponent'),
    properties: {
        firstNode: cc.Node,
        secondNode: cc.Node,

        nameBox: cc.EditBox,
        roomIdBox: cc.EditBox,
    },
    onLoad() {
        this._super();
        this.firstNode.active = true;
        this.secondNode.active = false;
    },
    robortGame() {
        GameModule = Module.Robort;
        cc.director.loadScene('Game');
    },
    onLineGame() {
        GameModule = Module.Humen;
        this.firstNode.active = false;
        this.secondNode.active = true;
        Network.initNetwork();
    },

    backFirst() {
        this.firstNode.active = true;
        this.secondNode.active = false;
        Network.close();
    },

    creatRoom() {
        if (this._checkString()) {
            Network.send({ f: 'createRoom', msg: [this.nameBox.string, this.roomIdBox.string] });
        }
    },

    joinRoom() {
        if (this._checkString()) {
            Network.send({ f: 'joinRoom', msg: [this.nameBox.string, this.roomIdBox.string] });
        }
    },
    _checkString() {
        if (this.nameBox.string == '') {
            alert('请输入昵称');
            return false;
        }
        if (this.roomIdBox.string == '') {
            alert('请输入房间号');
            return false;
        }
        return true;
    },
    netStart(event) {
        cc.log('连接成功');
    },
    getNetData(event) {
        cc.log('Menu Get');
        let data = event.detail;
        if (data && data.f) {
            let msg = data.msg || {};
            switch (data.f) {
                case 'createRoom':
                    this.onCreateRoom(msg);
                    break;
                case 'joinRoom':
                    this.onJoin(msg);
                    break;
                case 'roomError':
                    alert(msg);
                    break;
            }
        }
    },


    onCreateRoom(msg) {
        let room = msg[0];
        let result = msg[1];
        RoomId = room.roomId;
        MyResult = result == 0 ? 'white' : 'black';
        MyName = room.playerList[result];
        cc.director.loadScene('Game');
    },
    onJoin(msg) {
        let room = msg[0];
        let result = msg[1];
        RoomId = room.roomId;
        MyResult = result == 0 ? 'white' : 'black';
        MyName = room.playerList[result];
        cc.director.loadScene('Game');
    },

});
