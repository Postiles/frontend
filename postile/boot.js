goog.provide('postile');

postile = { //the base of posTile frontend framework
    /*
    member functions
    */
    staticResource: function() {
        return "/"+arguments.join("/");
    },
    dynamicResource: function() {
        //TODO: specified the url on dynamic server
    },
    init: function() {
        //router?
    }
};