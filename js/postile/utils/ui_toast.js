goog.provide('postile.toast');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx');

/**
 * Initialized when the first Toast object is created.
 * @type {Element}
 */
postile.toast.toast_container = null;

/**
 * @constructor
 * @param {number} duration Duration in seconds. 0 to display forever until
 * aborted.
 * @param {string} text Text to display. Link text should be wrapped between
 * pair of brackets. See example below.
 * @param {Array.<function>} callbacks An array of callbacks, its length should 
 * match the number of link texts. During invocation, `this` will be bound
 * to the toast object itself.
 * Example: text = "click to [close] or [bye]",
 *          callbacks = [closeHandler, byeHandler]
 * @param {string} opt_color (Optional) background color, defaults to 'yellow',
 * can be 'red' as well. Its css rules are defined in common.css.
 */
postile.toast.Toast = function(duration, text, callbacks, opt_color) {
    var color = goog.isDef(opt_color) ? opt_color : 'yellow';

    if (!postile.toast.toast_container) {
        postile.toast.toast_container = goog.dom.createDom('div', 'toast_container');
        goog.dom.appendChild(document.body, postile.toast.toast_container);
    }

    var i;
    var temp;
    var section = /\[[^\[\]]+\]/g;
    var links = text.match(section);
    var plain = text.split(section);
    var instance = this;
    if (!callbacks) { callbacks = []; }
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
            }, 1000, {
                callback: function() {
                    goog.dom.removeNode(instance.line_el);
                }
            });
        }, duration*1000);
    }
}

/**
 * Detach this view from the document.
 */
postile.toast.Toast.prototype.abort = function() {
    goog.dom.removeNode(this.line_el);
}

postile.toast.title_bar_toast_on = false;
postile.toast.title_bar_toast_anim = 0;
postile.toast.title_bar_toast_container = null;
postile.toast.title_bar_toast_anim_time_left = 0;

postile.toast.title_bar_toast = function(text, duration) {
    /*
    postile.toast.title_bar_toast_container = 
        goog.dom.getElement('title_bar_toast_container');
    */

    if (!postile.toast.title_bar_toast_container) {
        postile.toast.title_bar_toast_container = 
            goog.dom.createDom('div', 'title_bar_toast_container');
        goog.dom.appendChild(document.body, postile.toast.title_bar_toast_container);

        // TODO: move to a css file
        postile.toast.title_bar_toast_container.style.position = 'absolute';
        postile.toast.title_bar_toast_container.style.top = '-40px';
        postile.toast.title_bar_toast_container.style.left = '50%';
        postile.toast.title_bar_toast_container.style.background = 'rgba(0, 0, 0, 0.5)';
        postile.toast.title_bar_toast_container.style.color = 'whitesmoke';
        postile.toast.title_bar_toast_container.style.padding = '5px 80px';
        postile.toast.title_bar_toast_container.style.zIndex = '600';
        postile.toast.title_bar_toast_container.style.zIndex = '600';
        postile.toast.title_bar_toast_container.style.zIndex = '600';
        postile.toast.title_bar_toast_container.style.borderBottomLeftRadius = '10px';
        postile.toast.title_bar_toast_container.style.borderBottomRightRadius = '10px';

        postile.toast.title_bar_toast_container.innerHTML = text;
        postile.toast.title_bar_toast_container.style.marginLeft = 
            - postile.toast.title_bar_toast_container.offsetWidth / 2 + 'px';
    }

    var top = -40;

    // postile.toast.title_bar_toast_anim_time_left = 100;

    var downAnim = setInterval(function() {
        top += 4;
        postile.toast.title_bar_toast_container.style.top = top + 'px';
        // postile.toast.title_bar_toast_anim_time_left -= 10;
        if (top == 0) {
            clearInterval(downAnim);
        }
    }, 10);

    if (postile.toast.title_bar_toast_on) { // has active toast
        clearTimeout(postile.toast.title_bar_toast_anim);
    }

    postile.toast.title_bar_toast_on = true;

    if (duration != 0) {
        postile.toast.title_bar_toast_anim = setTimeout(function() {
            postile.toast.title_bar_toast_dismiss();
        }.bind(this), duration * 1000);
    }
}

postile.toast.title_bar_toast_dismiss = function() {
    // if (postile.toast.title_bar_toast_on) {
        // setTimeout(function() {
            var top = 0;

            var upAnim = setInterval(function() {
                top -= 4;
                postile.toast.title_bar_toast_container.style.top = top + 'px';
                if (top == -40) {
                    clearInterval(upAnim);
                    postile.toast.title_bar_toast_on = false;
                }
            }, 10);
        // }, postile.toast.title_bar_toast_anim_time_left + 1000);
    // }
}
