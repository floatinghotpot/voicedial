

function isMobileDevice() {
	return ( /(ipad|iphone|ipod|android)/i.test(navigator.userAgent) ); 
}

function isIOSDevice(){
	return ( /(ipad|iphone|ipod)/i.test(navigator.userAgent) );
}

function isAndroidDevice() {
	return ( /(android)/i.test(navigator.userAgent) );
}

function status( str ) {
	$('div#status').html( str );
	$('div#settings_status').html( str );
}

function input( str ) {
	$('textarea#inputbox').val( str );
}

function updateButtonArea( str ) {
	$('div#buttons').html( str );
}

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

function say( str ) {
	input( str );
	
	if(navigator.speech) {
		navigator.speech.startSpeaking(str, {voice_name: getSpeakerValue()});
	}
}

function getSpeakerName() {
	var speakers = $('select#voice_name')[0];
	var speaker = speakers.options[ speakers.selectedIndex ];
	return speaker.innerHTML;
}

function getSpeakerValue() {
	var speakers = $('select#voice_name')[0];
	var speaker = speakers.options[ speakers.selectedIndex ];
	return speaker.value;
}

var commands = {
	callto: '打电话给',
	smsto: '发短信给'
};
var confirms = ['是的','是','没错','对','对啊！','yes','快去','赶紧','啊！','是啊！'];
var current_command = "";

var theEnd = '。';
function trimEnd( str ) {
	if(str.indexOf(theEnd) + theEnd.length == str.length) {
		str = str.substr(0, str.length - theEnd.length);
	}
	return str;
}

function isNumeric( obj ) {
    // parseFloat NaNs numeric-cast false positives (null|true|false|"")
    // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
    // subtraction forces infinities to NaN
    return !jQuery.isArray( obj ) && obj - parseFloat( obj ) >= 0;
}

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

function dialPhoneNumber( str ) {
	status('Calling ' + str + '...');
	
	if(isIOSDevice()) {
		window.plugins.phoneDialer.dial( str );
	} else {
		document.location.href = 'tel:' + str;
	}
}

function updateContactNames(){
	say('正在同步联系人名字，请稍候。')
	
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
			say('联系人姓名已经更新。');
		}, function(){
			say('抱歉，联系人姓名更新失败。');
		});
		
	}, function(error){}, options);
}

function callContact( arg ) {
	if(isNumeric(arg)) {
		dialPhoneNumber( arg );
		
	} else {
		var options      = new ContactFindOptions();
		options.filter   = arg;
		options.multiple = true;
		options.desiredFields = [navigator.contacts.fieldType.id,navigator.contacts.fieldType.displayName,navigator.contacts.fieldType.name,navigator.contacts.fieldType.phoneNumbers];
		var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
		navigator.contacts.find(fields, function(items){
			var str = "";
			var n = 0;
			var phone_number = "";
			for(var i=0; i<items.length; i++) {
				if(items[i].displayName == arg) {
					var phones = items[i].phoneNumbers;
					for(var j=0; j<phones.length; j++) {
						phone_number = phones[j].value; n ++;
						str += "<button class='phone button yellow' onclick='dialPhoneNumber($(this).text())'>" + phones[j].value + "</button><br/>";
					}
					if( n == 1 ) {
						dialPhoneNumber( phone_number );
					} else if( n > 1 ) {
						var msg = '找到' + n + '个电话，您看看打哪个？';
						say(msg);
						
						updateButtonArea( str );
					}
				}
			}
			if( n == 0 ) {
				var msg = '通讯录没找到这个人。有别的名字吗？';
				say(msg);
			}
		}, function(error){}, options);
	}
}

function doCmd(cmd, args) {
	if(cmd == 'callto') {
		callContact( args );
		
	} else if( cmd == 'smsto' ) {
		
	}
}

function executeCommand() {
	for(var cmd in commands) {
		var cmdstr = commands[ cmd ];
		if(current_command.indexOf( cmdstr ) > -1) {
			say('好的，您稍等。')
			doCmd(cmd, current_command.substr( cmdstr.length ));
			return;
		}
	}
	
	say( "对不起，这个不会。" );
}

function cancelCommand() {
	current_command = '';
	updateButtonArea( '' );
}

function onSpeak( str ) {
    $('textarea#inputbox').val( str );
    $('div#status').html( str );
    
    str = trimEnd( str );
    
    for(var i=0; i<confirms.length; i++) {
    	if(str == confirms[i]) {
    		executeCommand();
    		return;
    	}
    }
    
    current_command = str;
    say( '您要' + str + '吗？');
    
    var btns = "<button class='phone button yellow' onclick='executeCommand();'>确认</button> ";
    btns += "<button class='phone button yellow' onclick='cancelCommand();'>取消</button>";
    updateButtonArea( btns );
}

function loadApp() {
	hotjs.i18n.translate();

	var CLICK = isMobileDevice() ? 'touchstart' : 'mousedown';
	var TOUCHSTART = isMobileDevice() ? 'touchstart' : 'mousedown';
	var TOUCHEND = isMobileDevice() ? 'touchend' : 'mouseup';
	
	// page navigation
	$('button#info').on(TOUCHEND, function(e){
		e.preventDefault();
		say('这款软件由安杰坊科技有限公司出品。提供手机应用和手游开发，欢迎商务合作。');
	});
	$('button#settings').on(TOUCHEND, function(e){
		e.preventDefault();
		showPage('settings');
	});
	$('.backhome').on(TOUCHEND, function(e){
		e.preventDefault();
		showPage('mainpage');
	});
	$(document).on('backbutton', onClickBackButton);
	
	// main page
	$('button#read').on(TOUCHSTART, function(e){
		e.preventDefault();
		var str = $('textarea#inputbox').val();
		status('Reading ...')
		say( str );
	});
	$('button#read').on(TOUCHEND, function(e){
		e.preventDefault();
		status('');
		if(navigator.speech) {
			navigator.speech.stopSpeaking();
		}
	});
	$('button#listen').on(TOUCHSTART, function(e){
		e.preventDefault();
		updateButtonArea('');
		status( "Listening ..." );
		if(navigator.speech) {
			navigator.speech.startListening({}, onSpeak);
		}
	});
	$('button#listen').on(TOUCHEND, function(e){
		e.preventDefault();
		status('');
		if(navigator.speech) {
			navigator.speech.stopListening();
		}
	});

	// settings page
	$('button#synccontact').on(TOUCHEND, function(e){
		e.preventDefault();
		
		updateContactNames();
	});
	
	$('button#mailtorjfun').on(TOUCHEND, function(e){
		e.preventDefault();
		document.location.href = 'mailto:rjfun.mobile@gmail.com';
	});
	$('button#callrjfun').on(TOUCHEND, function(e){
		e.preventDefault();
		dialPhoneNumber( '18017739762' );
	});
	
	if(navigator.speech) {
		var s = navigator.speech.voice_names;
		for( var v in s ) {
		    $('select#voice_name').append( new Option(s[v], v) );
		}
	}
	
	showPage('mainpage');
}

function main()
{
    if(isMobileDevice()) {
        document.addEventListener('deviceready', loadApp, false);
    } else {
        loadApp();
    }
}
