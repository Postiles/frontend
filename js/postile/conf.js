/**
 * Static configuration for postile,
 * splitted from boot.js to handle circular dependency.
 */

goog.provide('postile.conf');

goog.require('goog.locale');
goog.require('goog.events.KeyHandler');

/**
 * Static functions and configurations
 */
postile.conf = {

    dhost: 'postiles.com',

    dport: 3000,

    fayeLocation: 'http://postiles.com:9292/faye',

    wrapper: null,

    error_log: [],

    staticResource: function(input) {
        return "/templates/" + input.join("/");
    },

    dynamicResource: function(input) {
        return "http://"+postile.conf.dhost+":"+postile.conf.dport+"/"+input.join("/");
    },

    uploadsResource: function(input) {
        return "http://static-uploads.postiles.com/"+input.join("/"); // kind of hack
    },

    /**
     * @param {Array.<string>} input A list of path segments, to be joined
     * by backslash.
     * @return {string} CSS path built
     */
    cssResource: function(input) {
        return "/css/" + input.join("/");
    },

    imageResource: function(input) {
        return "/images/" + input.join("/");
    },

    getSelfUserId: function() {
        return parseInt(localStorage.postile_user_id);
    },

    userLoggedIn: function() {
        return localStorage.postile_user_id && localStorage.postile_user_id != '0';
    },

    getGlobalKeyHandler: function() {
        if(!postile.conf.getGlobalKeyHandler.handler) {
            //postile.conf.getGlobalKeyHandler.handler = new goog.events.KeyHandler(document, true);
            postile.conf.getGlobalKeyHandler.handler = document.body;
        }
        return postile.conf.getGlobalKeyHandler.handler;
    },

    logError: function(obj) {
        if (postile.conf.error_log.length > 50) {
            postile.conf.error_log.splice(0, 25);
        }
        postile.conf.error_log.push(obj);
    },
    
    logErrorByEvent: function(e) {
        var err = e.getBrowserEvent();
        postile.conf.logError({
            lineno: err.lineno,
            filename: err.filename,
            message: err.message
        });
    },
    
    logErrorByException: function(e) {
        if (e.stack) {
            postile.conf.logError({ stacktrace: e.stack });
        }
    },

    initDbgConfiguration: function() {
        if ('postile_debug_dhost' in localStorage) {
            postile.conf.dhost = localStorage["postile_debug_dhost"];
        }
        if ('postile_debug_dport' in localStorage) {
            postile.conf.dport = localStorage["postile_debug_dport"];
        }
        if ('postile_debug_faye' in localStorage) {
            postile.conf.fayeLocation = localStorage["postile_debug_faye"];
        }
        if ('postile_debug_locale' in localStorage) {
            goog.locale.setLocale(localStorage["postile_debug_locale"]);
        }
    }
};

postile.conf.getGlobalKeyHandler.handler = null;

/**
 * Could be overridden in the compiler.
 * @define {boolean}
 */
postile.conf.ENABLE_DEBUG = false;

/**
 * If true, view.loadCss will do nothing.
 * @define {boolean}
 */
postile.conf.USING_COMPILED_CSS = false;

