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

postile.events.ValueChangeEvent = function(subject, handler) {
    var currentVal;
    var myHandler = function(e) {
        if (currentVal == subject.innerHTML) {
            return;
        }
        handler(e);
        currentVal = subject.innerHTML;
    }
    this.listeners = [new postile.events.EventHandler(subject, goog.events.EventType.KEYUP, myHandler),
    new postile.events.EventHandler(subject, goog.events.EventType.INPUT, myHandler),
    new postile.events.EventHandler(subject, goog.events.EventType.CUT, myHandler),
    new postile.events.EventHandler(subject, goog.events.EventType.PASTE, myHandler)];
}

postile.events.ValueChangeEvent.prototype.listen = function() {
    for (var i in this.listeners) { this.listeners[i].listen(); }
}

postile.events.ValueChangeEvent.prototype.unlisten = function() {
    for (var i in this.listeners) { this.listeners[i].unlisten(); }
}