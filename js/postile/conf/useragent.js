goog.provide('postile.conf.useragent');

goog.require('goog.array');
goog.require('goog.net.Cookies');
goog.require('goog.userAgent');

/**
 * @file ua.js
 * UserAgent and feature detection.
 */

/**
 * Singleton class that detects browser features.
 * @constructor
 */
postile.conf.UserAgent = function() {
    /**
     * The feature that the browser supports.
     * @type {postile.conf.UserAgent.Feature}
     */
    this.features = {
        xhr: 2,
        xdr: false
    };

    /**
     * @private
     * @see UserAgent.load
     */
    this.compatHandler_ = null;

    /**
     * @private
     * @see UserAgent.load
     */
    this.routeDispatcher_ = null;

    /**
     * @type {postile.conf.UserAgent.Browser}
     * @private
     */
    this.browser_ = null;
    goog.array.some(postile.conf.UserAgent.supportedBrowsers,
        function(browser) {
            if (browser.isA) {
                this.browser_ = browser;
                return true;
            }
            return false;
        }, this);

    /**
     * Vendor-specific css prefix.
     * @type {string}
     * @private
     */
    this.cssPrefix_ = '';

    this.checkFeature();
};

/**
 * @typedef {{xhr: number, xdr: boolean}}
 */
postile.conf.UserAgent.Feature;

/*
postile.conf.UserAgent.prototype.compatIgnored = function() {
    return goog.net.cookies.get('browser_compat_ignored');
};

postile.conf.UserAgent.prototype.setIgnore = function() {
    goog.net.cookies.set("browser_compat_ignored", "ignored");
    this.routeDispatcher_();
};
*/

/**
 * Checks feature and creates corresponding compatHandler.
 */
postile.conf.UserAgent.prototype.checkFeature = function() {
    if (goog.isNull(this.browser_)) {
        this.compatHandler_ = this.handlePerhaps;
    }
    else {
        this.cssPrefix_ = this.browser_.cssPrefix;
        if (goog.userAgent.isVersion(this.browser_.bestVersion)) {
            this.compatHandler_ = this.handleOk;
        }
        else if (goog.userAgent.isVersion(this.browser_.minimumVersion)) {
            goog.object.update(this.feature_, this.browser_.walkarounds);
            this.compatHandler_ = this.handleWarning;
        }
        else {
            this.compatHandler_ = this.handleUnable;
        }
    }
};

postile.conf.UserAgent.prototype.handleOk = function() {
    this.routeDispatcher_();
};

postile.conf.UserAgent.prototype.handlePerhaps = function() {
    //console.info('[INFO] postile.conf.UserAgent: perhaps');
    /*
    if (this.compatIgnored()) {
        this.routeDispatcher_();
    }
    */
    window.location.href = "/unsupported";
};

postile.conf.UserAgent.prototype.handleWarning = function() {
    /*
    if (this.compatIgnored()) {
        this.routeDispatcher_();
    }
    */
    //console.warn('[WARNING] postile.conf.UserAgent');
    window.location.href = "/unsupported";
};

postile.conf.UserAgent.prototype.handleUnable = function() {
    window.location.href = "/unsupported";
};


/**
 * @param {Function} routeDispatcher The function to dispatch the
 * current page's url.
 */
postile.conf.UserAgent.prototype.load = function(routeDispatcher) {
    this.routeDispatcher_ = routeDispatcher;
    this.compatHandler_();
};

/**
 * Set vendor-specific css attribute.
 * @param {Element} dom The dom node to set css on
 * @param {string} attr The style name to be patched
 * @param {string} value The style value
 */
postile.conf.UserAgent.prototype.setCss = function(dom, attr, value) {
    var vendorSpecAttr = this.cssPrefix_ + attr.substr(0, 1).toUpperCase()
            + attr.substr(1);
    dom.style[attr] = dom.style[vendorSpecAttr] = value;
};

/**
 * @typedef {{name: string, isA: boolean, minimumVersion: string,
              bestVersion: string, walkarounds: Object,
              cssPrefix: string}}
 */
postile.conf.UserAgent.Browser;

/**
 * @type {Array.<postile.conf.UserAgent.Browser>}
 */
postile.conf.UserAgent.supportedBrowsers = [
    {
        name: 'GECKO',
        isA: goog.userAgent.GECKO,
        cssPrefix: 'Moz',
        minimumVersion: '1.9.2',  // Firefox 3.6
        bestVersion: '2.0',       // Firefox 4
        walkarounds: { xhr: 1 }   // Walkarounds for minimum version
    },
    {
        name: 'WEBKIT',
        isA: goog.userAgent.WEBKIT,
        cssPrefix: 'Webkit',
        minimumVersion: '533',
        bestVersion: '535',
        walkarounds: {}
    }/*,
    {
        name: 'IE',
        isA: goog.userAgent.IE,
        cssPrefix: 'Ms',
        minimumVersion: '9',
        bestVersion: '10',
        walkarounds: { xhr: 1, xdr: true }
    }*/
];

postile.conf.useragent = new postile.conf.UserAgent();

