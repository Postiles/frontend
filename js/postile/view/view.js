/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom');
goog.require('postile.fx.effects');

/*
How to create a normal view:

1. have a class inherits "positle.view.View".
2. [optional, only when you need to load css] have a "unloaded_stylesheets" in its prototype, which is an array containing css files that need to be loaded.
3. [optional, only when you need to listen to global events] have a "global_handlers" array in its prototype.
4. [optional, only when you need to have something done on exiting] have a "on_exit" function, which will be called when leaving the view

How to create a pop-up view:

1. have a class inherits "postile.view.PopView".
2-4. the same as normal view.
*/

postile.view.View = function() {
    var i;
    var instance = this;
    var reClosure = function(index) {
        return (function(e) { instance.global_handlers[index].handler(instance, e); });
    }
    if (this.unloaded_stylesheets) {
        for (i in this.unloaded_stylesheets) {
            goog.dom.appendChild(document.getElementsByTagName('head')[0], goog.dom.createDom('link', { type: 'text/css', rel: 'stylesheet', href: postile.staticResource(['css',this.unloaded_stylesheets[i]]) }));
        }
    }
    this.unloadedStylesheets = [];
}

postile.view.PopView = function() {
    postile.view.View.call(this);
    this.container = goog.dom.createDom('div', 'pop_container');
}

goog.inherits(postile.view.PopView, postile.view.View);

postile.view.PopView.prototype.open = function(width) {
    var mask;
    this.container.style.width = width + 'px';
    this.container_wrap = goog.dom.createDom('div');
    goog.dom.classes.add(this.container_wrap, 'pop_popup');
    mask = this.mask = goog.dom.createDom('div', 'pop_mask');
    goog.dom.appendChild(this.container_wrap, this.container);
    goog.dom.appendChild(this.mask, this.container_wrap);
    goog.dom.appendChild(document.body, this.mask);
    postile.fx.effects.resizeIn(this.container);
    postile.fx.Animate(function(i) { mask.style.opacity = i; }, 400);
}
    
postile.view.PopView.prototype.close = function() {
    goog.dom.removeNode(this.mask);
}