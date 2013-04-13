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
goog.require('postile.view.BoardList');
goog.require('postile.view.create_user');
goog.require('postile.view.profile');
goog.require('postile.ui');
goog.require('postile.feedback');
goog.require('postile.log');

/**
 * Exported entry point.
 */
postile.entry.main = function() {
    goog.events.listen(window, goog.events.EventType.LOAD, function() {
        goog.events.listen(window, goog.events.EventType.ERROR, postile.conf.logError);
        postile.conf.useragent.load(postile.entry.router_dispatch);
    });
};

/**
 * Dispatch the current route.
 * Originally known as postile.init.
 */
postile.entry.router_dispatch = function() {
    postile.log.i('router_dispatch');
    postile.conf.initDbgConfiguration();
    postile.router.init();
    postile.entry.init_router_map();
    if (!goog.userAgent.WEBKIT) {
        postile.router.dispatch(window.location.pathname.substr(1));
    }
};


/**
 * Initialize the router map.
 * Originally known as postile.router_map.
 */
postile.entry.init_router_map = function() {
    postile.router.map['board'] = postile.view.post_board.PostBoard;
    postile.router.map['login'] = postile.view.login.LoginView;
    postile.router.map['topic'] = postile.view.BoardList;
};

goog.exportSymbol('postile.entry.main', postile.entry.main);
