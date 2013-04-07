goog.provide('postile.view.onlinepeople');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');

postile.view.onlinepeople.OnlinePeople = function(header) {
    this.title_bar = header;
    //inherits TipView
    postile.view.TipView.call(this);
    postile.ui.load(this.container,
            postile.conf.staticResource(['_onlinepeople.html']));
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.expanded = false;
}

goog.inherits(postile.view.onlinepeople.OnlinePeople, postile.view.TipView);

postile.view.onlinepeople.OnlinePeople.prototype.render = function() {
}
