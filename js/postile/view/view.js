/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom.domHelper');

/*
this function should be called when using a view. it loads all the stylesheets needed
*/
postile.view.View.prototype.load = function() {
    var i;
    for (i in this.unloadedStylesheets) {
        goog.dom.DomHelper.appendChild(document.getElementsByTagName('head')[0], goog.dom.DomHelper.createDom('link', { type: 'text/css', rel: 'stylesheet', href: 'css/'+this.unloadedStylesheets[i] }));
    }
    this.unloadedStylesheets = [];
}

/*
to use:

"post_board" inherits "view" and have a "unloadedStylesheets" in its PROTOTYPE
*/