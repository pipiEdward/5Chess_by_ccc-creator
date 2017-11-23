cc.Class({
    extends: require('NetComponent'),

    properties: {
        chessPrefab: {//棋子的预制资源
            default: null,
            type: cc.Prefab
        },
        boardNode: cc.Node,

        orderNode: cc.Node,

        chessList: {//棋子节点的集合，用一维数组表示二维位置
            default: [],
            type: [cc.Node],
            visible: false
        },
        namelb1: cc.Label,
        namelb2: cc.Label,

        roomIdLb: cc.Label,

        whiteSpriteFrame: cc.SpriteFrame,
        blackSpriteFrame: cc.SpriteFrame,
        gameState: 'white',
        myName: '我',
        enemyName: '',

        resultLb: cc.Label,
        resultNode: cc.Node,

        isRobort: false,

        fiveGroup: [],//五元组

        fiveGroupScore: []//五元组分数
    },

    // use this for initialization
    onLoad: function () {
        this._super();
        this.resultNode.active = false;
        this.orderNode.active = false;

        this.initBorad();
        this.initGroup();

        if (GameModule == Module.Robort) {//机器人
            this.enemyName = '机器人';
            this.isRobort = true;
            this.roomIdLb.node.active = false;
            this.showChooceOrder();
        } else {
            this.isRobort = false;
            this.roomIdLb.node.active = true;
            this.roomIdLb.string = '房间号：' + RoomId;
            this.myName = MyName;
        }

        this.namelb1.string = this.myName;
        this.namelb2.string = this.enemyName;
    },

    getNetData(event) {
        cc.log('Game Get');
        let data = event.detail;
        if (data && data.f) {
            let msg = data.msg || {};
            switch (data.f) {
                case 'roomError':
                    alert(msg);
                    break;
                case 'gameStart':
                    this.onGameStart(msg);
                    break;
            }
        }
    },

    onGameStart(msg) {
        let enemyName = msg.playerList[MyResult == 0 ? 1 : 0];
        this.enemyName = enemyName;
        this.namelb2.string = this.enemyName;
        this.myState = MyResult;
        this.enemyState = MyResult == 'white' ? 'black' : 'white';
        this.gameState = 'white';
    },

    checkWhoFirst() {
        if (this.myState == 'white') {
        } else {//电脑先行
            //开局白棋（电脑）在棋盘中央下一子
            this.downChess(this.chessList[112], 'white');
        }
    },

    //换边
    turnPlace() {
        this.gameState = this.gameState == 'white' ? 'black' : 'white';
        if (this.gameState == this.myState) {
            this.namelb1.string = this.myName + '(思考中)';
            this.namelb2.string = this.enemyName;
        } else {
            this.namelb1.string = this.myName;
            this.namelb2.string = this.enemyName + '(思考中)';
            if (this.isRobort) {
                this.node.runAction(cc.sequence(cc.delayTime(0.5), cc.callFunc(data => {
                    this.ai();
                })));
            }
        }
    },

    //显示先行后行
    showChooceOrder() {
        this.orderNode.active = true;
    },
    goFirst() {
        this.myState = 'white';
        this.enemyState = 'black';
        this.orderNode.active = false;
    },
    goLast() {
        this.myState = 'black';
        this.enemyState = 'white';
        this.orderNode.active = false;
    },

    //显示胜利失败
    showResult(result) {
        this.resultNode.active = true;
        this.resultLb.string = result == this.myState ? '胜利！' : '失败！';
    },

    //初始化棋盘
    initBorad() {
        let self = this;
        //初始化棋盘上225个棋子节点，并为每个节点添加事件
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                let newNode = cc.instantiate(this.chessPrefab);//复制Chess预制资源
                this.boardNode.addChild(newNode);
                newNode.x = x * 40 + 20;
                newNode.y = y * 40 + 20;
                newNode.tag = y * 15 + x;//根据每个节点的tag就可以算出其二维坐标
                newNode.getComponent(cc.Sprite).spriteFrame = null;
                newNode.on('touchend', event => {
                    let target = event.currentTarget;
                    if (self.gameState === self.myState && target.getComponent(cc.Sprite).spriteFrame === null) {//我的回合并且是空位
                        self.downChess(target, self.gameState);
                    }
                });
                self.chessList.push(newNode);//加入数组
            }
        }
    },

    //初始化五元组
    initGroup() {
        //横向
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 11; x++) {
                this.fiveGroup.push([y * 15 + x, y * 15 + x + 1, y * 15 + x + 2, y * 15 + x + 3, y * 15 + x + 4]);
            }
        }
        //纵向
        for (let x = 0; x < 15; x++) {
            for (let y = 0; y < 11; y++) {
                this.fiveGroup.push([y * 15 + x, (y + 1) * 15 + x, (y + 2) * 15 + x, (y + 3) * 15 + x, (y + 4) * 15 + x]);
            }
        }
        //右上斜向
        for (let b = -10; b <= 10; b++) {
            for (let x = 0; x < 11; x++) {
                if (b + x < 0 || b + x > 10) {//边界判断
                    continue;
                } else {
                    this.fiveGroup.push([(b + x) * 15 + x, (b + x + 1) * 15 + x + 1, (b + x + 2) * 15 + x + 2, (b + x + 3) * 15 + x + 3, (b + x + 4) * 15 + x + 4]);
                }
            }
        }
        //右下斜向
        for (let b = 4; b <= 24; b++) {
            for (let y = 0; y < 11; y++) {
                if (b - y < 4 || b - y > 14) {//边界判断
                    continue;
                } else {
                    this.fiveGroup.push([y * 15 + b - y, (y + 1) * 15 + b - y - 1, (y + 2) * 15 + b - y - 2, (y + 3) * 15 + b - y - 3, (y + 4) * 15 + b - y - 4]);
                }
            }
        }
    },

    //电脑下棋简易逻辑
    ai() {
        //评分
        for (let i = 0; i < this.fiveGroup.length; i++) {
            let b = 0;//五元组里黑棋的个数
            let w = 0;//五元组里白棋的个数
            for (let j = 0; j < 5; j++) {
                if (this.chessList[this.fiveGroup[i][j]].getComponent(cc.Sprite).spriteFrame == this.blackSpriteFrame) {
                    b++;
                } else if (this.chessList[this.fiveGroup[i][j]].getComponent(cc.Sprite).spriteFrame == this.whiteSpriteFrame) {
                    w++;
                }
            }
            if (b + w == 0) {
                this.fiveGroupScore[i] = 7;
            } else if (b > 0 && w > 0) {
                this.fiveGroupScore[i] = 0;
            } else if (b == 0 && w == 1) {
                this.fiveGroupScore[i] = 35;
            } else if (b == 0 && w == 2) {
                this.fiveGroupScore[i] = 800;
            } else if (b == 0 && w == 3) {
                this.fiveGroupScore[i] = 15000;
            } else if (b == 0 && w == 4) {
                this.fiveGroupScore[i] = 800000;
            } else if (w == 0 && b == 1) {
                this.fiveGroupScore[i] = 15;
            } else if (w == 0 && b == 2) {
                this.fiveGroupScore[i] = 400;
            } else if (w == 0 && b == 3) {
                this.fiveGroupScore[i] = 1800;
            } else if (w == 0 && b == 4) {
                this.fiveGroupScore[i] = 100000;
            }
        }
        //找最高分的五元组
        let hScore = 0;
        let mPosition = 0;
        for (let i = 0; i < this.fiveGroupScore.length; i++) {
            if (this.fiveGroupScore[i] > hScore) {
                hScore = this.fiveGroupScore[i];
                mPosition = (function (x) {//js闭包
                    return x;
                })(i);
            }
        }
        //在最高分的五元组里找到最优下子位置
        let flag1 = false;//无子
        let flag2 = false;//有子
        let nPosition = 0;
        for (let i = 0; i < 5; i++) {
            if (!flag1 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame == null) {
                nPosition = (function (x) { return x })(i);
            }
            if (!flag2 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame != null) {
                flag1 = true;
                flag2 = true;
            }
            if (flag2 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame == null) {
                nPosition = (function (x) { return x })(i);
                break;
            }
        }
        //在最最优位置下子
        this.downChess(this.chessList[this.fiveGroup[mPosition][nPosition]], this.enemyState);
    },

    //检测落子
    judgeResult() {
        let x0 = this.touchChess.tag % 15;
        let y0 = parseInt(this.touchChess.tag / 15);
        //判断横向
        let fiveCount = 0;
        for (let x = 0; x < 15; x++) {
            if ((this.chessList[y0 * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === this.myState) {
                        return this.myState;
                    }
                    return this.enemyState;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断纵向
        fiveCount = 0;
        for (let y = 0; y < 15; y++) {
            if ((this.chessList[y * 15 + x0].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === this.myState) {
                        return this.myState;
                    }
                    return this.enemyState;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断右上斜向
        let f = y0 - x0;
        fiveCount = 0;
        for (let x = 0; x < 15; x++) {
            if (f + x < 0 || f + x > 14) {
                continue;
            }
            if ((this.chessList[(f + x) * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === this.myState) {
                        return this.myState;
                    }
                    return this.enemyState;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断右下斜向
        f = y0 + x0;
        fiveCount = 0;
        for (let x = 0; x < 15; x++) {
            if (f - x < 0 || f - x > 14) {
                continue;
            }
            if ((this.chessList[(f - x) * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === this.myState) {
                        return this.myState;
                    }
                    return this.enemyState;
                }
            } else {
                fiveCount = 0;
            }
        }
        //没有输赢
        return false;
    },

    //落子
    downChess(node, color) {
        this.touchChess = node;
        let spframe = this.getSpFrameByState(color);
        node.getComponent(cc.Sprite).spriteFrame = spframe;

        //检测结果
        let result = this.judgeResult();
        if (!result) {
            this.node.runAction(cc.sequence(cc.delayTime(0.5), cc.callFunc(data => {
                this.turnPlace();
            })));
        } else {
            this.showResult(result);
        }
    },

    getSpFrameByState(state) {
        return state == 'black' ? this.blackSpriteFrame : this.whiteSpriteFrame;
    },





    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
