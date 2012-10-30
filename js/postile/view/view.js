/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom');

/*
child should implement: unloadedStylesheets
*/
postile.view.View = function() {
    var i;
    for (i in this.unloadedStylesheets) {
        goog.dom.appendChild(document.getElementsByTagName('head')[0], goog.dom.createDom('link', { type: 'text/css', rel: 'stylesheet', href: postile.staticResource(['css',this.unloadedStylesheets[i]]) }));
    }
    this.unloadedStylesheets = [];
}

/*
child should implement: unloadedStylesheets, container
*/
postile.view.PopView = function() {
    postile.view.View.call(this);
	goog.dom.classes.add(this.container, 'pop_popup');
	this.mask = goog.dom.createDom('div', 'pop_mask');
	goog.dom.appendChild(this.mask, this.container);
	goog.dom.appendChild(document.body, this.mask);
	postile.fx.effects.resizeIn(this.container);
}

postile.view.PopView.prototype.close = function() {
	goog.dom.removeNode(this.mask);
}

goog.inherits(postile.view.PopView, postile.view.View);

/*
to use:

"post_board" inherits "view" and have a "unloadedStylesheets" in its PROTOTYPE
*/