goog.provide('postile');

goog.require('postile.test');
goog.require('postile.browser_compat');
goog.require('goog.events');
goog.require('postile.router');

postile = { //the base of posTile frontend framework
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
        postile.test.init();
    },
    load: function() {
        postile.browser_compat.load();
    }
};

