/**
 * Created by pekko1215 on 2017/07/24.
 */
Array.prototype.select = function(key, value) {
    return this.find(function(o) {
        return key in o && o[key] == value
    })
}

var lotdata = Array(6).fill(0).map(function() {
    return {
        normal: [{
                name: "リプレイ",
                value: 1 / 7.7
            },
            {
                name: "REG",
                value: 1 / 8192
            }
        ],
        "big": [{
                name: "JACIN",
                value: 1 / 4.7
            },
            {
                name: "ベル",
                value: 1 / 2
            },
            {
                name: "スイカ",
                value: 1 / 2
            }
        ],
        "jac": [{
            name: "JACGAME",
            value: 1
        }]
    }
})



var fallLot = 32

var modeTable = [{
    name: "通常A",
    min: 64,
    max: 32,
    tenjo: 64
}, {
    name: "通常B",
    min: 48,
    max: 32,
    tenjo: 64
}, {
    name: "チャンスA",
    min: 8,
    max: 4,
    tenjo: 32,
    fall:3
}, {
    name: "チャンスB",
    min: 4,
    max: 1,
    tenjo: 32,
    fall:3
}]

var modeChangeTable = [
    [74, 16, 10, 0], //A
    [8, 82, 10, 0], //B
    [70, 30, 00, 0], //CA
    [0, 0, 70, 30] //CB
]

var modeUpTable = [
    [10,10],
    [25,25],
    [25,25]
]

var atTable = [{
    at:33,
    lot:9800
},{
    at:111,
    lot:75
},{
    at:222,
    lot:50
},{
    at:333,
    lot:50
},{
    at:444,
    lot:5
},{
    at:555,
    lot:20
}]

atTable.lot = function(){
    var r = rand(10000);
    return this.find((d)=>{
        r-=d.lot;
        return r<0
    }).at
}

var ATLotMode = rand(2);

function atLotter(mode) {
    this.mode = mode;
    this.lotcount = 0;
}

atLotter.prototype.lot = function(){
    var l = modeTable[this.mode]
    var r = rand(l.min - l.max)+l.max;
    this.lotcount++
    if(!rand(r) || l.tenjo<this.lotcount){
        this.lotcount = 0
        return true;
    }else{
        if(!rand(fallLot)||(l.fall&&!rand(l.fall))){
            r = rand(100);
            var idx = modeChangeTable[this.mode].findIndex((e)=>{
                r -= e;
                return r<0
            })
            if(this.mode!=idx){this.lotcount = 0;}
            this.mode = idx
        }
        return false;
    }
}