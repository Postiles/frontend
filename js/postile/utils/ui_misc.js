goog.provide('postile.ui');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.dom.classes');
goog.require('goog.string');
goog.require('goog.object');
goog.require('postile.fx');
goog.require('postile.conf.useragent');

/**
 * Get a url synchronously. The result is cached.
 */
postile.syncGet = function(url) {
    var response;
    if (!goog.object.containsKey(postile.syncGet.cache_, url)) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false /* not async */);
        xhr.send();
        response = xhr.responseText;
        postile.syncGet.cache_[url] = response;
    }
    else {
        response = postile.syncGet.cache_[url];
    }
    return response;
};

/**
 * Locally caches url => content for syncGet.
 */
postile.syncGet.cache_ = {};

//fetch HTML from a specific url and fill it into a container
postile.ui.load = function (target_el, source_url) {
    if (!(/\?/.test(source_url))) {
        source_url += "?201304270216";
    }
    target_el.innerHTML = postile.syncGet(source_url);
}

/**
 * Attach a JuHua animation on the given element.
 * @param {Element} target_el The element to attach JuHua on.
 */
postile.ui.startLoading = function(target_el) {
    target_el._postile_spinner_wrap = goog.dom.createDom('div', 'busy_wrap');
    target_el._postile_spinner = goog.dom.createDom('div', 'busy');
    target_el._postile_spinner_animation = new postile.fx.Animate(function(i) {
        postile.conf.useragent.setCss(target_el._postile_spinner,
            'transform', 'rotate(' + Math.floor(i * 12) * 30 + 'deg)');
    }, 1600, {
        mode: postile.fx.Mode.FOREVER_REPEAT
    });
    goog.dom.appendChild(target_el._postile_spinner_wrap, target_el._postile_spinner);
    goog.dom.appendChild(target_el, target_el._postile_spinner_wrap);
}

/**
 * Remove the JuHua animation from the given element.
 * @param {Element} target_el The element to remove from.
 */
postile.ui.stopLoading = function(target_el){
    target_el._postile_spinner_animation.stop();
    goog.dom.removeNode(target_el._postile_spinner_wrap);
}

/**
 * @param {Element} target_el The dom element to attach the event handler to
 * @param {string} placeholder The placeholder to display in the input
 * @param {string} inactive_classname Classname to be added to the
 * element when the element is not focused.
 * @param {Function=} opt_enter_handler Handler function to be called with
 * ENTER key is pressed in the target_el. Optional.
 */
postile.ui.makeLabeledInput = function(target_el, placeholder, inactive_classname, opt_enter_handler) {
    var blurHandler = function() {
        if (goog.string.isEmpty(target_el.innerHTML)) {
            target_el.innerHTML = placeholder;
            goog.dom.classes.add(target_el, inactive_classname);
        }
    }
    target_el.contentEditable = true;
    blurHandler();
    //Always delete self when on focus
    new postile.events.EventHandler(target_el, goog.events.EventType.FOCUS, function() {
        if(target_el.innerHTML == placeholder) {
            goog.dom.classes.remove(target_el, inactive_classname);
            target_el.innerHTML = ' ';
            target_el.focus();
        }
    }).listen();
    new postile.events.EventHandler(target_el, goog.events.EventType.BLUR, blurHandler).listen();
    new postile.events.EventHandler(new goog.events.KeyHandler(target_el), goog.events.KeyHandler.EventType.KEY, function(e) {
        if (target_el.innerHTML == placeholder) {
            target_el.innerHTML = '';
            goog.dom.classes.remove(target_el, inactive_classname);
        } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
            if (opt_enter_handler) { // if handler is specific, for enter key to work when editing
                e.preventDefault();
                opt_enter_handler();
                target_el.blur();
            }
        }
    }).listen();
}
