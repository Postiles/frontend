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
    error_log: [],
    staticResource: function(input) {
        return "/templates/" + input.join("/");
    },
    dynamicResource: function(input) {
        return "http://"+postile.dhost+":"+postile.dport+"/"+input.join("/");
    },
    uploadsResource: function(input) {
        return "http://"+postile.dhost.replace('www', 'static-uploads')+"/"+input.join("/"); // kind of hack
    },
    cssResource: function(input) {
        return "/css/" + input.join("/");
    },
    imageResource: function(input) {
        return "/images/" + input.join("/");
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
    logError: function(e) {
        var err = e.getBrowserEvent();
        if (postile.error_log.length > 40) {
            postile.error_log.splice(0, 20);
        }
        postile.error_log.push({ lineno: err.lineno, filename: err.filename, message: err.message });
    },
    load: function() {
        goog.events.listen(window, goog.events.EventType.ERROR, postile.logError);
        postile.browser_compat.load(); //and that function will call postile.init
    },
    router_map: function() {
        postile.router.map('/test/:id/:port').to(function(){
            window.location.href = '/test/'+this.params["id"]+'/'+window.location.hostname+'/'+this.params["port"];
        });

        postile.router.map('/test/:id/:domain/:port').to(function(){
            postile.dhost = this.params["domain"];
            postile.dport = this.params["port"];
            postile.fayeLocation = 'http://'+postile.dhost+':9292/faye';
            new postile.view.post_board.PostBoard(this.params["id"]);
        });

        postile.router.map('/sign_up').to(function() {
            postile.ui.load(document.body, postile.staticResource(['sign_up.html']));
            postile.view.create_user.init();
        });

        postile.router.map('/login').to(function() {
            postile.ui.load(document.body, postile.staticResource(['login.html']));
        });

        postile.router.map('/_profile_preview').to(function() {
            postile.ui.load(document.body, postile.staticResource(['_profile_preview.html']));
            postile.view.profile.init();
        });

        postile.router.map('/profile/:user_id/edit').to(function() {
            postile.ui.load(document.body, postile.staticResource(['profile_edit.html']));
            postile.view.profile.get_profile_for_edit(this.params["user_id"]);
        });

        postile.router.map('/profile/:user_id').to(function() {
            postile.ui.load(document.body, postile.staticResource(['profile_display.html']));
            postile.view.profile.get_profile(this.params["user_id"]);
        });

        postile.router.map('/renrenlogin').to(function() {
            postile.ui.load(document.body, postile.staticResource(['renren_test.html']));
        });
    }
};

postile.getGlobalKeyHandler.handler = null;
