goog.provide('postile.view.post');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.post.PostExpand = function(post, username) { // constructor
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_post_expand.html']));

    this.postData = post;

    this.post_el = goog.dom.getElementByClass('post-expand', this.container);

    /* set the dom according to data */
    this.title_el = goog.dom.getElementByClass('title', this.post_el);
    this.title_el.innerHTML = post.title;

    this.author_el = goog.dom.getElementByClass('author', this.post_el);
    this.author_el.innerHTML = username;

    this.content_el = goog.dom.getElementByClass('content', this.post_el);
    this.content_el.innerHTML = post.text_content;

    this.closeButton_el = goog.dom.getElementByClass('close-button', this.post_el);
    goog.events.listen(this.closeButton_el, goog.events.EventType.CLICK, function(e) {
        this.close();
    }.bind(this));

    this.open(1165);
}

goog.inherits(postile.view.post.PostExpand, postile.view.PopView);

postile.view.post.PostExpand.prototype.unloaded_stylesheets = ['_post_expand.css'];
