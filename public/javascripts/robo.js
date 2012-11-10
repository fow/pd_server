
var joined = false;
var room;
var f_no_log = false;

$(function() {

	var local_id = localStorage.getItem("local_id");
	if(local_id != undefined){
		//$('#robo_id_list').html('<a href="#" class="a_robo_id" ref="' + local_id + '">' + local_id + '</a> ');
		$("#robo_id").val(local_id);
	}
	
	room = io.connect('/room');

	room.on('connect', function() {
		log("☆ " + nowTime() + " Connected Server id:" + room.socket.transport.sessid);
	});
	
	room.on('pc_joined', function(msg) {
		log("☆ " + nowTime() + " 接続 " + msg);
		$('#container > ul').tabs('select', 2);
		joined = true;
	});
	
	room.on('pc_join_ret', function(msg) {
		switch(msg.v){
			case "no_exist":  $('#login_message').html("idが存在しません"); break;
			case "deny_pass": $('#login_message').html("パスワードが違います"); break;
		}
	});
	
	room.on('pc_id_new_ret', function(msg) {
		switch(msg.v){
			case "exist":  $('#id_message').html("そのidは既に使用されています"); break;
			case "error":  $('#id_message').html("id, passに使用できない文字が含まれています"); break;
			case "over":   $('#id_message').html("登録できません"); break;
			case "over_str":   $('#id_message').html("id,passは12文字以内にしてください"); break;
			case "ok":     $('#id_message').html("idを登録しました"); break;
		}
	});
	
	room.on('pc_pass_change_ret', function(msg) {
		switch(msg.v){
			case "undefined": $('#id_message').html("登録されていないidです"); break;
			case "error":     $('#id_message').html("id, passに使用できない文字が含まれています"); break;
			case "deny_pass": $('#id_message').html("パスワードが違います"); break;
			case "over_str":   $('#id_message').html("id,passは12文字以内にしてください"); break;
			case "ok":        $('#id_message').html("パスワードを変更しました"); break;
		}
	});
	
	/**/
	room.on('robo_list', function(msg) {
		//console.log(msg);
		//log("☆ " + nowTime() + " get robo list");
		
		$('#robo_id_list').html("");
		
		var arr1 = msg.split("|");
		var max = (arr1.length > 100) ? 100 : arr1.length;
		for(var i = 0; i < max; i++){
			var arr2 = arr1[i].split(",");
			var name   = arr2[0];
			var op     = arr2[1];
			var online = arr2[2];
			var add = "";
			
			if(name){
				//add += (online == "1") ? ":offline":":online";
				//add += (op == "1") ? "[操作中]":"";
				$('#robo_id_list').append('<a href="#" class="a_robo_id" ref="' + name + '">' + name + add + '</a> ');
			}
			//todo filter
		}
		
	});
	/**/
	
	//message
	room.on('message', function(msg) {
		log("→ " + nowTime() + " " + msg);
	});
	
	room.on('pc_discon', function(msg) {
		log("☆ " + nowTime() + " 切断 " + msg.v);
		joined = false;
	});

	//init
	$("#t_key_a td").css("background-color", bg_color);
	$("#t_key_delay td").css("background-color", bg_color);
	$("#t_key_a td:eq(12)").css("background-color", select_color);
	$("#t_key_delay td:eq(1)").css("background-color", select_color);
	
	$('#no_log').click(function() {
		f_no_log = ($(this).attr('checked') == undefined) ? false:true;
	});
	
	for(var i=10; i<=100; i+=10){
		$('#ma_speed').append($('<option value="' +i+ '">' +i+ '</option>'));
	}
	$('#ma_speed').val('30');
	
	$('.a_robo_id').live("click", function() {
		$("#robo_id").val($(this).attr("ref"));
		return false;
	});
	
	$('.a_info').live("click", function() {
		var target = $(this).attr("ref");
		
		$(".info").hide();
		$("#info_" + target).show();
	
		return false;
	});
	
	
	$('.checkb').live("click", function() {
		
		var c = $(this).attr("checked");
		var v = $(this).val();
		switch(v){
			case "program": if(c){ sw_mode(1); }else{ sw_mode(0); } break;
			case "MA_out": if(c){ $("#ma_out").show(); f_ma_out = 1; }else{ $("#ma_out").hide(); f_ma_out = 0; } break;
			case "help":   if(c){ $(".help").show(); }else{ $(".help").hide(); } break;
			case "st_delay": if(c){ $("#st_delay").show(); f_st_delay = 1; }else{ $("#st_delay").hide(); f_st_delay = 0; } break;
		}
	});
	
	$('#a_more_info').live("click", function() {
		$("#more_info").toggle();
		return false;
	});
	
	//init tab
	$('#container > ul').tabs({ selected: 0 });
	
	//init
	$(".info").hide();
	$(".help").hide();
	$("#ma_out").hide();
	move_bg(-1, 1);
	change_speed(13);
	change_delay(20);
	$("#op2").hide();
	$("#st_delay").hide();
	$("#more_info").hide();

});

function go_tab(n){
	$('#container > ul').tabs('select', n);
	return false;
}

function join(){
	var msg = $('#robo_id').val();
	var pass = $('#pass').val();

	if(msg){
		localStorage.setItem("local_id", msg);
		room.emit('pc_join', { name: msg, pass: pass });
	}else{
		log("☆ " + nowTime() + " id を入力して下さい");
		$('#login_message').html("id を入力して下さい");
	}
}

function id_new(){
	var msg = $('#rg_robo_id').val();
	var pass = $('#rg_pass').val();

	if(!msg){
		$('#id_message').html("id を入力して下さい");
	}else if(msg.match(/^[-_\.@0-9a-z]+$/i) && pass.match(/^[-_\.@0-9a-z]*$/i)) {
		if(msg.length <= 12 && pass.length <= 12){
			room.emit('pc_id_new', { name: msg, pass: pass });
		}else{
			$('#id_message').html("id,passは12文字以内にしてください");
		}
	}else{
		$('#id_message').html("id, passに使用できない文字が含まれています");
	}
}

function id_pass_change(){
	var msg = $('#rg_robo_id').val();
	var pass = $('#rg_pass').val();
	var new_pass = $('#change_pass').val();

	if(!msg){
		$('#id_message').html("idを入力して下さい");
	}else if(msg.match(/^[-_\.@0-9a-z]+$/i) && pass.match(/^[-_\.@0-9a-z]*$/i) && new_pass.match(/^[-_\.@0-9a-z]*$/i)) {
		if(msg.length <= 12 && pass.length <= 12 && new_pass.length <= 12){
			room.emit('pc_pass_change', { name: msg, pass: pass, new_pass: new_pass });
		}else{
			$('#id_message').html("id,passは12文字以内にしてください");
		}
	}else{
		$('#id_message').html("id, passに使用できない文字が含まれています");
	}
}

function sendm(msg){
	log("← " + nowTime() + " " + msg);
	room.emit('pc_msg', { v: msg });
}

function sendm_test(){
	sendm($('#cmd').val());
}

function discon(){
	if(joined){
		room.emit('pc_discon', { v: "" });
		room.disconnect();
	}else{
		log("☆ " + nowTime() + " 接続していません ");
		$('#login_message').html("接続していません");
	}
}

function nowTime(){
	var d = new Date();
	return "" + d.getHours() + ":" + ("00" + (d.getMinutes())).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2) + "." + ("000" + d.getMilliseconds()).slice(-3);
}

var msg_queue = new Queue();
var msg_queue_cnt = 0;

function log(s){
	if(!f_no_log){
		msg_queue.enqueue(s);
		msg_queue_cnt++;
		if(msg_queue_cnt > 100){
			msg_queue.dequeue();
			msg_queue_cnt--;
		}
		$('#receiveMsg').val(msg_queue.toString());
		//console.log(msg_queue.__a[0]);
	}
}

function btn_del(){
	$('#receiveMsg').val("");
}


var input_key_buffer = new Array();
var morter_speed = 35;
var old_send = "";
var no_send = 0;
var delay = 5;
var delay2 = 0;
var f_program = 0;
var f_ma_out = 0;
var f_st_delay = 0;

//color
var bg_color = "#EFEFEF";
var select_color = "#89C997";

// キーボードを押したときに実行されるイベント
document.onkeydown = function(e){
	// InternetExplorer 用
	if (!e)	e = window.event;

	input_key_buffer[e.keyCode] = true;

	make_key_state(1);
}

// キーボードを離したときに実行されるイベント
document.onkeyup = function(e){

	// InternetExplorer 用
	if (!e)	e = window.event;

	input_key_buffer[e.keyCode] = false;
	
	if(delay == 0){
		make_key_state(0);
	}else{
		old_send = "";
	}
}

function sw_mode(mode){
	if(mode == 1){
		f_program = 1;
		$("#op1").hide();
		$("#op2").show();
	}else{
		f_program = 0;
		$("#op1").show();
		$("#op2").hide();
	}
}

function msg_pfx(){
	return (f_program == 1) ? "p" : "c";
}

function make_key_state(f_down){
	if(f_program == 1)
		return;
	
	if($(".ui-tabs-selected > a").attr("href") != "#fragment-3")
		return;
	
	var msg = msg_pfx();

//key code http://www.programming-magic.com/file/20080205232140/keycode_table.html

	var up    = (input_key_buffer[38] || input_key_buffer[73]) ? 1:0;//↑i
	var down  = (input_key_buffer[40] || input_key_buffer[75]) ? 1:0;//↓k
	var right = (input_key_buffer[39] || input_key_buffer[76]) ? 1:0;//→l
	var left  = (input_key_buffer[37] || input_key_buffer[74]) ? 1:0;//←j
	var stop  = (input_key_buffer[81]) ? 1:0;//q

	var z  = (input_key_buffer[90]) ? 1:0;
	var x  = (input_key_buffer[88]) ? 1:0;
	var c  = (input_key_buffer[67]) ? 1:0;
	var v  = (input_key_buffer[86]) ? 1:0;
	var b  = (input_key_buffer[66]) ? 1:0;

	var a  = (input_key_buffer[65]) ? 1:0;
	var s  = (input_key_buffer[83]) ? 1:0;
	var d  = (input_key_buffer[68]) ? 1:0;
	var f  = (input_key_buffer[70]) ? 1:0;
	var g  = (input_key_buffer[71]) ? 1:0;
	var h  = (input_key_buffer[72]) ? 1:0;
	//var j  = (input_key_buffer[74]) ? 1:0;

	var e  = (input_key_buffer[69]) ? 1:0;
	var r  = (input_key_buffer[82]) ? 1:0;
	
	if(f_down == 1){
		no_send = 0;
	}

	//$("#t_key_a td").css("background-color", bg_color);
	//$("#t_key_delay td").css("background-color", bg_color);
	
	
	if     (b == 1){ change_speed(17); }
	else if(v == 1){ change_speed(16); }
	else if(c == 1){ change_speed(15); }
	else if(x == 1){ change_speed(14); }
	else if(z == 1){ change_speed(13); }

	if     (a == 1){ change_delay(18); }
	else if(s == 1){ change_delay(19); }
	else if(d == 1){ change_delay(20); }
	else if(f == 1){ change_delay(21); }
	else if(g == 1){ change_delay(22); }

	move_bg(-1, 1);
	
	//ma
	msg += make_morter_a_str(e, r);

	//mb, mc
	//$("#key_state_morter").html(morter_speed);
	//$("#key_state_delay").html(delay);
	
	var command = 0;
	if(up == 1){
		if(left == 1)      { command = 1; }
		else if(right == 1){ command = 3; }
		else               { command = 2; }
	}else if(down == 1){
		if(left == 1)      { command = 7; }
		else if(right == 1){ command = 9; }
		else               { command = 8; }
	}
	else if(left == 1)     { command = 4; }
	else if(right == 1)    { command = 6; }
	
	if(stop == 1)          { command = 5; }
	
	msg += make_morter_bc_str(command);
	msg += make_delay_str(command);
	
	$("#key_state").html(msg);

	if(no_send == 0){
		if(old_send != msg){
			old_send = msg
			//log(msg);
			sendm(msg);
		}
	}
}

function make_morter_a_str(e, r){
	var ma_speed = (f_ma_out == 1) ? parseInt($('#ma_speed option:selected').val(), 10) : morter_speed;
	if     (e == 1){                  move_bg(11, 1); }
	else if(r == 1){ ma_speed += 100; move_bg(12, 1); }
	else           { ma_speed = 0;                }
	return format_num3(ma_speed);
}

function make_morter_bc_str(command){
	var msg = "";
	
	var speed = morter_speed;
	var speed2 = speed - 20;
	if (speed2 < 0)
		speed2 = 0;

	switch(command){
		case 0: msg += "000000";                              break;
		case 1: msg += morter_control(speed2, speed);         break;
		case 2: msg += morter_control(speed, speed);          break;
		case 3: msg += morter_control(speed, speed2);         break;
		case 4: msg += morter_control(speed+100, speed);      break;
		case 5: msg += stopMotorControl();                    break;
		case 6: msg += morter_control(speed, speed+100);      break;
		case 7: msg += morter_control(speed2+100, speed+100); break;
		case 8: msg += morter_control(speed+100, speed+100);  break;
		case 9: msg += morter_control(speed+100, speed2+100); break;
	}
	move_bg(command);
	return msg;
}
function change_speed(id){
	switch(id){
		case 13: morter_speed = 35; break;
		case 14: morter_speed = 50; break;
		case 15: morter_speed = 65; break;
		case 16: morter_speed = 80; break;
		case 17: morter_speed = 100; break;
	}
	speed_bg(id);
}

function change_delay(id){
	switch(id){
		case 18: delay = 0; break;
		case 19: delay = 2; break;
		case 20: delay = 5; break;
		case 21: delay = 10; break;
		case 22: delay = 30; break;
	}
	delay_bg(id);
}

function change_delay2(id){
	switch(id){
		case 23: delay2 = 0; break;
		case 24: delay2 = 10; break;
		case 25: delay2 = 30; break;
		case 26: delay2 = 50; break;
		case 27: delay2 = 100; break;
	}
	delay2_bg(id);
}

function btnp(id){
	var msg = msg_pfx() + format_num3(id);
	sendm(msg);
}
function btn(id){
	if(id >=1 && id <=12){
		var msg = msg_pfx();
		$(".btn_dir2").css("background-color", bg_color);
		
		if(id >=11 && id <=12){
			if(id == 11){ msg += make_morter_a_str(1 , 0); }
			if(id == 12){ msg += make_morter_a_str(0 , 1); }
		}else{
			msg += "000"
		}
		
		if(id >=1 && id <=9){
			msg += make_morter_bc_str(id);
		}else{
			msg += "000000"
		}
		
		msg += make_delay_str(id);
		
		if(old_send != msg){
			old_send = msg
			if(delay != 0){
				old_send = "";
			}
			sendm(msg);
		}else if(msg != ("c000000000" + format_num3(delay)) && delay == 0){
			msg = "c000000000" + format_num3(delay);
			old_send = msg
			sendm(msg);
		}
		$("#key_state").html(msg);
		
	}else if(id >= 13 && id <= 17){
		change_speed(id);
	}else if(id >= 18 && id <= 22){
		change_delay(id);
	}else if(id >= 23 && id <= 27){
		change_delay2(id);
	}
	
}

function make_delay_str(id){
	var msg = "";
	if(f_st_delay == 1 && ((id >= 1 && id <= 3) || (id >= 7 && id <= 9))){
		msg = format_num3(delay2);
	}else{
		msg = format_num3(delay);
	}
	return msg;
}

function speed_bg(id){
	$(".btn_m").css("background-color", bg_color);
	$("#btn_" + id).css("background-color", select_color);
}

function move_bg(id, dir2){
	$(".btn_dir").css("background-color", bg_color);
	if(dir2){ 	$(".btn_dir2").css("background-color", bg_color); }
	$("#btn_" + id).css("background-color", select_color);

	if(id != -1){
		$("#t_key_a td:eq(" + id + ")").css("background-color", select_color);
	}
}

function delay_bg(id){
	$(".btn_delay").css("background-color", bg_color);
	$("#btn_" + id).css("background-color", select_color);
}

function delay2_bg(id){
	$(".btn_delay2").css("background-color", bg_color);
	$("#btn_" + id).css("background-color", select_color);
}

function morter_control(speed1,speed2){
	return format_num3(speed1) + format_num3(speed2);
}

function stopMotorControl(){
	return "000000";
}

function format_num3(n){
	s = "";
	if(n < 10){
		s = "00" + n;
	}else if(n < 100){
		s = "0" + n;
	}else{
		s = "" + n;
	}
	return s;
}




function Queue() {
	this.__a = new Array();
}

Queue.prototype.enqueue = function(o) {
	this.__a.push(o);
}

Queue.prototype.dequeue = function() {
	if( this.__a.length > 0 ) {
		return this.__a.shift();
	}
	return null;
}

Queue.prototype.size = function() {
	return this.__a.length;
} 

Queue.prototype.toString = function() {
	//return '' + this.__a.join('\n') + '';
	var s = "";
	for(var i = 0; i< this.__a.length; i++){
		s = this.__a[i] + "\n" + s;
	}
	return s;
}
