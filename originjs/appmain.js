var reelControl = null;

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/Sample.dat');
xhr.responseType = 'arraybuffer';
controlData = {};
xhr.onload = function () {
    var uUint8array = new Uint8Array(this.response)
    var data_view = new DataView(uUint8array.buffer);
    var pos = 0;
    if (data_view.getUint32(pos, false) != 0x52435432) {
        alert("制御データの読み込みに失敗しました");
        return;
    }
    pos += 4;
    controlData.controlCount = data_view.getUint8(pos++, false)
    controlData.reelChipCount = data_view.getUint8(pos++, false);
    controlData.reelLength = data_view.getUint8(pos++, false);
    controlData.yakuCount = data_view.getUint8(pos++, false);
    controlData.maxLine = data_view.getUint8(pos++, false);
    controlData.reelArray = [
        [],
        [],
        []
    ]
    controlData.reelArray = controlData.reelArray.map(function () {
        var array = [];
        for (var i = 0; i < controlData.reelLength; i++) {
            array.push(data_view.getUint8(pos++, false))
        }
        return array
    });
    controlData.yakuList = Array(controlData.yakuCount).fill(0).map(function () {
        return [data_view.getUint16(pos, false), pos += 2][0]
    })

    controlData.betLine = Array(controlData.maxLine).fill(0).map(function () {
        var array = [];
        for (i = 0; i < 4; i++) {
            array.push(data_view.getUint8(pos++, false))
        }
        return array
    })

    controlData.slideTable = [
        [],
        [],
        []
    ];
    controlData.tableSize = Math.floor((controlData.reelLength + 1) / 2);

    controlData.slideTableSize = [];

    for (var i = 0; i < 3; i++) {
        controlData.slideTableSize[i] = [data_view.getUint16(pos, false) * controlData.tableSize, pos += 2][0]
    }

    controlData.tableNum23IndexSize = [0, 0, 0]
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23IndexSize[i] = [data_view.getUint16(pos, false) + 1, pos += 2][0]
    }
    controlData.tableNumSize = data_view.getUint8(pos++, false);
    controlData.tableNum23NumSize = data_view.getUint8(pos++, false);

    for (var i = 0; i < 3; i++) {
        controlData.slideTable[i] = [];
        for (var k = 0; k < controlData.slideTableSize[i]; k++) {
            controlData.slideTable[i].push(data_view.getUint8(pos++, false))
        }
    }

    controlData.tableNum1Size = controlData.controlCount * 3 * controlData.tableNumSize;
    controlData.tableNum1 = [];

    for (var i = 0; i < controlData.tableNum1Size; i++) {
        controlData.tableNum1.push(data_view.getUint8(pos++, false))
    }
    controlData.tableNum23Index = new Array(3);
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23Index[i] = [0];
        for (var k = 1; k < controlData.tableNum23IndexSize[i]; k++) {
            controlData.tableNum23Index[i].push([data_view.getUint16(pos, false), pos += 2][0])
        }
    }
    controlData.tableNum23 = [];
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23[i] = [];
        var tableNum23Size = controlData.tableNum23Index[i][controlData.tableNum23Index[i].length - 1] * controlData.tableNumSize;
        for (var k = 0; k < tableNum23Size; k++) {
            controlData.tableNum23[i].push(data_view.getUint8(pos++, false))
        }
    }
    controlData.tableNum23NumIndex = [];
    controlData.tableNum23NumIndex.push(0)
    for (var i = 1; i < controlData.controlCount * 6 + 1; i++) {
        controlData.tableNum23NumIndex[i] = [data_view.getUint16(pos, false), pos += 2][0]
    }
    controlData.tableNum23Num = [];
    for (var i = 0; i < controlData.tableNum23NumIndex[controlData.controlCount * 6] * controlData.tableNum23NumSize; i++) {
        controlData.tableNum23Num.push(data_view.getUint8(pos++, false))
    }
    reelControl = new reelControlData(controlData)
    window.slotmodule = new SlotModuleMk2();
    $(main)

}
xhr.send();

function main() {
    window.scrollTo(0, 0);

    var notplaypaysound = false;

    slotmodule.on("resourceLoaded", function (e) {
        console.log(e)
    })

    slotmodule.on("allreelstop", function (e) {
        if (e.hits != 0) {
            if (e.hityaku.length == 0)
                return
            var matrix = e.hityaku[0].matrix;
            var count = 0;
            slotmodule.once("bet", function () {
                slotmodule.clearFlashReservation()
                segments.payseg.reset();
            })
            if (e.hityaku[0].name.indexOf("Dummy") != -1 || e.hityaku[0].name.indexOf("1枚役") != -1) {
                notplaypaysound = true;
            } else {
                notplaypaysound = false;
                slotmodule.setFlash(null, 0, function (e) {
                    slotmodule.setFlash(flashdata.default, 20)
                    slotmodule.setFlash(replaceMatrix(flashdata.default, matrix, colordata.LINE_F, null), 20, arguments.callee)
                })
            }
        }

        replayflag = false;
        var nexter = true;

        e.hityaku.forEach(function (d) {
            switch (gamemode) {
                case 'normal':
                    switch (d.name) {
                        case "BIG":
                            sounder.stopSound("bgm");
                            setGamemode('big');
                            bonusdata = {
                                bonusgamecount: 30,
                                jacincount: 3
                            }
                            nexter = true;
                            slotmodule.once("payend", function () {
                                sounder.playSound("big1", true);
                                e.stopend()
                            })

                            bonusflag = "none";
                            changeBonusSeg()
                            clearLamp()
                            break;
                        case "REG":
                            setGamemode('reg');
                            sounder.stopSound("bgm");

                            nexter = true;
                            slotmodule.once("payend", function () {
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

    slotmodule.on("leveron", function () {
        if (gamemode == "big") {
            bonusdata.bonusgamecount--;
        }

        if (gamemode == "reg" || gamemode == "jac") {
            bonusdata.jacgamecount--;
        }
    })

    slotmodule.on("payend", function () {

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
    slotmodule.on("leveron", function () {

    })

    slotmodule.on("bet", function (e) {
        sounder.playSound("3bet")
        if ("coin" in e) {
            (function (e) {
                var thisf = arguments.callee;
                if (e.coin > 0) {
                    coin--;
                    e.coin--;
                    incoin++;
                    changeCredit(-1);
                    setTimeout(function () {
                        thisf(e)
                    }, 30)
                } else {
                    e.betend();
                }
            })(e)
        }
    })

    slotmodule.on("pay", function (e) {
        var pays = e.hityaku.pay;
        var arg = arguments;
        if (gamemode != "normal") {
            changeBonusSeg();
        }
        if (!("paycount" in e)) {
            e.paycount = 0
            replayflag || notplaypaysound || sounder.playSound("pay", true);
        }
        if (pays == 0) {
            if (replayflag) {
                sounder.playSound("replay", false, function () {
                    e.replay();
                    slotmodule.emit("bet", e.playingStatus);
                });
            } else {
                e.payend()
                sounder.stopSound("pay")
            }
        } else {
            e.hityaku.pay--;
            coin++;
            e.paycount++;
            outcoin++;
            if (gamemode != "normal") {
                bonusdata.geted++;
            }
            changeCredit(1);
            segments.payseg.setSegments(e.paycount)
            setTimeout(function () {
                arg.callee(e)
            }, 100)
        }
    })
    slotmodule.on("lot", function (e) {
        var ret = -1;
        switch (gamemode) {
            case "normal":
                var lot = normalLotter.lot().name

                lot = window.power || lot;
                window.power = undefined
                switch (lot) {
                    case "リプレイ":
                        ret = lot
                        break;
                    case "ベル":
                    case "スイカ":
                    case "チェリー":
                        ret = lot;
                        break;
                    case "BIG":
                        if (bonusflag == "none") {
                            ret = "BIG" + (1 + rand(3));
                            bonusflag = "BIG";
                        } else {
                            ret = bonusflag + "1";
                        }

                        break;
                    case "REG":
                        if (bonusflag == "none") {
                            ret = "REG" + (1 + rand(2));
                            bonusflag = "REG"
                            slotmodule.once("bonusend", function () {
                                sounder.stopSound("bgm");
                            })
                        } else {
                            ret = bonusflag + "1";
                        }
                        break;
                    default:
                        ret = "はずれ"
                        if (bonusflag != "none") {
                            ret = bonusflag + "1";
                        }
                }
                break;
            case "big":
                var lot = bigLotter.lot().name;
                switch (lot) {
                    case "JACIN":
                        ret = "JACIN" + (1 + rand(3))
                        break;
                    case "ベル":
                        ret = "ベル";
                        break;
                    case "スイカ":
                        ret = "BIGスイカ";
                        break;
                    default:
                        ret = "はずれ"
                }
                break;
            case "reg":
            case "jac":
                ret = "JACGAME"
                break;
        }
        effect(ret);
        return ret;
    })

    slotmodule.on("reelstop", function () {
        sounder.playSound("stop")
    })

    $("#saveimg").click(function () {
        SaveDataToImage();
    })

    $("#cleardata").click(function () {
        if (confirm("データをリセットします。よろしいですか？")) {
            ClearData();
        }
    })

    $("#loadimg").click(function () {
        $("#dummyfiler").click();
    })

    $("#dummyfiler").change(function (e) {

        var file = this.files[0];

        var image = new Image();
        var reader = new FileReader();
        reader.onload = function (evt) {
            image.onload = function () {
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
        reader.onerror = function (e) {
            alert("error " + e.target.error.code + " \n\niPhone iOS8 Permissions Error.");
        }
        reader.readAsDataURL(file)
    })

    slotmodule.on("reelstart", function () {
        if (okure) {
            setTimeout(function () {
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
    sounder.addFile("sound/start.wav", "start").addTag("se");
    sounder.addFile("sound/bet.wav", "3bet").addTag("se");
    sounder.addFile("sound/pay.wav", "pay").addTag("se");
    sounder.addFile("sound/replay.wav", "replay").addTag("se");
    sounder.addFile("sound/big1.mp3", "big1").addTag("bgm").setVolume(0.2);
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

    sounder.setVolume("jac", 0.1)

    sounder.loadFile(function () {
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

    var bonuscounter = {
        count: {},
        history: []
    };

    slotmodule.on("leveron", function () {
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
            name: "ビーナス3",
            id: "venus3"
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

    window.SaveDataToImage = function () {
        SlotCodeOutputer.save(stringifySaveData())
    }

    window.SaveData = function () {
        if (gamemode != "normal" || isCT) {
            return false;
        }
        var savedata = stringifySaveData()
        localStorage.setItem("savedata", JSON.stringify(savedata))
        return true;
    }

    window.LoadData = function () {
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

    window.ClearData = function () {
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


    var setGamemode = function (mode) {
        switch (mode) {
            case 'normal':
                gamemode = 'normal'
                slotmodule.setLotMode(0)
                slotmodule.setMaxbet(3);
                isSBIG = false
                break;
            case 'big':
                gamemode = 'big';
                slotmodule.once("payend", function () {
                    slotmodule.setLotMode(1)
                });
                slotmodule.setMaxbet(3);
                break;
            case 'reg':
                gamemode = 'reg';
                slotmodule.once("payend", function () {
                    slotmodule.setLotMode(2)
                });
                slotmodule.setMaxbet(1);
                break;
            case 'jac':
                gamemode = 'jac';
                slotmodule.once("payend", function () {
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
                segments.effectseg.setSegments("" + (bonusdata.jacincount ) + "" + bonusdata.bonusgamecount);
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
        ["left", "right"].forEach(function (i) {
            $("#" + i + "neko").css({
                filter: "brightness(100%)"
            })
        })

    }

    var seghit = false;

    function effect(lot) {
        if (gamemode == "normal") {
            var segnum = [0, 0, 0]
            if (bonusflag != "none") {
                if (seghit) {
                    return
                }
                if (rand(4) == 0) {
                    segnum = segnum.map(function(){return this+0}, rand(10));
                    seghit = true;
                } else if (rand(4) == 0) {
                    (function () {
                        segnum[0] = rand(10);
                        segnum[1] = rand(10);
                        segnum[2] = [9, 19][rand(2)] - (segnum[0] + segnum[1]);
                        if (segnum[2] < 0 || segnum[2]>=10 || (segnum[0] == segnum[1] && segnum[1] == segnum[2])) {
                            arguments.callee()
                        }
                    })()
                } else {
                    (function () {
                        segnum[0] = rand(10);
                        segnum[1] = rand(10);
                        segnum[2] = rand(10);
                        var sum = segnum[0] + segnum[1] + segnum[2];
                        if (sum == 9 || sum == 19 || (segnum[0] == segnum[1] && segnum[1] == segnum[2])) {
                            arguments.callee()
                        }
                    })()
                }
            } else {
                (function () {
                    segnum[0] = rand(10);
                    segnum[1] = rand(10);
                    segnum[2] = rand(10);
                    var sum = segnum[0] + segnum[1] + segnum[2];
                    if (sum == 9 || sum == 19 || (segnum[0] == segnum[1] && segnum[1] == segnum[2] || (lot == "リプレイ" && segnum[0] == segnum[1]))) {
                        arguments.callee()
                    }
                })()
            }
            var efsegs = segments.effectseg.randomSeg();
            var stoped = Array(3).fill(false);
            var timer = setInterval(() => {
                stoped.forEach((stop, i) => {
                    if (!stop) {
                        efsegs[i].next();
                    }
                })
            }, 50);
            var oldsegnum = -1;
            slotmodule.once('reelstop', function (e) {
                stoped[e.reel] = true;
                var seg = segments.effectseg.segments[e.reel];
                seg.draw(seg.mapping('' + segnum[e.reel]))
                if (e.count != 1) {
                    slotmodule.once('reelstop', arguments.callee);
                } else {
                    if (seghit) {
                        sounder.playSound("paka-n");
                        (function () {
                            var arg = arguments
                            slotmodule.setFlash(flashdata.redtest, 4, function () {
                                slotmodule.setFlash(flashdata.default, 4, function () {
                                    arg.callee()
                                })
                            })
                        })()
                        slotmodule.once("bet",function(){
                            slotmodule.clearFlashReservation()
                        })
                    }
                }
                if (oldsegnum == segnum[e.reel] && e.count == 2) {
                    sounder.playSound("yokoku")
                }
                oldsegnum = segnum[e.reel];
            })

            if (lot == "スイカ" && rand(2) == 0 ||
                lot == "チェリー" && rand(4) == 0 ||
                bonusflag != "none" && rand(2) == 0) {
                sounder.playSound("yokoku2")
            }

        } else {
            seghit = false;
        }
    }


    $(window).bind("unload", function () {
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
    return Array.prototype.slice.call(arguments).every(function (f) {
        return f
    })
}

function or() {
    return Array.prototype.slice.call(arguments).some(function (f) {
        return f
    })
}

function rand(m) {
    return Math.floor(Math.random() * m);
}

function replaceMatrix(base, matrix, front, back) {
    var out = JSON.parse(JSON.stringify(base));
    matrix.forEach(function (m, i) {
        m.forEach(function (g, j) {
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
    return out.map(function (m) {
        return m.map(function (p) {
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
    var vars = [], max = 0, hash = "", array = "";
    var url = window.location.search;

    //?を取り除くため、1から始める。複数のクエリ文字列に対応するため、&で区切る
    hash = url.slice(1).split('&');
    max = hash.length;
    for (var i = 0; i < max; i++) {
        array = hash[i].split('=');    //keyと値に分割。
        vars.push(array[0]);    //末尾にクエリ文字列のkeyを挿入。
        vars[array[0]] = array[1];    //先ほど確保したkeyに、値を代入。
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