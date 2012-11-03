goog.provide('postile');

goog.require('postile.browser_compat');
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
        return "http://localhost:3000/"+input.join("/");
    },
    init: function() {
        postile.router_map();
        postile.router.rescue(function(){ alert('Bad route.'); });
        postile.router.dispatch(window.location.pathname);
    },
    load: function() {
        postile.browser_compat.load();
    },
    router_map: function() {
        postile.router.map('/test').to(function(){ 
            var pb = new postile.view.post_board.PostBoard();
            pb.renderArray([
                { id: 128, coord_x: -1, coord_y: -3, span_x: 2, span_y: 2, content: '<b style="font-size: 20px">You can drag the canvas till you reach the boundary</b>' }, //each one stand for a post
                { id: 111, coord_x: -1, coord_y: -1, span_x: 2, span_y: 1, content: '<a onclick="postile.user.openLoginBox();">LOGIN</a>' },
                { id: 198, coord_x: -2, coord_y: -2, span_x: 1, span_y: 2, content: "dummy content for block 3" },
                { id: 256, coord_x: 1, coord_y: -4, span_x: 2, span_y: 2, content: "dummy content for block 4" },
                { id: 280, coord_x: 0, coord_y: 0, span_x: 1, span_y: 3, content: "dummy content for block 5" },
                { id: 310, coord_x: -2, coord_y: 2, span_x: 2, span_y: 2, content: "dummy content for block 6" },
                { id: 317, coord_x: 1, coord_y: 0, span_x: 3, span_y: 3, content: '<b style="font-size: 24px; color: #C00">You can try to RIGHT click on blank places</b>' },
                { id: 319, coord_x: -5, coord_y: -3, span_x: 3, span_y: 2, content: "dummy content for block 8" }
            ]);
        });
    }
};