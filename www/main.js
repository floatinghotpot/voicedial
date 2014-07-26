
var app_key = 'com.rjfun.voicedial';
var app_version = '1.0.20140726';
var app_vercode = 20140726;

var app_url = 'http://rjfun.com/voicedial/';
var autorun_url = app_url + 'autorun.js'; // will run when client start
var share_link_url = app_url; // will share in social sharing


function isMobileDevice() {
	return ( /(ipad|iphone|ipod|android)/i.test(navigator.userAgent) ); 
}

function isIOSDevice(){
	return ( /(ipad|iphone|ipod)/i.test(navigator.userAgent) );
}

function isAndroidDevice() {
	return ( /(android)/i.test(navigator.userAgent) );
}

function _T( str ) {
	return hotjs.i18n.get( str );
}

/* handling page switch */
var stackedPages = [];
var currentPage = null;

function showPage( pgid ) {
	$('div.page').hide();
	$('div#' + pgid).show();
	currentPage = pgid;
}

function pushPage( pgid ) {
	if(currentPage != null) stackedPages.push( currentPage );
	showPage( pgid );
}

function popPage() {
	if( stackedPages.length >0) {
		showPage( stackedPages.pop() );
		return true;
	}
	
	return false;
}

/* data persisitence */

var app_data = {};

function resetData() {
	app_data.cfg = {
		mylang: 'zh_cn',
		myaccent: 'mandarin',
		voicename: 'xiaoyan'
	};
	
	app_data.t_updatecontacts = 0;
	app_data.firstrun = true;
}

function loadData() {
	var data_str = localStorage.getItem( app_key );
	if( data_str ) {
		app_data = JSON.parse( data_str );
	} else {
		resetData();
	}
}

function saveData() {
	localStorage.setItem( app_key, JSON.stringify(app_data) );
}

/* --------- */

function status( str ) {
	$('div#status').html( str );
}

function input( str ) {
	$('input#inputbox').val( str );
}

function speak( str ) {
	$('textarea#inputbox').html( str );
	
	if(navigator.speech) {
		navigator.speech.startSpeaking(str, {voice_name: getSpeakerValue()});
	}
}

function updateButtonArea( str ) {
	$('div#buttons').html( str );
}

function getSpeakerName() {
	return $('span#voicename').text();
}

function getSpeakerValue() {
	var voice_name = $('span#voicename').attr('v');
	if(! voice_name) voice_name = 'xiaoyan';
	return voice_name;
}

function getMyLanguage() {
	var lang = $('span#mylang').attr('lang');
	if(! lang) lang = 'zh_cn';
	return lang;
}

function getMyAccent() {
	return $('span#mylang').attr('accent');
}

var dialog = null;

function onClickBackButton(e) {
	e.preventDefault();
	
	if(dialog != null) {
		dialog.dismiss();
		dialog = null;
		return;
	}
	
	if(stackedPages.length >0) {
		popPage();
		
	} else {
		dialog = hotjs.domUI.popupDialog('',hotjs.i18n.get('confirmquit'),{
	        'ok':function(){
	        	navigator.app.exitApp();
	        },
	        'cancel':function(){
	        	dialog = null;
	        	return true;
	        }, 
	        x: null
	        });
	}
}

var commands = {
	callto: '打电话给',
	smsto: '发短信给'
};
var current_command = "";
var confirms = ['是的','是','没错','对','对啊！','yes','快去','赶紧','啊！','是啊！'];

var prefixitems = ['我要','我想'];
var suffixitems = ['。','！','.'];
function trimSpeakStr( str ) {
	for(var i=0; i<prefixitems.length; i++) {
		var STR_IWANT = prefixitems[i];
		if(str.indexOf(STR_IWANT) == 0) {
			str = str.substr(STR_IWANT.length);
		}
	}
	for(var i=0; i<suffixitems.length; i++) {
		var STR_END = suffixitems[i];
		if(str.indexOf(STR_END) + STR_END.length == str.length) {
			str = str.substr(0, str.length - STR_END.length);
		}
	}
	
	return str;
}
function exchangeYouMe( str ) {
	str = str.replace('我','{0}').replace('你','{1}');
	str = str.replace('{0}','你').replace('{1}','我');
	
	str = str.replace('I','{2}').replace('me','{3}').replace('you','{4}');
	str = str.replace('{2}','you').replace('{3}','you').replace('{4}','me');
	return str;
}

function isNumeric( obj ) {
    // parseFloat NaNs numeric-cast false positives (null|true|false|"")
    // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
    // subtraction forces infinities to NaN
    return !jQuery.isArray( obj ) && obj - parseFloat( obj ) >= 0;
}
/*
function dumpVar( v, depth ) {
	if(typeof depth === 'undefined') depth = 3;
	
	if(typeof v === "undefined") {
		return "(undefined)";
		
	} else if(Array.isArray(v)) {
		if(depth <= 0) return '(array)';
		var str = "[";
		var n = 0;
		for(var i=0; i<v.length; i++) {
			if(n > 0) str += ','; n ++;
			str += dumpVar(v[i], depth-1);
		}
		str += "]";
		return str;
		
	} else if( typeof v === 'object') {
		if(depth <= 0) return '(object)';
		var str = "{";
		var n = 0;
		for(var i in v) {
			if(n > 0) str += ','; n ++;
			str += "'" + i + "': " + dumpVar(v[i], depth-1);
		}
		str += "}";
		return str;
		
	} else if( typeof v === 'function') {
		return '(function)';
		
	} else {
		return "" + v;
	}
}
*/

function updateContactNames(){
	$('div#settings_status').html( "<img src='img/animated.gif' />" );
	speak('正在将联系人名字加入词表，请稍候。')
	
	var options      = new ContactFindOptions();
	options.multiple = true;
	options.desiredFields = [navigator.contacts.fieldType.id,navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
	var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
	navigator.contacts.find(fields, function(items){
		var names = [];
		for(var i=0; i<items.length; i++) {
			var name = items[i].displayName;
			if((typeof name === 'string') && (name != null)) names.push( name );
		}
		//console.log( JSON.Stringify( names ) );
		
		navigator.speech.updateContact(names, function(){
			speak('联系人名字已经加入词表。');
			$('div#settings_status').html("");
		}, function(){
			speak('抱歉，联系人名字添加失败。');
			$('div#settings_status').html("");
		});
		
	}, function(error){}, options);
}

function dialPhoneNumber( str ) {
	status('Calling ' + str + '...');
	
	if(isIOSDevice()) {
		window.plugins.phoneDialer.dial( str );
	} else {
		document.location.href = 'tel:' + str;
	}
}

function callNumbers( numbers ) {
	if(numbers.length == 1) {
		dialPhoneNumber( numbers[0] );
		
	} else if(numbers.length > 1) {
		var str = "";
		for(var i=0; i<numbers.length; i++) {
			str += "<button class='phone button yellow' onclick='dialPhoneNumber($(this).text())'>" + numbers[i] + "</button><br/>";
		}
		updateButtonArea( str );
		
		var msg = '找到' + numbers.length + '个电话，您看看打哪个？';
		speak(msg);
		
	} else {
		var msg = '通讯录里找到这个人，但是没有留电话。';
		speak(msg);
	}
}

function doCmdWith( cmd, contactInfo ) {
	if(cmd == 'callto') {
		var numbers = [];
		var phones = contactInfo.phoneNumbers;
		for(var j=0; j<phones.length; j++) {
			numbers.push( phones[j].value );
		}
		callNumbers( numbers );
		
	} else {
		
	}
}

function pickContactFor( cmd ){
	navigator.contacts.pickContact(function(contact){
		doCmdWith(cmd, contact);
		
	}, function(err) {
		
	});
}

function findContactFor( cmd, arg ) {
	var options      = new ContactFindOptions();
	options.filter   = arg;
	options.multiple = true;
	options.desiredFields = [navigator.contacts.fieldType.id,navigator.contacts.fieldType.displayName,navigator.contacts.fieldType.name,navigator.contacts.fieldType.phoneNumbers];
	var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
	navigator.contacts.find(fields, function(items){
		var found = false;
		for(var i=0; i<items.length; i++) {
			if(items[i].displayName == arg) {
				found = true;
				doCmdWith( cmd, items[i] );
			}
		}
		if(! found) {
			var msg = '通讯录没找到这个人。有别的名字吗？';
			speak(msg);
		}
	}, function(error){}, options);
}

function doCmd(cmd, arg) {
	if(cmd == 'callto') {
		if(isNumeric(arg)) {
			dialPhoneNumber( arg );
		} else {
			findContactFor( cmd, arg );
		}
		
	} else if( cmd == 'smsto' ) {
		
	}
}

function doThisCmd() {
	for(var k in commands) {
		var cmdstr = commands[ k ];
		if(current_command.indexOf( cmdstr ) > -1) {
			speak('好的。')
			doCmd(k, current_command.substr( cmdstr.length ));
			return;
		}
	}
	
	speak( "对不起，这个不会。" );
	cancelThisCmd();
}

function cancelThisCmd() {
	current_command = '';
	$('input#inputbox').text('');
	updateButtonArea('');
}

function onSpeak( str ) {
    $('input#inputbox').val( str );
    
    str = trimSpeakStr( str );
    
    for(var i=0; i<confirms.length; i++) {
    	if(str == confirms[i]) {
    		doThisCmd();
    		return;
    	}
    }
    
    var cmd = '';
	for(var k in commands) {
		var cmdstr = commands[ k ];
		if(str.indexOf( cmdstr ) > -1) {
			cmd = k;
			break;
		}
	}
    
    current_command = str;
    
    var repeat_str = exchangeYouMe(current_command);
    var lang = getMyLanguage();
    if( lang == 'zh_cn') {
    	repeat_str = '您要' + repeat_str + '吗？';
    } else if( lang == 'en_us' ) {
    	repeat_str = repeat_str + '?';
    }
    speak( repeat_str );
    
    var btns = "<button class='dialog button yellow' onclick='doThisCmd();'>确认</button> ";
    btns += "<button class='dialog button yellow' onclick='cancelThisCmd();'>取消</button><br/>";
    if(cmd != '') {
        btns += "<button class='phone button yellow' onclick=\"pickContactFor('" + cmd + "');\">从通讯录选择</button><br/>";
    }
    updateButtonArea( btns );
}

function init_events() {
	var CLICK = 'click';
	//var CLICK = isMobileDevice() ? 'touchstart' : 'mousedown';
	var TOUCHSTART = isMobileDevice() ? 'touchstart' : 'mousedown';
	var TOUCHEND = isMobileDevice() ? 'touchend' : 'mouseup';
	
	// page navigation
	$(document).on('backbutton', onClickBackButton);
	$('.pageback').on(TOUCHEND, function(e){
		e.preventDefault();
		popPage();
	});
	
	// main page
	$('button#info').on(TOUCHEND, function(e){
		e.preventDefault();
		speak('本软件由安杰坊科技有限公司出品。提供手机应用和手游开发，欢迎商务合作。');
	});
	$('button#settings').on(TOUCHEND, function(e){
		e.preventDefault();
		pushPage('settings');
	});
	$('button#read').on(TOUCHSTART, function(e){
		e.preventDefault();
		updateButtonArea('');
		status('Speaking ...')
		
		var str = $('textarea#inputbox').val();
		speak( str );
	});
	$('button#read').on(TOUCHEND, function(e){
		e.preventDefault();
		status('&nbsp;');
		if(navigator.speech) {
			navigator.speech.stopSpeaking();
		}
	});
	$('button#listen').on(TOUCHSTART, function(e){
		e.preventDefault();
		updateButtonArea('');
		status( "Listening ..." );
		
		if(navigator.speech) {
			navigator.speech.startListening({
				language: getMyLanguage(),
				accent: getMyAccent()
			}, onSpeak);
		}
	});
	$('button#listen').on(TOUCHEND, function(e){
		e.preventDefault();
		status('&nbsp;');
		if(navigator.speech) {
			navigator.speech.stopListening();
		}
	});

	// settings page
	$('div.btnmylang').on(CLICK, function(e){
		e.preventDefault();
		pushPage('mylangpage');
	});
	$('div.btnvoicename').on(CLICK, function(e){
		e.preventDefault();
		pushPage('voicenamepage');
	});
	$('button#synccontact').on(CLICK, function(e){
		e.preventDefault();
		updateContactNames();
	});
	$('button#mailtorjfun').on(CLICK, function(e){
		e.preventDefault();
		document.location.href = 'mailto:rjfun.mobile@gmail.com';
	});
	$('button#callrjfun').on(CLICK, function(e){
		e.preventDefault();
		dialPhoneNumber( '18017739762' );
	});
	
	// my lang page
	$('li.langitem').on(CLICK, function(e){
		e.preventDefault();
		
		var lang = $(this).attr('lang');
		var accent = $(this).attr('accent');
		var o = $('span#mylang');
		o.attr('lang', lang);
		o.attr('accent', accent);
		o.text( $(this).text() );
		
		$('li.langitem').removeClass('checked');
		$(this).addClass('checked');
		
		app_data.cfg.mylang = lang;
		app_data.cfg.myaccent = accent;
		saveData();
	});
	
	// my lang page
	$('li.voiceitem').on(CLICK, function(e){
		e.preventDefault();
		
		var voicename = $(this).attr('v');
		var o = $('span#voicename');
		o.attr('v', voicename);
		o.text( $(this).text() );
		
		$('li.voiceitem').removeClass('checked');
		$(this).addClass('checked');
		
		app_data.cfg.voicename = voicename;
		saveData();
	});
}

function updateSettings() {
	$('li.voiceitem').each(function(){
		$(this).removeClass('checked');
		if($(this).attr('v') == app_data.cfg.voicename) {
			$(this).addClass('checked');
			
			var voicename = $(this).attr('v');
			var o = $('span#voicename');
			o.attr('v', voicename);
			o.text( $(this).text() );
		}
	});

	$('li.langitem').each(function(){
		$(this).removeClass('checked');
		var thelang = $(this).attr('lang');
		var theaccent = $(this).attr('accent') ;
		
		if((thelang == app_data.cfg.mylang) && (theaccent == app_data.cfg.myaccent)) {
			$(this).addClass('checked');
			
			var lang = $(this).attr('lang');
			var accent = $(this).attr('accent');
			var o = $('span#mylang');
			o.attr('lang', lang);
			o.attr('accent', accent);
			o.text( $(this).text() );
		}
	});
}

function initApp() {
	hotjs.i18n.translate();
	
    loadData();
    updateSettings();
    init_events();

	showPage('mainpage');
	
	hotjs.require( autorun_url );
}

function main()
{
    if(isMobileDevice()) {
        document.addEventListener('deviceready', initApp, false);
    } else {
    	initApp();
    }
}
