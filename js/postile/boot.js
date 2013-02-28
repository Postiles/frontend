goog.provide('postile');

goog.require('postile.browser_compat');
goog.require('goog.events.KeyHandler');
goog.require('goog.events');
goog.require('postile.router');
goog.require('postile.user');
goog.require('postile.view.post_board');
goog.require('postile.view.create_user');
goog.require('postile.view.profile');
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
    getGlobalKeyHandler: function() {
        if(!postile.getGlobalKeyHandler.handler) { postile.getGlobalKeyHandler.handler = new goog.events.KeyHandler(document); }
        return postile.getGlobalKeyHandler.handler;
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
            postile.view.create_user.init();
        });
        postile.router.map('/login').to(function() {
            postile.ui.load(document.body, postile.staticResource(['login.html']));
        });
        postile.router.map('/profile/:user_id').to(function() {
            postile.ui.load(document.body, postile.staticResource(['profile.html']));
            postile.view.profile.get_profile(this.params["user_id"]);
        });
    }
};

postile.getGlobalKeyHandler.handler = null;
