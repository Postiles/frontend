goog.provide('postile.events');

goog.require('goog.events');

postile.events.EventHandler = function(subject, action, handler) {
    this.subject = subject;
    this.action = action;
    this.handler = handler;
}

postile.events.EventHandler.prototype.listen = function() {
    goog.events.listen(this.subject, this.action, this.handler);
}

postile.events.EventHandler.prototype.unlisten = function() {
    goog.events.unlisten(this.subject, this.action, this.handler);
}