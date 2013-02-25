goog.provide('postile.ui');

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
