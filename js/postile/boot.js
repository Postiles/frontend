goog.provide('postile');

goog.require('postile.browser_compat');
goog.require('goog.events.KeyHandler');
goog.require('goog.events');
goog.require('postile.router');
goog.require('postile.user');
goog.require('postile.view.post_board');

postile = { //the base of posTile frontend framework
    /*
    member functions
    */
    staticResource: function(input) {
        return "/"+input.join("/");
    },
    dynamicResource: function(input) {
        return "http://"+window.location.hostname+":3000/"+input.join("/");
    },
    getKeyHandler: function() {
        if(!postile.getKeyHandler.handler) { postile.getKeyHandler.handler = new goog.events.KeyHandler(document); }
        return postile.getKeyHandler.handler;
    },
    fayeLocation: 'http://localhost:9292/faye',
    wrapper: null,
    init: function() {
        postile.wrapper = goog.dom.getElement('wrapper');
        postile.router_map();
        postile.router.rescue(function(){ alert('Bad route.'); });
        postile.router.dispatch(window.location.pathname);
    },
    load: function() {
        postile.browser_compat.load();
    },
    router_map: function() {
        postile.router.map('/test').to(function(){
            document.body.innerHTML = '<center>Please use <a href="/test/3">/test/3</a> to enter demo now. Note that "3" can be changed to other topic IDs.</center>';
        });
        postile.router.map('/test/:id').to(function(){
            window.pb = new postile.view.post_board.PostBoard(this.params["id"]);
            window.pb.renderArray([
                { id: 111, coord_x: 4, coord_y: 2, span_x: 2, span_y: 1, text_content: '<a onclick="postile.user.openLoginBox();">LOGIN</a>' }
            ]);
        });
    }
};

postile.getKeyHandler.handler = null;