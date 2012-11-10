goog.provide('postile.browser_compat');

goog.require('goog.net.Cookies');

postile.browser_compat.uas = navigator.userAgent;

postile.browser_compat.css_prefix = '';

postile.browser_compat.walkarounds = { //determine if we have to use some tricks to simulate the new features in old browsers
    xhr: 2, //level of xmlhttprequest
    xdr: false //require XDomainRequest
};

postile.browser_compat.testVersion = function(of) {
    if (this.uas.indexOf(of) < 0) { return false; }
    var i;
    var pattern = new RegExp(" "+of+"(\\d*\\.?\\d)[\\. ]");
    var matched = this.uas.match(pattern);
    if (!matched || matched.length < 2) { return false; }
    postile.browser_compat.css_prefix = this.requirements[of][2];
    if (parseInt(matched[1]) < this.requirements[of][0]) { return this.handlers.unable; }
    if (parseInt(matched[1]) < this.requirements[of][1]) {
        if (this.requirements[of].length >=4) {
            for (i in this.requirements[of][3]) {
                this.walkarounds[i] = this.requirements[of][3][i];
            }
        }
        return this.handlers.warning;
    }
    return this.handlers.ok;
};

postile.browser_compat.load = function() {
    if (!this.uas) { this.handlers.perhaps(); return; }
    var result;
    for(i in this.requirements) {
        result = this.testVersion(i);
        if (typeof result == 'function') {
            result();
            return;
        }
    }
    this.handlers.perhaps();
};

postile.browser_compat.requirements = { //minimum version, suggested version, walkarounds required for in-between versions(in array of strings)
    'Firefox\/': [3.6, 4, 'Moz', { xhr: 1 }], //3.6, 4.0
    'AppleWebKit\/': [533, 535, 'Webkit'], //XHR2, WebSocket
    'MSIE ': [9, 10, 'Ms', { xhr: 1, xdr: true }] //XHR2 and Websocket are both supported only from IE10 on
};

postile.browser_compat.handlers = {
    unable: function() {
        //the broswer is totally unsupported.
        $("body").load(postile.staticResource("browser_compat","unable.html"));
    },
    perhaps: function() {
        if (goog.net.cookies.get("browser_compat_ignored")) {
            postile.init();
        } else {
            $("body").load(postile.staticResource("browser_compat","perhaps.html"));
        }
    },
    ok: function() {
        postile.init();
    },
    warning: function() {
        //the browser is supported but some functions are disabled due to the limit. visitors are advised to update their broswer.
        if (goog.net.cookies.get("browser_compat_ignored")) {
            postile.init();
        } else {
            $("body").load(postile.staticResource("browser_compat","warning.html"));
        }
    }
};

postile.browser_compat.setIgnore = function() {
    goog.net.cookies.set("browser_compat_ignored", "ignored");
    postile.init();
};

postile.browser_compat.setCss = function(dom, attr, value) {
    dom.style[attr] = value;
    dom.style[postile.browser_compat.css_prefix+attr.substr(0,1).toUpperCase()+attr.substr(1)] = value;
}