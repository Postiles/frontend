goog.provide('postile.router');

// Routers map URLs to actions, and fire events when routes are matched.
// This is a universal library for routing
// The code is borrow heavily from 'mtrpcic/pathjs'
//
postile.router = {
    /**
     * @param{srting} path The pattern to be routed
     * @return route a routing object
     */
    map:function(path) {
        if(postile.router.routes.defined.hasOwnProperty(path)) {
            return postile.router.routes.defined[path];
        } else {
            return new postile.router.core.route(path);
        }
    },

    /**
     * If a user were to land on your page without a route defined, you can force the them to use a root route.
     * This route will be automatically selected on page load
     * @param{string} path
     */
    root:function(path){
        postile.router.routes.root = path;
    },

    rescue:function(fn){ // a function call when no solution found
        postile.router.routes.rescue = fn;
    },

    /**
     * Dealing with HTML push state
     */
    history:{
        initial: {}, // Empty container for "Initial Popstate" checking variable.
        pushState: function(path) {
            if(postile.router.history.supported) {
                if(postile.router.dispatch(path)) {
                    window.history.pushState({}, "Postile", path);
                }
            } else {
                if(postile.router.history.fallback) {
                    //window.location.hash = "#" + path;
                    window.location.href = path;
                }
            }
        },
        popState: function(event) {
            var initialPop = !postile.router.history.initial.poped && location.href == postile.router.history.initial.URL;
            postile.router.history.initial.popped = true;
            //If currently is initial pop, we give the browser to handle the return
            if(initialPop) return;
            postile.router.dispatch(document.location.pathname);
        },
        listen:function(fallback) {

            postile.router.history.supported = !!(window.history && window.history.pushState);
            postile.router.history.fallback = fallback;

            if(postile.router.history.supported) {
                postile.router.history.initial.popped = ('state' in window.history), postile.router.history.initial.URL = location.href;
                window.onpopstate = postile.router.history.popState;
            } else {
                if(postile.router.history.fallback) {
                    for(route in postile.router.routes.defined) {
                        //If it doesn't support pushState, we add the hash to it and assign the same route
                        //as the pushState version
                        if(route.charAt(0) != "#") {
                            postile.router.routes.defined["#"+route] = postile.router.routes.defined[route];
                            postile.router.routes.defiend["#"+route].path = "#"+route;
                        }
                    }
                    postile.router.listen();
                }
            }
        }
    },

    /**
     * Ugly function for pattern matching
     * Match a string path to a defined route
     * @param{bool} parameterize
     * @param{string} path
     */
    match:function(path, parameterize) {
        var params = {}, route = null, possible_route, slice, i, j, compare;
        for(route in postile.router.routes.defined) {
            if(route!==null && route !== undefined) {
                route = postile.router.routes.defined[route];
                //divide the basic parts and optional parameters, 0 is basic part
                possible_routes = route.partition();
                for(j = 0; j < possible_routes.length; j++) {
                    slice = possible_routes[j];
                    //The thing to be compared to
                    compare = path;
                    if(slice.search(/:/) > 0) {
                        for(i = 0; i < slice.split("/").length; i++) {
                            if((i <compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
                                params[slice.split('/')[i].replace(/:/,'')] = compare.split("/")[i];
                                compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
                            }
                        }
                    }
                    if (slice == compare) {
                        if(parameterize) {
                            route.params = params;
                        }
                        return route;
                    }
                }
            }
        }
        return null;

    },
    /**
     * Dispatch the routing
     * Match a URL to a predefined route and do the function
     * corresponding to it.
     */
    dispatch:function(passed_route) {
        var previous_route, matched_route;
        //We only need to do the routing when the passed_route is different from
        //The route we already in
        if(postile.router.routes.current !== passed_route) {
            //Recording the history
            postile.router.routes.previous = postile.router.routes.current;
            postile.router.routes.current = passed_route;
            //Do the matching of the route
            matched_route = postile.router.match(passed_route, true);
            //If it there is some path currently, we need some to execute the
            //exit function for it
            if(postile.router.routes.previous) {
                //match a string to a route obj defined
                previous_route = postile.router.match(postile.router.routes.previous);
                if(previous_route != null && previous_route.do_exit !== null) {
                    previous_route.do_exit();
                }
            }
            //Routing the current match, if no matched, run rescue
            if(matched_route!==null) {
                matched_route.run();
                return true;
            } else {
                if(postile.router.routes.rescue !== null) {
                    postile.router.routes.rescue();
                }
            }
        }
    },
    listen: function(){
        if(location.hash === ""){
            if (postile.router.routes.root !== null) {
                location.hash = postile.router.routes.root;
            }
        }

        var fn = function() {
            /**
             * Dispatch from the location.hash
             * e.g. http://www.example.com/test.html#part2
             * location.hash will be #part2
             */
            postile.router.dispatch(location.hash);
        }
        
        /*
        // document.documentMode ensures that the router fires the right events, even in IE =_=!
        if("onhashchange" in window &&(!document.documentMode || document.documentMode >= 8)) {
            window.onhashchange = fn;
        } else {
            //If IE 7  or IE 6, sorry, check the hash every 50ms, stupid IE
            setInterval(fn, 50);
        }

        if(location.hash !== "") {
            postile.router.dispatch(location.hash);
        }
        */

    },

    core:{
        /**
         * @class route
         * A routing object. The object that the map() funciton may return
         */
        route:function(path) {

            /** @type{string}*/       this.path = path;
            /** @type{function(*)} */ this.action = null;
            /** @type{functio()}*/    this.do_enter = [];
            /** @type{function(*)} */ this.do_exit = null;

            /**
             * Parameter of the route
             * E.g. Parameters "/users/:name", will match "#users/mike" or "#users/27"
             * E.g. Dynamic Routes"#/users(/:user_id)", wrapping the non-mandatory components in parentheses.
             * Access params with this.params object.
             * @type{Array<string>}
             */
            this.params = {};
            postile.router.routes.defined[path] = this;
        }
    },
    routes: {
        current  : null,
        root     : null,
        previous : null,
        //The routes that have been defined..
        defined :{}
    }
};

//Define the public function of route object
postile.router.core.route.prototype = {
    /**
     * @param{funciton():route}
     */
    to:function(fn) {
        this.action = fn;
        return this;
    },
    /**
     * An array of function or a single function that will be called at the before a route is activated
     * @param{Array.<function()>|function()}
     */
    enter:function(fns) {
        if(fns instanceof Array) {
            this.do_enter = this.do_enter.concat(fns);
        } else {
            this.do_enter.push(fns);
        }
        return this;
    },
    /**
     * @param{function()}
     * The function that will be called
     */
    exit:function (fn) {
        this.do_exit = fn;
        return this;
    },

    /**
     * Divide the basic part and the optional parameter part and put them options
     */
    partition: function() {
        var parts =[], options = [], text, i;
        /**
         * [^}] -- The character that is not closed bracket
         * + -- Matches preceding character (anything that is not bracket)
         * ? -- disable the greedy, matching the least number
         * () -- Remember the match, the matched substring can be recalled from the resulting array's elements [1],...[n]
         * \( -- Looking for parenthesis
         *
         * So the whole thing, anything between parenthenthesis, that is not close bracket
         *
         */
        var re=/\(([^}]+?)\)/g;

        //Push anything except close bracket inside parenthesis into parts.
        while(text = re.exec(this.path)) {
            parts.push(text[1]);
        }

        //The part that before optional parameters
        options.push(this.path.split("(")[0]);
        //Push in the optional parameters (the parameters inside the parentheses.)
        for(i = 0; i < parts.length; i++) {
            options.push(options[options.length - 1] + parts[i]);
        }
        return options;
    },
    /**
     * Run the functions in the do_enter
     */
    run:function() {
        var halt_execution = false, i, result, previous;

        //If the route has do_enter function, called it first
        if(postile.router.routes.defined[this.path].hasOwnProperty("do_enter")) {
            if(postile.router.routes.defined[this.path].do_enter.length > 0) {
                for(i = 0; i < postile.router.routes.defined[this.path].do_enter.length; i++) {
                    result = postile.router.routes.defined[this.path].do_enter[i].apply(this, null);
                    if(result === false) {
                        halt_execution = true;
                        break;
                    }
                }
            }
        }
        //Do the function defined in to
        if(!halt_execution) {
            postile.router.routes.defined[this.path].action();
        }
    }
};
