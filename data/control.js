
function rand(m) {
    return Math.floor(Math.random() * m);
}

var control = {
	reel:{
		speed:37,
		slipspeed:37,
		margin:0
	},
	minbet:1,
	wait:0,
	code:[
		"はずれ",
		"リプレイ",
		"共通ベル",
		"3揃い",
		"チャンス目A",
        "チャンス目B",
        "チャンス目C",
		"REG",
		"押し順ベル1",
		"押し順ベル2",
        "押し順ベル3",
        "押し順ベル4",
		"押し順ベル5",
		"押し順ベル6",
		"JACGAME",
		"リーチ目"
		],
	maxpay:[15,15,9]
}
