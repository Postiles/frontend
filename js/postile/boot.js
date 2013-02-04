goog.provide('postile');

goog.require('postile.browser_compat');
goog.require('goog.events.KeyHandler');
goog.require('goog.events');
goog.require('postile.router');
goog.require('postile.user');
goog.require('postile.view.post_board');
goog.require('postile.view.user_admin');

postile = { //the base of posTile frontend framework
    /*
    member functions
    */
    staticResource: function(input) {
        return "/"+input.join("/");
    },
    dynamicResource: function(input) {
        return "http://"+window.location.hostname+":"+postile.dport+"/"+input.join("/");
    },
    getKeyHandler: function() {
        if(!postile.getKeyHandler.handler) { postile.getKeyHandler.handler = new goog.events.KeyHandler(document); }
        return postile.getKeyHandler.handler;
    },
    fayeLocation: 'http://'+window.location.hostname+':9292/faye',
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
            document.body.innerHTML = '<center>Please use <a href="/test/3/300">/test/3/300</a> to enter demo now. Note that "3" can be changed to other topic IDs and 300 should be changed to real port number.</center>';
        });
        postile.router.map('/test/:id/:port').to(function(){
            postile.dport = this.params["port"];
            window.pb = new postile.view.post_board.PostBoard(this.params["id"]);
        });
        postile.router.map('/sign_up').to(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/sign_up.html', false);
            xhr.send();
            if (xhr.status == 200) {
                document.body.innerHTML = xhr.responseText;
            }
        });
        postile.router.map('/topic_board').to(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/topic_board.html', false);
            xhr.send();
            if (xhr.status == 200) {
                document.body.innerHTML = xhr.responseText;
            }
        });
    }
};

postile.getKeyHandler.handler = null;
