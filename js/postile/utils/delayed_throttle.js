goog.provide('postile.DelayedThrottle');

postile.DelayedThrottle = function(callback, timeout) {
    this.callback = callback;
    this.to = null;
    this.timeout = timeout;
}

postile.DelayedThrottle.prototype.kick = function() {
    if (this.to) { clearTimeout(this.to); }
    this.to = setTimeout(this.callback, this.timeout);
}