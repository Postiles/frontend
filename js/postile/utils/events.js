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

postile.events.valueChangeEvent = function(subject, handler) {
    var currentVal;
    var myHandler = function() {
        if (currentVal == subject.innerHTML) {
            return;
        }
        handler();
        currentVal = subject.innerHTML;
    }
    goog.events.listen(subject, goog.events.EventType.KEYUP, myHandler);
    goog.events.listen(subject, goog.events.EventType.INPUT, myHandler);
    goog.events.listen(subject, goog.events.EventType.CUT, myHandler);
    goog.events.listen(subject, goog.events.EventType.PASTE, myHandler);
}