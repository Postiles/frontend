goog.provide('postile.toast');

goog.require('goog.dom');
goog.require('goog.events');

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
color can be yellow (default) or red now
*/
postile.toast.Toast = function(duration, text, callbacks, color) {
    if (!postile.toast.toast_container) {
        postile.toast.toast_container = goog.dom.createDom('div', 'toast_container');
        goog.dom.appendChild(postile.wrapper, postile.toast.toast_container);
    }
    var i;
    var temp;
    var section = /\[[^\[\]]+\]/g;
    var links = text.match(section);
    var plain = text.split(section);
    var instance = this;
    if (!callbacks) { callbacks = []; }
    if (!color) { color = 'yellow'; } //default color: yellow. alternative: red. defined in common.css
    this.line_el = goog.dom.createDom('div', 'toast_line');
    this.instance_el = goog.dom.createDom('div', ['toast_instance', 'toast_'+color]);
    this.instance_el.innerHTML = plain[0];
    if (links) {
        for (i = 0; i < links.length; i++) {
            temp = goog.dom.createDom('span');
            temp.innerHTML = links[i].substring(1, links[i].length - 1);
            if (typeof callbacks[i] == 'function') { goog.events.listen(temp, goog.events.EventType.CLICK, callbacks[i]); }
            goog.dom.appendChild(this.instance_el, temp);
            temp = goog.dom.createTextNode(plain[i+1]);
            goog.dom.appendChild(this.instance_el, temp);
        }
    }
    goog.dom.appendChild(this.line_el, this.instance_el);
    goog.dom.appendChild(postile.toast.toast_container, this.line_el);
    if (duration > 0) {
        window.setTimeout(function() {
            new postile.fx.Animate(function(iter) {
                instance.instance_el.style.opacity = 1 - iter;
            }, 1000, null, function() { goog.dom.removeNode(instance.line_el); });
        }, duration*1000);
    }
}

postile.toast.Toast.prototype.abort = function() {
    goog.dom.removeNode(this.line_el);
}