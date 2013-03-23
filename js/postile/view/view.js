/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom');
goog.require('postile.events');
goog.require('postile.fx.effects');
goog.require('goog.style');

/*
=== How to create a normal view ===

1. have a class inherits "positle.view.NormalView".
2. [optional, only when you need to load css] have a "unloaded_stylesheets" in its prototype, which is an array containing css files that need to be loaded.

just put your fucking things into this.container, and use "open" and "close" if needed

=== How to create a pop-up view ===

1. have a class inherits "postile.view.PopView".
2. the same as normal view.

just put your fucking things into this.container, and use "open" and "close" if needed

=== How to create a fullscreen view ===

1. have a class inherits "postile.view.FullScreenView", and use "html_segment" property to represent the HTML that need to be loaded into document.body
2. have a "close" method as destrcutor if needed
3. the same as normal view

=== How to create a tip view ===

1.  have a class inherits "postile.view.TipView".
2. the same as normal view

just put your fucking things into this.container, and use "open" and "close" if needed. 

the "open: functon will receive a parameter indicating the reference element and container element of the tip view. If the reference element is not set, the parent element of the reference element will be used

directly set "container.style.left" and "container.style.top" to further offset the container

*/

postile.loaded_stylesheets = {};

postile.current_full_screen = null;

postile.view.View = function() { //Do not use this class directly (this is an abstract class)
    var i;
    var instance = this;
    if (this.unloaded_stylesheets) {
        for (i in this.unloaded_stylesheets) {
            if (!(this.unloaded_stylesheets[i] in postile.loaded_stylesheets)) {
                postile.loaded_stylesheets[this.unloaded_stylesheets[i]] = true;
                goog.dom.appendChild(document.getElementsByTagName('head')[0], goog.dom.createDom('link', { type: 'text/css', rel: 'stylesheet', href: postile.cssResource([this.unloaded_stylesheets[i]]) }));
            }
        }
    }
    this.unloadedStylesheets = [];
    if (this.urlHash) {
        window.location.hash = '#' + this.urlHash;
    }
}

postile.view.PopView = function() { // constructor
    postile.view.View.call(this);
    this.container = goog.dom.createDom('div', 'pop_container');

    this.container_wrap = goog.dom.createDom('div');
    goog.dom.classes.add(this.container_wrap, 'pop_popup');
    goog.dom.appendChild(this.container_wrap, this.container);
    this.mask = goog.dom.createDom('div', 'pop_mask');

    /* handle outside click event */
    goog.events.listen(this.mask, goog.events.EventType.CLICK, function(e) {
        console.log(e.target);
    }.bind(this));

    this.mask.style.position = 'absolute';
    this.mask.style.top = '0px';

    goog.dom.appendChild(this.mask, this.container_wrap);
}

goog.inherits(postile.view.PopView, postile.view.View);

postile.view.PopView.prototype.open = function(width) {
    if (!width || width > document.body.clientWidth) { // not specified or too large for screen
        this.container.style.width = document.body.clientWidth + 'px';
    } else {
        this.container.style.width = width + 'px';
    }

    goog.dom.appendChild(document.body, this.mask);
    postile.fx.effects.resizeIn(this.container);
    postile.fx.Animate(function(i) { this.mask.style.opacity = i; }.bind(this), 400);

    this.esc = this.escPressed.bind(this); // create a binded function for removing events
    goog.events.listen(document, goog.events.EventType.KEYUP, this.esc);
}
    
postile.view.PopView.prototype.close = function() {
    goog.dom.removeNode(this.mask);
    goog.events.unlisten(document, goog.events.EventType.KEYUP, this.esc);
}

postile.view.PopView.prototype.escPressed = function(e) {
    if (e.keyCode == 27) { // esc pressed
        this.close();
    }
}

postile.view.FullScreenView = function() {
    if (postile.current_full_screen && postile.current_full_screen.close) {
        postile.current_full_screen.close(); //destruct the original fullscreenview
    }
    postile.current_full_screen = this;
    postile.view.View.call(this);
    this.container = document.body;
    postile.ui.load(this.container, this.html_segment);
}

goog.inherits(postile.view.FullScreenView, postile.view.View);

postile.view.TipView = function() {
    var instance = this;
    var should_close = false;
    postile.view.View.call(this);
    this.container = goog.dom.createDom('div');
    this.container.style.position = 'absolute';
    this.container_wrap = goog.dom.createDom('div');
    this.container_wrap.style.position = 'absolute';
    goog.dom.appendChild(this.container_wrap, this.container);
    this.global_msd_handler = new postile.events.EventHandler(document.body, goog.events.EventType.MOUSEDOWN, function(){
        should_close = true;
        instance.close();
    });
    this.global_click_handler = new postile.events.EventHandler(document.body, goog.events.EventType.CLICK, function(evt){
        if (should_close) { instance.global_click_handler.unlisten(); }
        evt.stopPropagation();
    }, true);
    this.container_msd_handler = new postile.events.EventHandler(this.container, goog.events.EventType.MOUSEDOWN, function(evt){
        evt.stopPropagation();
    });
}

goog.inherits(postile.view.TipView, postile.view.View);

postile.view.TipView.prototype.open = function(reference, parent) {
    if (!parent) { parent = reference.parentNode; }
    var coord = goog.style.getRelativePosition(reference, parent);
    goog.style.setPosition(this.container_wrap, coord);
    goog.dom.appendChild(parent, this.container_wrap);
    this.global_msd_handler.listen();
    this.global_click_handler.listen();
    this.container_msd_handler.listen();
}

postile.view.TipView.prototype.close = function() {
    this.global_msd_handler.unlisten();
    this.container_msd_handler.unlisten();
    goog.dom.removeNode(this.container_wrap);
}

postile.view.NormalView = function() {
    postile.view.View.call(this);
    this.container = goog.dom.createDom('div');
}

postile.view.NormalView.prototype.close = function() { 
    goog.dom.removeNode(this.container);
}

goog.inherits(postile.view.NormalView, postile.view.View);
