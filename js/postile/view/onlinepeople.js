goog.provide('postile.view.onlinepeople');
goog.require('postile.conf');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.view');

postile.view.onlinepeople.OnlinePeople = function(header) {
    console.log("OnlinePeople view");
    //inherits TipView
    postile.view.TipView.call(this);
    postile.ui.load(this.container,
            postile.conf.staticResource(['_onlinepeople.html']));
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.shown = false;
    this.expanded = false;
}

goog.inherits(postile.view.onlinepeople.OnlinePeople, postile.view.TipView);

postile.view.onlinepeople.OnlinePeople.prototype.open = function(a,b) {
    if(!this.showen) {
        postile.view.TipView.prototype.open.call(this, a,b);
        this.shown  = true;
    }
}
