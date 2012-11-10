/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom');
goog.require('postile.fx.effects');

/*
child should implement: unloadedStylesheets
*/
postile.view.View = function() {
    var i;
    var instance = this;
    var reClosure = function(index) {
        return (function(e) { instance.global_handlers[index].handler(instance, e); });
    }
    for (i in this.unloaded_stylesheets) {
        goog.dom.appendChild(document.getElementsByTagName('head')[0], goog.dom.createDom('link', { type: 'text/css', rel: 'stylesheet', href: postile.staticResource(['css',this.unloaded_stylesheets[i]]) }));
    }
    for (i in this.global_handlers) {
        if (!this.global_handlers[i].reclosured) {
            this.global_handlers[i].reclosured = reClosure(i);
        }
        switch(this.global_handlers[i].handler) {
            case 'window':
                this.global_handlers[i].processed_subject = window;
                break;
            case 'keyboard':
                this.global_handlers[i].processed_subject = postile.getKeyHandler();
                break;
            default:
                return;
        }   
        if (this.global_handlers[i].subject == null) { this.global_handlers[i].subject = postile.globalKeyHandler; }
        goog.events.listen(this.global_handlers[i].processed_subject, this.global_handlers[i].action, this.global_handlers[i].reclosured_handler);
    }
    this.unloadedStylesheets = [];
}

postile.view.View.prototype.exit = function() {
    var i;
    var subject;
    for (i in this.global_handlers) {    
        goog.events.unlisten(this.global_handlers[i].processed_subject, this.global_handlers[i].action, this.global_handlers[i].reclosured_handler);
    }
}

/*
child should implement: unloadedStylesheets, container
*/
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
    this.exit();
}

/*
to use:

"post_board" inherits "view" and have a "unloadedStylesheets" in its PROTOTYPE
*/