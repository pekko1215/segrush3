var reelControl = null;

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/test.smr');
xhr.responseType = 'arraybuffer';
controlData = {};
xhr.onload = function() {
    var uUint8array = new Uint8Array(this.response)
    var data_view = new DataView(uUint8array.buffer);
    console.log(data_view)
    window.data = data_view

    var c = controlData;
    data_view.lpeek()
    c.controlCount = data_view.lpeek();
    data_view.peek()
    c.reelLength = data_view.peek();
    c.yakuCount = data_view.peek();
    c.maxLine = data_view.peek();
    // return
    var size = c.reelLength * 3
    c.reelArray = []
    for (var i = 0; i < 3; i++) {
        c.reelArray[i] = []
        for (var j = 0; j < c.reelLength; j++) {
            c.reelArray[i][j] = data_view.peek()
        }
    }

    c.yakuList = Array(c.yakuCount)

    for (var i = 0; i < c.yakuCount; i++) {
        c.yakuList[i] = data_view.wpeek()
        for (var j = 0; j < 3; j++) {
            if ((c.yakuList[i] >> j * 4 & 0x0F) == 0x0F) {
                c.yakuList[i] += (0xF0000 << j * 4)
            }
        }
    }

    c.betLine = Array(c.maxLine)

    for (var i = 0; i < c.maxLine; i++) {
        c.betLine[i] = []
        for (var j = 0; j < 4; j++) {
            c.betLine[i][j] = data_view.peek()
        }
    }

    c.slideTableSize = data_view.wpeek();
    c.slideTable = Array(c.slideTableSize * c.reelLength).fill(0).map(() => {
        return data_view.peek();
    });

    c.tableNum1 = Array(c.controlCount * 3 * 2).fill(0).map(() => {
        return data_view.peek();
    })

    c.tableNum2 = Array(c.controlCount * 6 * c.reelLength * 2).fill(0).map(() => {
        return data_view.peek()
    })

    c.tableNum3 = Array(c.controlCount * 6 * c.reelLength * c.reelLength * 2).fill(0).map(() => {
        return data_view.peek()
    })

    reelControl = new reelControlData(controlData)
    window.slotmodule = new SlotModuleMk2();
    $(main)

}
xhr.send();

function main() {
    window.scrollTo(0, 0);

    var notplaypaysound = false;

    slotmodule.on("resourceLoaded", function(e) {
        console.log(e)
    })

    slotmodule.on("allreelstop", function(e) {
        if (e.hits != 0) {
            if (e.hityaku.length == 0)
                return
            var targetYaku = e.hityaku[0]
            e.hityaku.forEach((y) => {
                var idx = YakuData.findIndex((d) => {
                    return d.name === y.name;
                })
                var tidx = YakuData.findIndex((d) => {
                    return d.name === targetYaku.name;
                })
                if (tidx < idx) {
                    targetYaku = y;
                }
            })
            var matrix = targetYaku.matrix;
            var count = 0;
            slotmodule.once("bet", function() {
                slotmodule.clearFlashReservation()
                segments.payseg.reset();
            })
            if (e.hityaku[0].name.indexOf("Dummy") != -1 || e.hityaku[0].name.indexOf("1枚役") != -1) {
                notplaypaysound = true;
            } else {
                notplaypaysound = false;
                slotmodule.setFlash(null, 0, function(e) {
                    slotmodule.setFlash(flashdata.default, 20)
                    slotmodule.setFlash(replaceMatrix(flashdata.default, matrix, colordata.LINE_F, null), 20, arguments.callee)
                })
            }
        }

        replayflag = false;
        var nexter = true;

        e.hityaku.forEach(function(d) {
            switch (gamemode) {
                case 'normal':
                    switch (d.name) {
                        case "REG":
                            setGamemode('reg');
                            sounder.stopSound("bgm");

                            nexter = true;
                            slotmodule.once("payend", function() {
                                sounder.playSound("jac3", true);
                                e.stopend()
                            })
                            bonusdata = {
                                jacincount: 0,
                                jacgamecount: 12,
                                jacgetcount: 8
                            }
                            changeBonusSeg();
                            bonusflag = "none";
                            clearLamp()
                            break;
                        case "リプレイ":
                            replayflag = true;
                            break;
                    }

                    break;
                case 'big':
                    if (d.name == "リプレイ") {
                        setGamemode('jac');
                        sounder.stopSound("bgm");
                        sounder.playSound("jac" + (4 - bonusdata.jacincount), true);
                        bonusdata.jacincount--;
                        bonusdata.jacgamecount = 8;
                        bonusdata.jacgetcount = 8;
                    }
                    changeBonusSeg()
                    break;
                case 'reg':
                case 'jac':
                    changeBonusSeg()
                    bonusdata.jacgetcount--;
            }
        })


        if (nexter) {
            e.stopend()
        }
    })

    slotmodule.on("leveron", function() {
        if (gamemode == "big") {
            bonusdata.bonusgamecount--;
        }

        if (gamemode == "reg" || gamemode == "jac") {
            bonusdata.jacgamecount--;
        }
    })

    slotmodule.on("payend", function() {

        if (gamemode == "big" && bonusdata.bonusgamecount == 0) {
            setGamemode('normal');
            sounder.stopSound("bgm")
            segments.effectseg.reset();
        }

        if (gamemode == "reg" || gamemode == "jac") {
            if (bonusdata.jacgamecount == 0 || bonusdata.jacgetcount == 0) {
                if (bonusdata.jacincount == 0) {
                    setGamemode('normal');
                    sounder.stopSound("bgm")
                    slotmodule.setLotMode(0)
                    segments.effectseg.reset();
                } else {
                    sounder.stopSound("bgm")
                    setGamemode('big');
                    sounder.playSound("big1", true);
                    slotmodule.setLotMode(1)
                    segments.effectseg.reset();
                }
            }
        }
    })
    slotmodule.on("leveron", function() {

    })

    slotmodule.on("bet", function(e) {
        sounder.playSound("3bet")
        if ("coin" in e) {
            (function(e) {
                var thisf = arguments.callee;
                if (e.coin > 0) {
                    coin--;
                    e.coin--;
                    incoin++;
                    changeCredit(-1);
                    setTimeout(function() {
                        thisf(e)
                    }, 30)
                } else {
                    e.betend();
                }
            })(e)
        }
    })

    slotmodule.on("pay", function(e) {
        var pays = e.hityaku.pay;
        var arg = arguments;
        if (gamemode != "normal") {
            changeBonusSeg();
        }
        if (!("paycount" in e)) {
            e.paycount = 0
            replayflag || notplaypaysound || (pays > 1 && !isAT && sounder.playSound("pay", true));
            replayflag || notplaypaysound || (pays > 1 && isAT && sounder.playSound("pay2"));
        }
        if (pays == 0) {
            if (replayflag) {
                sounder.playSound("replay", false, function() {
                    e.replay();
                    slotmodule.emit("bet", e.playingStatus);
                });
            } else {
                e.payend()
                sounder.stopSound("pay")
                if (e.isPay && !isAT) { sounder.playSound("pay") }
            }
        } else {
            e.isPay = true
            e.hityaku.pay--;
            coin++;
            e.paycount++;
            outcoin++;
            if (gamemode != "normal") {
                bonusdata.geted++;
            }
            changeCredit(1);
            segments.payseg.setSegments(e.paycount);
            !isAT && sounder.stopSound('pay')
            replayflag || notplaypaysound || (!isAT && sounder.playSound("pay", true))
            setTimeout(function() {
                arg.callee(e)
            }, 70)
        }
    })
    slotmodule.on("lot", function(e) {
        var ret = -1;
        switch (gamemode) {
            case "normal":
                var lot = normalLotter.lot().name

                lot = window.power || lot;
                window.power = undefined
                lot = lot || "ベル"
                switch (lot) {
                    case "リプレイ":
                        ret = lot
                        break;
                    case "ベル":
                        if (rand(8) == 0) {
                            ret = "押し順ベル" + (rand(2) + 1)
                        } else {
                            ret = "押し順ベル" + (rand(4) + 3)
                        }
                        if (rand(32) == 0) {
                            ret = "共通ベル"
                        }
                        if (rand(128) == 0) {
                            ret = "チャンス目" + "ABC" [rand(3)]
                        }
                        break;
                        break;
                    case "REG":
                        bonusflag = "REG"
                        ret = bonusflag;
                        if (rand(2)) {
                            ret = "リーチ目"
                        }
                        break;
                    default:
                        ret = "はずれ"
                        if (bonusflag != "none") {
                            ret = bonusflag;
                        }
                }
                break;
            case "reg":
            case "jac":
                ret = "JACGAME"
                break;
        }
        ret = effect(ret) || ret;
        return ret;
    })

    slotmodule.on("reelstop", function() {
        isAT ? sounder.playSound("stop2") : sounder.playSound("stop")
    })

    $("#saveimg").click(function() {
        SaveDataToImage();
    })

    $("#cleardata").click(function() {
        if (confirm("データをリセットします。よろしいですか？")) {
            ClearData();
        }
    })

    $("#loadimg").click(function() {
        $("#dummyfiler").click();
    })

    $("#dummyfiler").change(function(e) {

        var file = this.files[0];

        var image = new Image();
        var reader = new FileReader();
        reader.onload = function(evt) {
            image.onload = function() {
                var canvas = $("<canvas></canvas>")
                canvas[0].width = image.width;
                canvas[0].height = image.height;
                var ctx = canvas[0].getContext('2d');
                ctx.drawImage(image, 0, 0)
                var imageData = ctx.getImageData(0, 0, canvas[0].width, canvas[0].height)
                var loadeddata = SlotCodeOutputer.load(imageData.data);
                if (loadeddata) {
                    parseSaveData(loadeddata)
                    alert("読み込みに成功しました")
                } else {
                    alert("データファイルの読み取りに失敗しました")
                }
            }
            image.src = evt.target.result;
        }
        reader.onerror = function(e) {
            alert("error " + e.target.error.code + " \n\niPhone iOS8 Permissions Error.");
        }
        reader.readAsDataURL(file)
    })

    slotmodule.on("reelstart", function() {
        if (okure) {
            setTimeout(function() {
                sounder.playSound("start")
            }, 100)
        } else {
            sounder.playSound("start")
        }
        okure = false;
    })
    var okure = false;
    var sounder = new Sounder();

    sounder.addFile("sound/stop.wav", "stop").addTag("se");
    sounder.addFile("sound/stop2.wav", "stop2").addTag("se");
    sounder.addFile("sound/start.wav", "start").addTag("se");
    sounder.addFile("sound/bet.wav", "3bet").addTag("se");
    sounder.addFile("sound/pay.wav", "pay").addTag("se");
    sounder.addFile("sound/pay2.wav", "pay2").addTag("se");
    sounder.addFile("sound/replay.wav", "replay").addTag("se");
    sounder.addFile("sound/at1.wav", "at1").addTag("bgm").setVolume(0.2);
    sounder.addFile("sound/big2.mp3", "big2").addTag("bgm").setVolume(0.5);
    sounder.addFile("sound/big3.mp3", "big3").addTag("bgm").setVolume(0.5);
    sounder.addFile("sound/handtohand.mp3", "hand").addTag("voice").addTag("se");
    sounder.addFile("sound/gotit.wav", "gotit").addTag("voice").addTag("se");
    sounder.addFile("sound/big1hit.wav", "big1hit").addTag("se");
    sounder.addFile("sound/CT1.mp3", "ct1").addTag("bgm");
    sounder.addFile("sound/ctstart.wav", "ctstart").addTag("se");
    sounder.addFile("sound/yattyare.wav", "yattyare").addTag("voice").addTag("se");
    sounder.addFile("sound/delive.wav", "delive").addTag("voice").addTag("se");
    sounder.addFile("sound/reg1.mp3", "reg1").addTag("bgm");
    sounder.addFile("sound/big2.mp3", "big2").addTag("bgm");
    sounder.addFile("sound/reglot.mp3", "reglot").addTag("se");
    sounder.addFile("sound/bigselect.mp3", "bigselect").addTag("se")
    sounder.addFile("sound/syoto.mp3", "syoto").addTag("se")
    sounder.addFile("sound/kokutise.mp3", "kokutise").addTag("se");
    sounder.addFile("sound/widgetkokuti.mp3", "widgetkokuti").addTag("voice").addTag("se");

    sounder.addFile("sound/mistcrack.mp3", "mistcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/widgetacrack.mp3", "widgetacrack").addTag("voice").addTag("se");
    sounder.addFile("sound/alinercrack.wav", "alinercrack").addTag("voice").addTag("se");
    sounder.addFile("sound/lalishcrack.mp3", "lalishcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/gritcrack.wav", "gritcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/anycrack.mp3", "anycrack").addTag("voice").addTag("se")

    sounder.addFile("sound/jac1.mp3", "jac1").addTag("jac").addTag("bgm");
    sounder.addFile("sound/jac2.mp3", "jac2").addTag("jac").addTag("bgm");
    sounder.addFile("sound/jac3.mp3", "jac3").addTag("jac").addTag("bgm");

    sounder.addFile("sound/yokoku.mp3", "yokoku").addTag("se");
    sounder.addFile("sound/yokoku2.mp3", "yokoku2").addTag("se")

    sounder.addFile("sound/paka-n.mp3", "paka-n").addTag("se")

    sounder.addFile("sound/seg1.wav", "seg1").addTag("se")
    sounder.addFile("sound/seg2.wav", "seg2").addTag("se")
    sounder.addFile("sound/seg3.wav", "seg3").addTag("se")

    sounder.addFile("sound/athit.wav", "athit").addTag("se")
    sounder.addFile("sound/atstart.wav", "atstart").addTag("se")

    sounder.addFile("sound/bell1.wav", "bell1").addTag("se")
    sounder.addFile("sound/bell2.wav", "bell2").addTag("se")

    sounder.addFile("sound/countup1.wav", "countup1").addTag("se")
    sounder.addFile("sound/countup2.wav", "countup2").addTag("se")

    sounder.addFile("sound/hua.wav", "huahua").addTag("se")
    sounder.addFile("sound/atend.wav", "atend").addTag("se")

    sounder.addFile("sound/chance.wav", "chance").addTag("se")

    sounder.setVolume("jac", 0.1)

    sounder.loadFile(function() {
        window.sounder = sounder
        sounder.setVolume('se', (50 / 100.) * 0.05);
        sounder.setVolume('bgm', (50 / 100.) * 0.5)
        console.log(sounder)
    })

    var settei = 0;


    var gamemode = "normal";
    var bonusflag = "none"
    var coin = 0;

    var bonusdata;
    var replayflag;

    var isCT = false;
    var isSBIG;
    var ctdata = {};

    var playcount = 0;
    var allplaycount = 0;

    var incoin = 0;
    var outcoin = 0;

    var isAT = false
    window.atLot = new atLotter(0)
    var atGame = 0;

    var bonuscounter = {
        count: {},
        history: []
    };

    slotmodule.on("leveron", function() {
        if (gamemode == "normal") {
            playcount++;
            allplaycount++;
        } else {
            if (playcount != 0) {
                bonuscounter.history.push({
                    bonus: gamemode,
                    game: playcount
                })
                if (gamemode in bonuscounter.count) {
                    bonuscounter.count[gamemode]++;
                } else {
                    bonuscounter.count[gamemode] = 1;
                }
                playcount = 0;
            }
        }
        changeCredit(0)
    })

    function stringifySaveData() {
        return {
            coin: coin,
            playcontroldata: slotmodule.getPlayControlData(),
            bonuscounter: bonuscounter,
            incoin: incoin,
            outcoin: outcoin,
            playcount: playcount,
            allplaycount: allplaycount,
            name: "セグラッシュ3",
            id: "segrush3"
        }
    }

    function parseSaveData(data) {
        coin = data.coin;
        slotmodule.setPlayControlData(data.playcontroldata)
        bonuscounter = data.bonuscounter
        incoin = data.incoin;
        outcoin = data.outcoin;
        playcount = data.playcount;
        allplaycount = data.allplaycount
        changeCredit(0)
    }

    window.SaveDataToImage = function() {
        SlotCodeOutputer.save(stringifySaveData())
    }

    window.SaveData = function() {
        if (gamemode != "normal" || isCT) {
            return false;
        }
        var savedata = stringifySaveData()
        localStorage.setItem("savedata", JSON.stringify(savedata))
        return true;
    }

    window.LoadData = function() {
        if (gamemode != "normal" || isCT) {
            return false;
        }
        var savedata = localStorage.getItem("savedata")
        try {
            var data = JSON.parse(savedata)
            parseSaveData(data)
            changeCredit(0)
        } catch (e) {
            return false;
        }
        return true;
    }

    window.ClearData = function() {
        coin = 0;
        bonuscounter = {
            count: {},
            history: []
        };
        incoin = 0;
        outcoin = 0;
        playcount = 0;
        allplaycount = 0;

        SaveData();
        changeCredit(0)
    }


    var setGamemode = function(mode) {
        switch (mode) {
            case 'normal':
                gamemode = 'normal'
                slotmodule.setLotMode(0)
                slotmodule.setMaxbet(3);
                isSBIG = false
                break;
            case 'big':
                gamemode = 'big';
                slotmodule.once("payend", function() {
                    slotmodule.setLotMode(1)
                    changeBonusSeg()
                });
                slotmodule.setMaxbet(3);
                break;
            case 'reg':
                gamemode = 'reg';
                slotmodule.once("payend", function() {
                    slotmodule.setLotMode(2)
                });
                slotmodule.setMaxbet(1);
                break;
            case 'jac':
                gamemode = 'jac';
                slotmodule.once("payend", function() {
                    slotmodule.setLotMode(2)
                });
                slotmodule.setMaxbet(1);
                break;
        }
    }

    var segments = {
        creditseg: segInit("#creditSegment", 2),
        payseg: segInit("#paySegment", 2),
        effectseg: segInit("#effectSegment", 3)
    }

    window.r = segments.effectseg.randomSeg()

    var credit = 50;
    segments.creditseg.setSegments(50);
    segments.creditseg.setOffColor(80, 30, 30);
    segments.payseg.setOffColor(80, 30, 30);
    segments.creditseg.reset();
    segments.payseg.reset();


    var lotgame;

    function changeCredit(delta) {
        credit += delta;
        if (credit < 0) {
            credit = 0;
        }
        if (credit > 50) {
            credit = 50;
        }
        $(".GameData").text("差枚数:" + coin + "枚  ゲーム数:" + playcount + "G  総ゲーム数:" + allplaycount + "G")
        segments.creditseg.setSegments(credit)
    }

    function changeBonusSeg() {
        switch (gamemode) {
            case "big":
                segments.effectseg.setSegments("" + (bonusdata.jacincount) + "" + bonusdata.bonusgamecount);
                break;
            case "reg":
                if (bonusdata.jacgetcount == 0) {
                    return
                }
                segments.effectseg.setSegments("1-" + (bonusdata.jacgetcount + 1));
                break;
            case "jac":
                if (bonusdata.jacgetcount == 0) {
                    return
                }
                segments.effectseg.setSegments("" + (bonusdata.jacincount + 1) + "-" + bonusdata.jacgetcount);
                break;
        }
    }

    var LampInterval = {
        right: -1,
        left: -1,
        counter: {
            right: true,
            left: false
        }
    }


    function clearLamp() {
        clearInterval(LampInterval.right);
        clearInterval(LampInterval.left);
        ["left", "right"].forEach(function(i) {
            $("#" + i + "neko").css({
                filter: "brightness(100%)"
            })
        })

    }

    var seghit = false;

    function effect(lot) {
        var ret;
        if (gamemode == "normal") {
            var segnum = [0, 0, 0]
            if (bonusflag == "none" && !isAT) {
                if (seghit) {
                    return
                }
                if (/ベル[12]/.test(lot)) {
                    if (rand(4)) {
                        segHitEffect()
                        return "3揃い"
                    }
                }
            } else {
                if (isAT) {
                    var nabi = [1, 2, 3];
                    var belltable = [
                        [1, 2, 3],
                        [1, 3, 2],
                        [2, 1, 3],
                        [3, 1, 2],
                        [2, 3, 1],
                        [3, 2, 1]
                    ]
                    var idx = 0;
                    var ret;
                    if (/押し順ベル/.test(lot)) {
                        idx = parseInt(lot.match(/\d/)) - 1;
                    }

                    if (/押し順ベル[1235]/.test(lot) && !rand(6)) {
                        ret = "3揃い";
                        segHitEffect()
                    }

                    nabi = belltable[idx];
                    slotmodule.zyunjo = nabi
                    var fidx = nabi.indexOf(1);
                    var sidx = 1;
                    var bf;
                    var segTimer = setInterval(() => {
                        var s = nabi.join('')
                        if (bf) {
                            s = s.replace(sidx, " ");
                        }
                        segments.effectseg.setSegments(s);
                        bf = !bf;
                    }, 100)
                    slotmodule.once('reelstop', function() {
                        if (sidx < 3) {
                            slotmodule.once("reelstop", arguments.callee)
                        } else {
                            clearInterval(segTimer)
                            segments.effectseg.setSegments(atGame)
                        }
                        sidx++;
                    });
                    atGame ? atGame-- : 0;
                    if (!atGame) {
                        slotmodule.emit('atend');
                    }
                    if (ret) {
                        return ret
                    }
                }
            }
            if (/チャンス目/.test(lot)) {
                var type = 'ABC'.indexOf(lot[lot.length - 1]);
                var r = rand(100);
                if (atLot.mode < 2) {
                    if (modeUpTable[type][atLot.mode] > r) {
                        atLot.mode = 2;
                    }
                }
                slotmodule.once('pay', () => {
                    slotmodule.freeze()
                    slotmodule.clearFlashReservation()
                    sounder.playSound('chance')
                    var counter = 20;
                    var randmaker = () => {
                        var ret = {};
                        ret.back = Array(3).fill(Array(3).fill(colordata.DEFAULT_B));
                        ret.front = [0, 0, 0].map(() => {
                            return [0, 0, 0].map(() => {
                                return rand(2) ? colordata.LINE_F : colordata.DEFAULT_F
                            })
                        })
                        return ret;
                    }
                    slotmodule.setFlash(randmaker(), 4, function() {
                        counter--
                        if (counter) {
                            slotmodule.setFlash(randmaker(), 4, arguments.callee)
                        } else {
                            slotmodule.resume()
                        }
                    })
                })
            }
        }
    }

    slotmodule.on('atend', () => {
        slotmodule.once('payend', () => {
            slotmodule.freeze()
            sounder.stopSound('bgm')
            isAT = false;
            sounder.playSound("atend", false, () => {
                segments.effectseg.setSegments("")
                slotmodule.resume()
            })
            segments.effectseg.setSegments("End")
        })
    })

    function segHitEffect() {
        var segnum = [];
        (function() {
            segnum[0] = rand(10);
            segnum[1] = rand(10);
            segnum[2] = rand(10);
            var sum = segnum[0] + segnum[1] + segnum[2];
            if (sum == 9 || sum == 19 || (segnum[0] == segnum[1] && segnum[1] == segnum[2])) {
                arguments.callee()
            }
        })()
        if (atLot.lot()) {
            segnum.fill(rand(10));
            seghit = true;
        }
        slotmodule.once("payend", function(e) {
            slotmodule.freeze();
            var stoped = Array(3).fill(false);
            if (segnum[0] != segnum[1]) {
                sounder.playSound("seg1");
                var efsegs = segments.effectseg.randomSeg();
                var timer = setInterval(() => {
                    stoped.forEach((stop, i) => {
                        if (!stop) {
                            efsegs[i].next();
                        }
                    })
                }, 50);
                setTimeout(() => {
                    var i = setInterval(() => {
                        var idx = stoped.findIndex((e) => { return !e });
                        if (idx == -1) {
                            clearInterval(i);
                            slotmodule.emit('segend');
                            return
                        }
                        stoped[idx] = true;
                        var seg = segments.effectseg.segments[idx];
                        seg.draw(seg.mapping('' + segnum[idx]))
                    }, 200);
                }, 0)
            } else {
                if (rand(8) && (segnum[1] != segnum[2] || !rand(4))) {
                    sounder.playSound("seg2");
                    var efsegs = segments.effectseg.randomSeg();
                    var timer = setInterval(() => {
                        stoped.forEach((stop, i) => {
                            if (!stop) {
                                efsegs[i].next();
                            }
                        })
                    }, 50);
                    setTimeout(() => {
                        var i = setInterval(() => {
                            var idx = stoped.findIndex((e) => { return !e });
                            if (idx == 2) {
                                clearInterval(i);
                                setTimeout(() => {
                                    stoped[idx] = true;
                                    var seg = segments.effectseg.segments[idx];
                                    seg.draw(seg.mapping('' + segnum[idx]))
                                    slotmodule.emit('segend');
                                }, 300)
                                return
                            }
                            stoped[idx] = true;
                            var seg = segments.effectseg.segments[idx];
                            seg.draw(seg.mapping('' + segnum[idx]))
                        }, 200);
                    }, 0)
                } else {
                    sounder.playSound("seg3");
                    var efsegs = segments.effectseg.randomSeg();
                    var timer = setInterval(() => {
                        stoped.forEach((stop, i) => {
                            if (!stop) {
                                efsegs[i].next();
                            }
                        })
                    }, 50);
                    setTimeout(() => {
                        var i = setInterval(() => {
                            var idx = stoped.findIndex((e) => { return !e });
                            if (idx == 2) {
                                clearInterval(i);
                                setTimeout(() => {
                                    stoped[idx] = true;
                                    var seg = segments.effectseg.segments[idx];
                                    seg.draw(seg.mapping('' + segnum[idx]))
                                    slotmodule.emit('segend');
                                }, 2000)
                                return
                            }
                            stoped[idx] = true;
                            var seg = segments.effectseg.segments[idx];
                            seg.draw(seg.mapping('' + segnum[idx]))
                        }, 200);
                    }, 0)
                }
            }
        })
        slotmodule.once('segend', () => { slotmodule.resume() })
        seghit && slotmodule.once('segend', () => {
            sounder.stopSound('bgm')
            sounder.playSound("paka-n");
            slotmodule.clearFlashReservation();
            (function() {
                var arg = arguments
                slotmodule.setFlash(flashdata.redtest, 4, function() {
                    slotmodule.setFlash(flashdata.default, 4, function() {
                        arg.callee()
                    })
                })
            })()
            slotmodule.once("bet", function() {
                seghit = false
                slotmodule.clearFlashReservation()
                slotmodule.freeze();
                segments.effectseg.setSegments(atGame)
                var defat = atTable.lot();
                var start = atGame + 33
                atGame += defat
                defat -= 33;
                var idx = 0;
                atUp(start, idx, function() {
                    setTimeout(() => {
                        if (defat > 0) {
                            sounder.playSound("huahua", false, () => {
                                defat -= 111
                                atUp(start - 33 + 111 * (++idx), idx, arguments.callee)
                            })
                        } else {
                            (function() {
                                var arg = arguments
                                slotmodule.setFlash(flashdata.redtest, 4, function() {
                                    slotmodule.setFlash(flashdata.default, 4, function() {
                                        arg.callee()
                                    })
                                })
                            })()
                            sounder.playSound("athit", false, () => {
                                slotmodule.resume();
                                isAT = true;
                                slotmodule.clearFlashReservation();
                                sounder.playSound("atstart", false, () => {
                                    sounder.playSound('at1', true)
                                })
                                segments.effectseg.setSegments(atGame)
                            })
                        }
                    }, 4000)
                })
            })
        })
    }

    function atUp(upto, ff, callback) {
        var efsegs = segments.effectseg.randomSeg();
        var timer = setInterval(() => {
            efsegs[0].next()
            efsegs[1].next()
            efsegs[2].next()
        }, 30);
        sounder.playSound("countup1", false, () => {
            clearInterval(timer)
            segments.effectseg.setSegments(upto)
            callback()
        })
    }

    $(window).bind("unload", function() {
        SaveData();
    });
    var query = getUrlVars();
    if ("online" in query && query.online) {
        var data = LoadOnline();
        settei = data.settei - 1;
        data && ("id" in data) && parseSaveData(data);

    } else {
        LoadData();
    }

    window.normalLotter = new Lotter(lotdata[settei].normal);
    window.bigLotter = new Lotter(lotdata[settei].big);
    window.jacLotter = new Lotter(lotdata[settei].jac);
}

function and() {
    return Array.prototype.slice.call(arguments).every(function(f) {
        return f
    })
}

function or() {
    return Array.prototype.slice.call(arguments).some(function(f) {
        return f
    })
}


function replaceMatrix(base, matrix, front, back) {
    var out = JSON.parse(JSON.stringify(base));
    matrix.forEach(function(m, i) {
        m.forEach(function(g, j) {
            if (g == 1) {
                front && (out.front[i][j] = front);
                back && (out.back[i][j] = back);
            }
        })
    })
    return out
}

function flipMatrix(base) {
    var out = JSON.parse(JSON.stringify(base));
    return out.map(function(m) {
        return m.map(function(p) {
            return 1 - p;
        })
    })
}

function segInit(selector, size) {
    var cangvas = $(selector)[0];
    var sc = new SegmentControler(cangvas, size, 0, -3, 79, 46);
    sc.setOffColor(120, 120, 120)
    sc.setOnColor(230, 0, 0)
    sc.reset();
    return sc;
}

/**
 * URL解析して、クエリ文字列を返す
 * @returns {Array} クエリ文字列
 */
function getUrlVars() {
    var vars = [],
        max = 0,
        hash = "",
        array = "";
    var url = window.location.search;

    //?を取り除くため、1から始める。複数のクエリ文字列に対応するため、&で区切る
    hash = url.slice(1).split('&');
    max = hash.length;
    for (var i = 0; i < max; i++) {
        array = hash[i].split('='); //keyと値に分割。
        vars.push(array[0]); //末尾にクエリ文字列のkeyを挿入。
        vars[array[0]] = array[1]; //先ほど確保したkeyに、値を代入。
    }

    return vars;
}


/*

 54
 ウ

 66
 イ

 78
 ウ
 */