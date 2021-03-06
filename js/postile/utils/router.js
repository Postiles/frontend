goog.provide('postile.router');

goog.require('goog.events');

goog.require('postile.ajax');
goog.require('postile.view.WelcomePage');
goog.require('postile.view.Sheety');
goog.require('postile.view.switchToPost');

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
    var splitted = route.split('#', 1);
    history.pushState(splitted[1], null, '/' + route);
    postile.router.execute(splitted[0]);
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
        postile.router.dispatch("login");
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

/**
 * Implements the default post switcher
 */
postile.view.switchToPost.defaultSwitcher = function(postId) {
    postile.ajax(['post', 'get_post'], {
        post_id: postId
    }, function(r) {
        postile.router.dispatch('board/' +
            r.message.post.board_id + "#" + postId);
    });
};

