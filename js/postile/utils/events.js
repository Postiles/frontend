goog.provide('postile.events');

goog.require('goog.events');
goog.require('goog.array');

/**
 * Make an event handler that can be toggled on or off.
 * @constructor
 * @param {Element} subject The dom element to attach to
 * @param {string} action Event type
 * @param {Function} handler
 * @param {boolean} usecapture
 */
postile.events.EventHandler = function(subject, action, handler, usecapture) {
    this.subject = subject;
    this.action = action;
    this.handler = handler;
    /*
    this.handler = function(param) {
        try {
            handler(param).bind(this);
        } catch (e) {
            postile.conf.logErrorByException(e);
        }
    };
    */
    this.usecapture = usecapture ? true : false;
}

postile.events.EventHandler.prototype.listen = function() {
    goog.events.listen(this.subject, this.action, this.handler, this.usecapture);
}

postile.events.EventHandler.prototype.unlisten = function() {
    goog.events.unlisten(this.subject, this.action, this.handler, this.usecapture);
}

/**
 * Event listener specialized for text editing.
 * @constructor
 * @param {Element} subject The dom element to attach to
 * @param {Function} handler The callback function that handles content
 * change in subject.
 */
postile.events.ContentChangeListener = function(subject, handler) {
    var currentVal;
    var myHandler = function(e) {
        if (currentVal == subject.innerHTML) {
            return;
        }
        handler(e);
        currentVal = subject.innerHTML;
    }
    this.listeners = [
        new postile.events.EventHandler(subject, goog.events.EventType.KEYUP, myHandler),
        new postile.events.EventHandler(subject, goog.events.EventType.INPUT, myHandler),
        new postile.events.EventHandler(subject, goog.events.EventType.CUT, myHandler),
        new postile.events.EventHandler(subject, goog.events.EventType.PASTE, myHandler)
    ];
}

postile.events.ContentChangeListener.prototype.listen = function() {
    goog.array.forEach(this.listeners, function(elem) {
        elem.listen();
    });
}

postile.events.ContentChangeListener.prototype.unlisten = function() {
    goog.array.forEach(this.listeners, function(elem) {
        elem.unlisten();
    });
}

