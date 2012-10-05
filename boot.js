/*
bootstrap for the entire script sys. we still need jquery before this file is loaded!

this file is the ONLY file that have to consider for different browsers!
*/

var pT = { //the base of posTile frontend framework
	/*
	member properties
	*/
	current_hash: null,
	/*
	member functions
	*/
	staticResource: function() {
		return "/"+arguments.join("/");
	},
	dynamicResource: function() {
		//TODO: specified the url on dynamic server
	},
	init: function() {
		//router
	}
};

pT.browser_compat = 
	/*
	member properties
	*/
	uas: navigator.userAgent,
	walkarounds: { //determine if we have to use some tricks to simulate the new features in old browsers
		iframe_file_upload: false
	},
	/*
	member functions
	*/
	testVersion: function(of) {
		if (uas.indexOf(of) < 0) { return false; }
		var i;
		var pattern = new RegExp(" "+of+"(\d*)[\. ]");
		var matched = this.uas.match(pattern);
		if (matched.length < 2) { return this.handle.unable; }
		if (parseInt(matched[1]) < this.requirements[of][0]) { return this.handle.unable; }
		if (parseInt(matched[1]) < this.requirements[of][1]) { 
			if (this.requirements[of].length >=3) {
				for (i in this.requirements[of][2]) {
					this.walkarounds[i] = this.requirements[of][2][i];
				}
			}
			return this.handle.warning;
		}
		return this.handle.ok;
	},
	load: function() {
		if (!uas) { this.handle.perhaps(); return; }
		var result;
		for(i in this.requirements) {
			result = this.testVersion(i);
			if (typeof result == 'function') {
				result();
				return;
			}
		}
		this.handle.perhaps();
	},
	requirements: { //minimum version, suggested version, walkarounds required for in-between versions(in array of strings)
		'Gecko\/': [20100101, 20110301, { iframe_file_upload: true }], //3.6, 4.0
		'AppleWebKit\/': [533, 535], //XHR2, WebSocket
		'MSIE ': [9, 10, { iframe_file_upload: true }] //XHR2 and Websocket are both supported only from IE10 on
	},
	handlers: {
		unable: function() {
			//the broswer is totally unsupported.
			$("body").load(pT.staticResource("browser_compat","unable.html"));
		},
		perhaps: function() {
			if ($.cookie("browser_compat_ignored")) {
				pT.init();
			} else {
				$("body").load(pT.staticResource("browser_compat","perhaps.html"));
			}
		},
		ok: {
			pT.init();
		},
		warning: function() {
			//the browser is supported but some functions are disabled due to the limit. visitors are advised to update their broswer.
			if ($.cookie("browser_compat_ignored")) {
				pT.init();
			} else {
				$("body").load(pT.staticResource("browser_compat","warning.html"));
			}
		}
	},
	setIgnore: {
		$.cookie("browser_compat_ignored", "ignored");
		pT.init();
	}
}

//to be rewritten in jq style
window.onhashchange = function(){ if (pT.current_hash != window.location.hash) { pT.init(); } }