/*view.js*/

goog.provide('postile.view');

goog.require('goog.dom');


postile.view.View = function() {
    var i;
    for (i in this.unloadedStylesheets) {
        goog.dom.appendChild(document.getElementsByTagName('head')[0], goog.dom.createDom('link', { type: 'text/css', rel: 'stylesheet', href: '/css/'+this.unloadedStylesheets[i] }));
    }
    this.unloadedStylesheets = [];
}

/*
to use:

"post_board" inherits "view" and have a "unloadedStylesheets" in its PROTOTYPE
*/