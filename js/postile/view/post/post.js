goog.provide('postile.view.post');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.post.PostExpand = function(data) { // constructor
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_post_expand.html']));

    this.open(1165);
}

goog.inherits(postile.view.post.PostExpand, postile.view.PopView);

postile.view.post.PostExpand.prototype.unloaded_stylesheets = ['_post_expand.css'];
