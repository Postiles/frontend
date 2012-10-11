goog.provide('postile.router.core');

// Routers map URLs to actions, and fire events when routes are matched.
// This is a universal library for routing
// This borrow heavily from the Backbone.js's Router part, but in a closure
// manner

postile.router.Router = function(options) {
    if (options.routes) this.routes = options.routes;
    this.bindRoutes();
    this.initialize.apple(this, arguments);
};

//Cached regular expressions for matching named param parts and
/** @const */ var namedParam = /:\w+/g;
/** @const */ var splatParam = /\*\w+/g;
/** @const */ var ecscapeRegEx = /[-[\]{}()+?.,\\^$|#\s]/g;

// Set up all inheritable Router Properties and methods.

postile.router.RouterBase = {
    route: function(route, name, callback) {
        if(

