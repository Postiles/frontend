goog.provide('postile.conf');

goog.require('goog.events.KeyHandler');

/**
 * Static functions and configurations
 */
postile.conf = {
    dhost: window.location.hostname,
    dport: 3000,
    fayeLocation: null,
    wrapper: null,
    error_log: [],
    staticResource: function(input) {
        return "/templates/" + input.join("/");
    },
    dynamicResource: function(input) {
        return "http://"+postile.conf.dhost+":"+postile.conf.dport+"/"+input.join("/");
    },
    uploadsResource: function(input) {
        return "http://"+postile.conf.dhost.replace('www', 'static-uploads')+"/"+input.join("/"); // kind of hack
    },
    cssResource: function(input) {
        return "/css/" + input.join("/");
    },
    imageResource: function(input) {
        return "/images/" + input.join("/");
    },
    getGlobalKeyHandler: function() {
        if(!postile.conf.getGlobalKeyHandler.handler) {
            postile.conf.getGlobalKeyHandler.handler = new goog.events.KeyHandler(document);
        }
        return postile.conf.getGlobalKeyHandler.handler;
    },
    logError: function(e) {
        var err = e.getBrowserEvent();
        if (postile.conf.error_log.length > 40) {
            postile.conf.error_log.splice(0, 20);
        }
        postile.conf.error_log.push({
            lineno: err.lineno,
            filename: err.filename,
            message: err.message
        });
    }
};

postile.conf.getGlobalKeyHandler.handler = null;


