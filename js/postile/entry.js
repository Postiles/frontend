goog.provide('postile.entry');

goog.require('postile');

/**
 * Exported entry point.
 */
postile.entry.main = function() {
    goog.events.listen(window, goog.events.EventType.LOAD, postile.load);
};

goog.exportSymbol('postile.entry.main', postile.entry.main);
