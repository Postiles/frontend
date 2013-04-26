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
goog.require('postile.view.signup');
//goog.require('postile.view.Sheety');
goog.require('postile.view.tutorial');
goog.require('postile.ui');
goog.require('postile.feedback');
goog.require('postile.log');
goog.require('postile.view.InvitedUserQuickLogin');

/**
 * Exported entry point.
 */
postile.entry.main = function() {
    goog.events.listen(window, goog.events.EventType.LOAD, function() {
        try {
            postile.conf.useragent.load(postile.entry.init);
        } catch (e) {
            postile.conf.logErrorByException(e);
        }
    });
};

/**
 * Dispatch the current route.
 * Originally known as postile.init.
 */
postile.entry.init = function() {
    goog.events.listen(window, goog.events.EventType.ERROR, postile.conf.logErrorByEvent);
    postile.feedback.init();
    if (window.location.hostname == 'localhost'){
        postile.conf.initDbgConfiguration();
    }
    postile.router.init();
    postile.entry.init_router_map();
    if (!goog.userAgent.WEBKIT) {
        postile.router.dispatch(window.location.pathname.substr(1) + window.location.hash);
    }
};


/**
 * Initialize the router map.
 * Originally known as postile.router_map.
 */
postile.entry.init_router_map = function() {
    // postile.router.map['sheet'] = postile.view.Sheety;
    postile.router.map['board'] = postile.view.post_board.PostBoard;
    postile.router.map['login'] = postile.view.login.LoginView;
    postile.router.map['topic'] = postile.view.BoardList;
    postile.router.map['console'] = postile.view.WelcomePage;
    postile.router.map['signup'] = postile.view.signup.SignupView;
    postile.router.map['tutorial'] = postile.view.tutorial.TutorialView;
    postile.router.map['start'] = postile.view.InvitedUserQuickLogin;
};

goog.exportSymbol('postile.entry.main', postile.entry.main);
