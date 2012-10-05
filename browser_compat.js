goog.provide('postile.browser_compat');

goog.require('goog.net.Cookies');

postile.browser_compat.uas = navigator.userAgent;

postile.browser_compat.walkarounds = { //determine if we have to use some tricks to simulate the new features in old browsers
    xhr: 2, //level of xmlhttprequest
    xdr: false //require XDomainRequest
};

postile.browser_compat.testVersion = function(of) {
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
};

postile.browser_compat.load = function() {
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
};

postile.browser_compat.requirements = { //minimum version, suggested version, walkarounds required for in-between versions(in array of strings)
    'Gecko\/': [20100101, 20110301, { xhr: 1 }], //3.6, 4.0
    'AppleWebKit\/': [533, 535], //XHR2, WebSocket
    'MSIE ': [9, 10, { xhr: 1, xdr: true }] //XHR2 and Websocket are both supported only from IE10 on
};

postile.browser_compat.handlers = {
    unable: function() {
        //the broswer is totally unsupported.
        $("body").load(pT.staticResource("browser_compat","unable.html"));
    },
    perhaps: function() {
        if (goog.net.Cookies.get("browser_compat_ignored")) {
            postile.init();
        } else {
            $("body").load(pT.staticResource("browser_compat","perhaps.html"));
        }
    },
    ok: function() {
        postile.init();
    },
    warning: function() {
        //the browser is supported but some functions are disabled due to the limit. visitors are advised to update their broswer.
        if (goog.net.Cookies.get("browser_compat_ignored")) {
            postile.init();
        } else {
            $("body").load(pT.staticResource("browser_compat","warning.html"));
        }
    }
};

postile.browser_compat.setIgnore = function() {
    goog.net.Cookies.set("browser_compat_ignored", "ignored");
    postile.init();
};