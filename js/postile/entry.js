/**
 * Entrypoint for postile, splitted from boot.js to handle circular dependency.
 */
goog.provide('postile.entry');

goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.conf.useragent');
goog.require('postile.router');
goog.require('postile.user');
goog.require('postile.view.post_board');
goog.require('postile.view.create_user');
goog.require('postile.view.profile');
goog.require('postile.ui');
goog.require('postile.feedback');

/**
 * Exported entry point.
 */
postile.entry.main = function() {
    goog.events.listen(window, goog.events.EventType.LOAD, function() {
        goog.events.listen(window, goog.events.EventType.ERROR, postile.conf.logError);
        postile.entry.init_router_map();
        postile.conf.useragent.load(postile.entry.router_dispatch);
    });
};

/**
 * Dispatch the current route.
 * Originally known as postile.init.
 */
postile.entry.router_dispatch = function() {
    postile.conf.initDbgConfiguration();
    postile.router.init();
};


/**
 * Initialize the router map.
 * Originally known as postile.router_map.
 */
postile.entry.init_router_map = function() {
    postile.router.map['board'] = postile.view.post_board.PostBoard;
    postile.router.map['login'] = postile.view.login.LoginView;
    /*
    postile.router.map('/test/:id/:domain/:port').to(function(){
        postile.conf.dhost = this.params["domain"];
        postile.conf.dport = this.params["port"];
        postile.conf.fayeLocation = 'http://'+postile.conf.dhost+':9292/faye';
        new postile.view.post_board.PostBoard(this.params["id"]);
    });

    postile.router.map('/sign_up').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['sign_up.html']));
        postile.view.create_user.init();
    });

    postile.router.map('/login').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['login.html']));
    });

    postile.router.map('/_profile_preview').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['_profile_preview.html']));
        postile.view.profile.init();
    });

    postile.router.map('/profile/:user_id/edit').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['profile_edit.html']));
        postile.view.profile.get_profile_for_edit(this.params["user_id"]);
    });

    postile.router.map('/profile/:user_id').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['profile_display.html']));
        postile.view.profile.get_profile(this.params["user_id"]);
    });

    postile.router.map('/renrenlogin').to(function() {
        postile.ui.load(document.body, postile.conf.staticResource(['renren_test.html']));
    });
    */
};

goog.exportSymbol('postile.entry.main', postile.entry.main);

