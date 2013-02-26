goog.provide('postile');

goog.require('postile.browser_compat');
goog.require('goog.events.KeyHandler');
goog.require('goog.events');
goog.require('postile.router');
goog.require('postile.user');
goog.require('postile.view.post_board');
goog.require('postile.view.user_admin');
goog.require('postile.ui');

postile = { //the base of posTile frontend framework
    /*
    member functions
    */
    dhost: window.location.hostname,
    dport: 3000,
    fayeLocation: null,
    wrapper: null,
    staticResource: function(input) {
        return "/" + input.join("/");
    },
    dynamicResource: function(input) {
        return "http://"+postile.dhost+":"+postile.dport+"/"+input.join("/");
    },
    getKeyHandler: function() {
        if(!postile.getKeyHandler.handler) { postile.getKeyHandler.handler = new goog.events.KeyHandler(document); }
        return postile.getKeyHandler.handler;
    },
    init: function() {
        postile.wrapper = goog.dom.getElement('wrapper');
        postile.router_map();
        postile.router.rescue(function(){ alert('Bad route.'); });
        postile.router.dispatch(window.location.pathname);
    },
    load: function() {
        postile.browser_compat.load();
    },
    router_map: function() {
        postile.router.map('/test/:id/:port').to(function(){
            window.location.href = '/test/'+this.params["id"]+'/'+window.location.hostname+'/'+this.params["port"];
        });
        postile.router.map('/test/:id/:domain/:port').to(function(){
            postile.ui.load(document.body, postile.staticResource(['post_board.html']));
            postile.dhost = this.params["domain"];
            postile.dport = this.params["port"];
            postile.fayeLocation = 'http://'+postile.dhost+':9292/faye';
            window.pb = new postile.view.post_board.PostBoard(this.params["id"]);
        });
        postile.router.map('/sign_up').to(function() {
            postile.ui.load(document.body, postile.staticResource(['sign_up.html']));
            postile.view.user_admin.create_user.init();
        });
        postile.router.map('/login').to(function() {
            postile.ui.load(document.body, postile.staticResource(['login.html']));
        });
    }
};

postile.getKeyHandler.handler = null;
