goog.provide('postile.view.notification');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.notification.Notification = function(input_instance) {
    var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['notification.html']));
    this.container.id = 'notifications_pop_up';
    console.log("notification called");
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.notification.Notification, postile.view.TipView);
postile.view.notification.Notification.prototype.unloaded_stylesheets = ['notification.css'];
