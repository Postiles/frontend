/*
test if the browser supported by naively trusting the user agent string provided
*/

var browser_support = {
	uas: navigator.userAgent,
	testVersion: function(of, min, suggested) {
		if (uas.indexOf(of) < 0) { return false; }
		var pattern = new RegExp(" "+of+"(\d*)[\. ]");
		var matched = this.uas.match(pattern);
		if (matched.length < 2) { return this.handle.unable; }
		if (parseInt(matched[1]) < min) { return this.handle.unable; ]
		if (parseInt(matched[1]) < suggested) { return this.handle.warning; ]
		return this.handle.ok;
	},
	load: function() {
		var temp;
		if (!uas) { this.handle.perhaps(); return; }
		for(i in this.requirements) {
			temp = this.testVersion(i, this.requirements[i][0], this.requirements[i][1]);
			if (typeof temp == 'function') {
				temp();
				return;
			}
		}
		this.handle.perhaps();
	},
	requirements: {
		'Gecko\/': [20100101, 20110301], //3.6, 4.0
		'AppleWebKit\/': [533, 535], //XHR2, WebSocket
		'MSIE ': [9, 10] //XHR2 and Websocket are both supported only from IE10 on
	},
	handlers: {
		unable: function() {
			//the broswer is totally unsupported.
		},
		perhaps: function() {
			//we are not sure if the browser is supported, but the possibility of being supported is very low.
		},
		ok: {
			//everything's fine. do whatever you like here.
		},
		warning: function() {
			//the browser is supported but some functions are disabled due to the limit. visitors are advised to update their broswer.
		}
	}
}