goog.provide('postile.router');

goog.require('postile.view.WelcomePage');
goog.require('goog.history.Html5History');
goog.require('goog.events');

/**
 * @type {goog.history.Html5History}
 */
postile.router.googHistoryObj = null;

/**
 * @see postile.entry.main
 */
postile.router.init = function() {
    postile.router.googHistoryObj = new goog.history.Html5History();
    postile.router.googHistoryObj.setUseFragment(false);
    postile.router.googHistoryObj.setPathPrefix('/');
    postile.router.googHistoryObj.setEnabled(true);
    goog.events.listen(postile.router.googHistoryObj, goog.history.EventType.NAVIGATE, function(e) {
        postile.router.execute(e.token);
    });
    postile.router.execute(window.location.pathname.substr(1));
}

/**
 * Always use this function to create a FullScreenView.
 * @param {string} route the actual url to map.
 */
postile.router.dispatch = function(route) {
    postile.router.googHistoryObj.setToken(route);
}

/**
 * @private
 * @param {string} route the actual url to map.
 */
postile.router.execute = function(route) {
    var args = route.split('/');
    var kwd = args.shift();
    if (kwd in postile.router.map) { //route found
        postile.router.current_view = new (Function.prototype.bind.apply(postile.router.map[kwd], [null].concat(args)));
    } else { //rescue
        postile.router.current_view = new postile.view.WelcomePage();
    }
}

/**
 * @type {postile.view.FullScreenView}
 */
postile.router.current_view = null;

/**
 * @type {Object.<string, constructor>}
 */
postile.router.map = {};