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
duration in seconds. 0 for displaying forever until abortion
use text = "click to [close] or [bye]" and callbacks as an array of two functions
*/
postile.toast.Toast = function(duration, text, callbacks) {
    if (!postile.toast.toast_container) {
        postile.toast.toast_container = goog.dom.createDom('div', 'toast_container');
        goog.dom.appendChild(postile.wrapper, postile.toast.toast_container);
    }
    var i;
    var temp;
    var section = /\[([^\[\]]*)\]/g;
    var links = text.match(section);
    var plain = text.split(section);
    var instance = this;
    this.div_el = goog.dom.createDom('div', 'toast_instance');
    this.div_el.innerHTML = plain[0];
    for (i in links) {
        temp = goog.dom.createDom('span');
        temp.innerHTML = links[i].substr(1, -1);
        temp.onclick = callbacks[i];
        goog.dom.appendChild(this.div_el, temp);
        temp = goog.dom.createTextNode(plain[i+1]);
        goog.dom.appendChild(this.div_el, temp);
    }
    goog.dom.appendChild(postile.toast.toast_container, this.div_el);
    if (duration > 0) {
        window.setTimeout(function() {
            new postile.fx.Animate(function(iter) {
                instance.div_el.style.opacity = 1 - iter;
            }, 1000, null, function() { goog.dom.removeNode(instance.div_el); });
        }, duration*1000);
    }
}

postile.toast.Toast.abort = function() {
    goog.dom.removeNode(this.div_el);
}