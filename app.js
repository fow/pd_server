
var express = require('express')
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, fs = require('fs')
	, crypto = require("crypto");

var app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server);

//var port = 3000;
var port = 80;

app.configure(function(){
	app.set('port', process.env.PORT || port);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', routes.index);
server.listen(port);

var now_connection = 0;
var roomList = new Array();
/*
roomList["socket_test"] = new Array();
roomList["socket_test"].pass = "";	//pass
roomList["socket_test"].op = 0;		//制御フラグ
roomList["socket_test"].online = 0;	//onlineフラグ
*/

var ipList = new Array();

var f_robo = 1;//1:robo 0:pc
var userData;

//console.log(__dirname);
//console.log(crypto.createHash('sha1').update('').digest('hex'));

var userData_filename = __dirname + "/user.txt";
/* user.txt sample
{"item":[
	{"id":"socket_test","pass":"da39a3ee5e6b4b0d3255bfef95601890afd80709"},
	{"id":"alice","pass":"pass_sha1_hash"},
	{"id":"bob","pass":"pass_sha1_hash"}
]}
*/
//writeFile(filename, "a");

//init userData
readFile(userData_filename);

function readFile(filename){
	fs.readFile(filename, function (err, data) {
		if (err) throw err;
		//console.log("readFile " + data);
		userData = JSON.parse(data);
		
		for (var i = 0; i < userData.item.length; i++){
			//console.log(userData.item[i].id + "," + userData.item[i].pass);
			roomList[userData.item[i].id] = new Array();
			roomList[userData.item[i].id].pass = userData.item[i].pass;
			roomList[userData.item[i].id].op = 0;
			roomList[userData.item[i].id].online = 0;
			/*
			if(crypto.createHash('sha1').update('a').digest('hex') == userData.item[i].pass){
				console.log(userData.item[i].id);
			}*/
		}
	});
}

function writeFile(filename, v){
	fs.writeFile(filename, v, function (err) {
		if (err) throw err;
		console.log('saved!');
	});
}

function writeUserDataFile(){
	var v = '{"item":[ ';
	for(var k in roomList){
		v += '\n{"id":"' + k + '","pass":"' + roomList[k].pass +'"},'
	}
	v = v.slice(0, -1) + '\n]}';
	writeFile(userData_filename, v);
}

var Room = io
.of('/room')
.on('connection', function(socket) {
	var joinedRoom = null;
	var address = socket.handshake.address;
	var ip = address.address;
	now_connection++;
	console.log("new connection:" + now_connection + " - " + socket.id + " " + ip);
	//console.log(socket);
	
	//同一IPからid登録数制限
	if(ipList[ip] == undefined){
		ipList[ip] = 0;
	}

	/**/
	var cnt = 0;
	var s_roomList = "";
	for(var k in roomList){
		s_roomList += "" + k + "," + roomList[k].op + "," + roomList[k].online + "|";
		cnt++;
		if(cnt > 100){
			break;
		}
	}
	socket.emit('robo_list', s_roomList);
	/**/
	
	socket.on('robo_join', function(msg) {
		var name = msg.name;
		var pass = msg.pass;
		
		//パスチェック
		if(roomList[name] != undefined){
			if(crypto.createHash('sha1').update(pass).digest('hex') == roomList[name].pass){
				roomList[name].op = 0;
				roomList[name].online = 1;
				f_robo = 1;
				//console.log(name);
				
				joinedRoom = name;
				socket.join(joinedRoom);
				socket.emit('robo_joined', "welcom to " + joinedRoom);
				//socket.emit('robo_join_ret', "joined");
				socket.broadcast.to(joinedRoom).send('robo joined');
				print("robo_joined", msg);
				//console.log(joinedRoom);
			}else{
				socket.emit('robo_join_ret', { v: "deny_pass" });
				print("robo_deny_pass", msg);
			}
		}else{
			socket.emit('robo_join_ret', { v: "no_exist" });
		}
	});
	
	socket.on('pc_join', function(msg) {
		var name = msg.name;
		var pass = msg.pass;
/*
		console.log("[pc_join roomList[name]]");
		console.log(roomList[name]);

		console.log("[pc_join name]");
		console.log(name);

		console.log("[pc_join msg]");
		console.log(msg);*/

		if(roomList[name] == undefined){
			socket.emit('pc_join_ret', { v: "no_exist" });
			print("no_exist", msg);
		//}else if(roomList[name].op != 0){//同時操作禁止にする場合はコメントアウト
		//	socket.emit('pc_join_ret', { v: "oprated" });
		//	print("oprated", msg);
		}else{
			if(crypto.createHash('sha1').update(pass).digest('hex') == roomList[name].pass){
				f_robo = 0;
				roomList[name].op = 1;
				joinedRoom = name;
				socket.join(joinedRoom);
				socket.emit('pc_joined', "welcom to " + joinedRoom);
				//socket.emit('pc_join_ret', { v: "joined" });
				socket.broadcast.to(joinedRoom).send('pc joined');
				print("pc_joined", msg);
			}else{
				socket.emit('pc_join_ret', { v: "deny_pass" });
				print("pc_deny_pass " + roomList[name], msg);
			}
		}
	});
	
	socket.on('robo_discon', function(msg) {
		if (joinedRoom) {
			roomList[joinedRoom].online = 0;
			socket.broadcast.to(joinedRoom).send("robo_discon");
			print("robo_discon", joinedRoom);
		}
	});
	
	socket.on('pc_discon', function(msg) {
		if (joinedRoom) {
			roomList[joinedRoom].op = 0;
			print("pc_discon", joinedRoom);
			socket.emit('pc_discon', { v: joinedRoom });
			joinedRoom = null;
		}else{
			print("pc_discon", joinedRoom);
		}
	});
	
	socket.on('robo_msg', function(msg) {
		if (joinedRoom) {
			socket.broadcast.to(joinedRoom).send(msg.v);
		    print("robo_msg", msg);
		} else {
			socket.send("you're not joined");
			print("robo_msg not joined", msg);
		}
	});

	socket.on('pc_msg', function(msg) {
		if (joinedRoom) {
			socket.broadcast.to(joinedRoom).send(msg.v);
			print("pc_msg", msg);
			if(joinedRoom == "socket_test"){
				socket.send("rcv msg:" + msg.v);
			}
		} else {
			socket.send("you're not joined");
			print("pc_msg not joined", msg);
		}
	});
	
	socket.on('disconnect', function () {
		if (joinedRoom) {
			if(f_robo == 1){
				roomList[joinedRoom].online = 0;
			}else{
				roomList[joinedRoom].op = 0;
			}
		}
		print("disconnect " + joinedRoom, f_robo);
		//io.sockets.emit('user disconnected');
	});
	
	//新規ID登録
	socket.on('pc_id_new', function(msg) {
		var name = msg.name;
		var pass = msg.pass;
		
		print("pc_id_new", msg);
		
		//使用可能文字列か調べる
		if (name.match(/^[-_\.@0-9a-z]+$/i) && pass.match(/^[-_\.@0-9a-z]*$/i)) {
			//既に使用されているidか調べる
			if(roomList[name] != undefined){
				socket.emit('pc_id_new_ret', { v: "exist" });
			}else{
				if(name.length > 12 || pass.length > 12){
					socket.emit('pc_id_new_ret', { v: "over_str" });
				}else if(ipList[ip] <= 100){//同一IPからはn個以内
					//idを配列に入れて、txtファイルに保存する
					roomList[name] = new Array();
					roomList[name].pass = crypto.createHash('sha1').update(pass).digest('hex');
					roomList[name].op = 0;
					roomList[name].online = 0;
					writeUserDataFile();
					socket.emit('pc_id_new_ret', { v: "ok" });
					ipList[ip]++;
				}else{
					socket.emit('pc_id_new_ret', { v: "over" });
				}
			}
		}else{
			socket.emit('pc_id_new_ret', { v: "error" });
		}
	});
	
	//pass_change
	socket.on('pc_pass_change', function(msg) {
		var name = msg.name;
		var pass = msg.pass;
		var new_pass = msg.new_pass;
		
		print("pc_pass_change", msg);
		
		//使用可能文字列か調べる
		if (name.match(/^[-_\.@0-9a-z]+$/i) && pass.match(/^[-_\.@0-9a-z]*$/i) && new_pass.match(/^[-_\.@0-9a-z]*$/i)) {

			if(roomList[name] == undefined){
				socket.emit('pc_pass_change_ret', { v: "undefined" });
			}else{
				if(name.length > 12 || pass.length > 12 || new_pass.length > 12){
					socket.emit('pc_id_new_ret', { v: "over_str" });
				}else if(crypto.createHash('sha1').update(pass).digest('hex') == roomList[name].pass){
					roomList[name].pass = crypto.createHash('sha1').update(new_pass).digest('hex');
					writeUserDataFile();
					socket.emit('pc_pass_change_ret', { v: "ok" });
				}else{
					socket.emit('pc_pass_change_ret', { v: "deny_pass" });
				}
			}
		}else{
			socket.emit('pc_pass_change_ret', { v: "error" });
		}
	});
});

function print(tag, msg){
	console.log("-----------" + tag + "-----------");
	console.log(msg);
}

/*
robo_join
robo_discon
robo_msg

pc_join
pc_discon
pc_msg

pc_id_new
pc_pass_change

*/