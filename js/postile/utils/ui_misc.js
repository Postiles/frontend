goog.provide('postile.ui');

goog.require('goog.dom');
goog.require('postile.fx.effects');

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
    
    target_el._postile_spinner_animation = postile.fx.effects.rotateOn(target_el);
    goog.dom.appendChild(target_el._postile_spinner_wrap, target_el._postile_spinner);
    goog.dom.appendChild(target_el, target_el._postile_spinner_wrap);
}

postile.ui.stopLoading = function(target_el){
    target_el._postile_spinner_animation.stop();
    goog.dom.removeNode(target_el._postile_spinner);
}
