goog.provide('postile.ui');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.dom.classes');
goog.require('postile.fx');

postile.syncGet = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    return xhr.responseText;
}

//fetch HTML from a specific url and fill it into a container
postile.ui.load = function (target_el, source_url) {
    target_el.innerHTML = postile.syncGet(source_url);
}

postile.ui.startLoading = function(target_el) {
    target_el._postile_spinner_wrap = goog.dom.createDom('div', 'busy_wrap');
    target_el._postile_spinner = goog.dom.createDom('div', 'busy');
    target_el._postile_spinner_animation = new postile.fx.Animate(function(i){
        postile.browser_compat.setCss(target_el._postile_spinner, 'transform', 'rotate('+Math.floor(i*12)*30+'deg)');
    }, 1600, null, null, postile.fx.modes.FOREVER_REPEAT);
    goog.dom.appendChild(target_el._postile_spinner_wrap, target_el._postile_spinner);
    goog.dom.appendChild(target_el, target_el._postile_spinner_wrap);
}

postile.ui.stopLoading = function(target_el){
    target_el._postile_spinner_animation.stop();
    goog.dom.removeNode(target_el._postile_spinner_wrap);
}

postile.ui.makeLabeledInput = function(target_el, placeholder, inactive_classname, enter_handler) {
    var blurHandler = function() {
        if(!postile.string.stripString(target_el.innerHTML).length) {
            target_el.innerHTML = placeholder;
            goog.dom.classes.add(target_el, inactive_classname);
        }
    }
    target_el.contentEditable = true;
    blurHandler();
    new postile.events.EventHandler(target_el, goog.events.EventType.BLUR, blurHandler).listen();
    new postile.events.EventHandler(new goog.events.KeyHandler(target_el), goog.events.KeyHandler.EventType.KEY, function(e) {
        if (target_el.innerHTML == placeholder) {
            target_el.innerHTML = '';
            goog.dom.classes.remove(target_el, inactive_classname);
        } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
            e.preventDefault();
            target_el.innerHTML = postile.string.stripString(target_el.innerHTML);
            enter_handler();
            target_el.blur();
        }
    }).listen();
}
