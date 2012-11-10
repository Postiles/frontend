goog.provide('postile.toast');

goog.require('goog.dom');

/*
To use:

postile.toast.Toast to create a toast.

toast.abort to make it disappear immediately.

In handlers, use "this" to point to the toast element.

*/

postile.toast.toast_container = null;

/*
duration = 0 for displaying forever
use text = "click to [close] or [bye]" and callback as an array of two functions
*/
postile.toast.Toast = function(duration, text, callback) {
    if (!postile.toast.toast_container) {
        postile.toast.toast_container = goog.dom.createDom('div', 'toast_container');
    }
}

postile.toast.Toast.abort = function() {
    
}