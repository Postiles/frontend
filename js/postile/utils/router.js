goog.provide('postile.router');

goog.require('postile.view.WelcomePage');
goog.require('postile.view.Sheety');
goog.require('goog.events');

/**
 * Initialize
 */
postile.router.init = function() {
    goog.events.listen(window, goog.events.EventType.POPSTATE, function() {
        postile.router.execute(document.location.pathname.substr(1));
    });
} 

/**
 * Always use this function to create a FullScreenView.
 * @param {string} route the actual url to map.
 */
postile.router.dispatch = function(route) {
    console.log('dispatch', route);
    var splitted = route.split('#', 1);
    history.pushState(splitted[1], null, '/' + route);
    postile.router.execute(splitted[0]);
}

/**
 * @private
 * @param {string} route the actual url to map.
 */
postile.router.execute = function(route) {
    console.log('execute', route);
    var args = route.split('/');
    var kwd = args.shift();
    if (kwd in postile.router.map) { //route found
        postile.router.current_view = new (Function.prototype.bind.apply(postile.router.map[kwd], [null].concat(args)));
    } else { //rescue
        postile.router.dispatch("topic/1");
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
