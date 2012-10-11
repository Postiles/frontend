goog.provide('postile.router');

// Routers map URLs to actions, and fire events when routes are matched.
// This is a universal library for routing
// The code is borrow heavily from 'mtrpcic/pathjs'
//
postile.router.Router = {
    /**
     * @param{srting} path The pattern to be routed
     * @return route a routing object
     */
    map:function(path) {
        if(postile.router.Router.routes.defined.hasProperty(path)) {
            return postile.router.Router.routes.defined[path];
        } else {
            return new postile.router.Router.coure.route(path);
        }
    },
    match:function(path, parameterize) {

    },
    core:{
        /**
         * @class route
         * A routing object. The object that the map() funciton may return
         */
        route:function(path) {
            this.path = path;
            this.action = null;
            this.do_enter = [];
            this.params = {};
            postile.router.Router.routes.defined[path] = this;
        }
    },
    routes:{
        current:null,
        root:null,
        previous:null,
        //The routes that have been defined..
        defiend:{}
    }
};

//Define the public function of route object
postile.router.Router.core.route.prototype = {
    /**
     * @param{funciton():route}
     */
    to:function(fn) {
        this.action - fun;
        return this;
    },
    /**
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
     */
    exit:function (fn) {
        this.do_exit = fn;
        return this;
    },
    /**
     * @param{function:Array.<string>}
     */
    partition: function() {
        var parts =[], options = [], re=/\(([^]+?\)\)/g, text, i;
        //Split the parts into an array, by matching the regex
        while(text = re.exec(this.path)) {
            parts.push(text[1]);
        }

        options.push(this.path.split("(")[0]);
        //concat the parts into options
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

        if(postile.router.Router.routes.defined[this.path].hasOwnProperty("do_enter")) {
            if(postile.router.Router.routes.defined[this.path].do_enter.length > 0) {
                for(i = 0; i < postile.router.Router.routes.defined[this.path].do_enter.length; i++) {
                    result = postile.router.Router.routes.defined[this.path].do_enter[i].apply(this, null);
                    if(result === false) {
                        halt_execution = true;
                        break;
                    }

                }
            }
        }
        if(!halt_execution) {
            postile.router.Router.routes.defined[this.path].action();
        }
    }
};










