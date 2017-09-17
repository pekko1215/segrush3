/**
 * Created by pekko1215 on 2017/07/24.
 */
Array.prototype.select = function(key,value){
    return this.find(function(o){
        return key in o && o[key]==value
    })
}

var lotdata = Array(6).fill(0).map(function(){
    return {
        normal: [
            {   name:"リプレイ",
                value:1/7.7},
            {   name:"ベル",
                value:1/10},
            {   name:"スイカ",
                value:1/64},
            {   name:"チェリー",
                value:1/32},
            {   name:"BIG",
                value:1/240},
            {   name:"REG",
                value:1/299}
        ],
        "big":[
            {
                name:"JACIN",
                value:1/4.7
            },
            {
                name:"ベル",
                value:1/2
            },
            {
                name:"スイカ",
                value:1/2
            }
        ],
        "jac":[
            {
                name:"JACGAME",
                value:1
            }
        ]
    }
})

//設定1
lotdata[0].normal.select("name","ベル").value = 1/11;
lotdata[0].normal.select("name","BIG").value = 1/289;
lotdata[0].normal.select("name","REG").value = 1/325;

//設定1
lotdata[1].normal.select("name","ベル").value = 1/11;
lotdata[1].normal.select("name","BIG").value = 1/279;
lotdata[1].normal.select("name","REG").value = 1/311;

//設定3
lotdata[2].normal.select("name","ベル").value = 1/11;
lotdata[2].normal.select("name","BIG").value = 1/260;
lotdata[2].normal.select("name","REG").value = 1/305;

//設定4
lotdata[3].normal.select("name","ベル").value = 1/10;
lotdata[3].normal.select("name","BIG").value = 1/258;
lotdata[3].normal.select("name","REG").value = 1/301;

//設定5
lotdata[4].normal.select("name","ベル").value = 1/10;
lotdata[4].normal.select("name","BIG").value = 1/250;
lotdata[4].normal.select("name","REG").value = 1/299;

//設定6
lotdata[5].normal.select("name","ベル").value = 1/9;

