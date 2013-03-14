goog.provide('postile.events');

goog.require('goog.events');

postile.events.EventHandler = function(subject, action, handler, usecapture) {
    this.subject = subject;
    this.action = action;
    this.handler = handler;
    this.usecapture = usecapture ? true : false;
}

postile.events.EventHandler.prototype.listen = function() {
    goog.events.listen(this.subject, this.action, this.handler, this.usecapture);
}

postile.events.EventHandler.prototype.unlisten = function() {
    goog.events.unlisten(this.subject, this.action, this.handler, this.usecapture);
}