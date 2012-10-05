/*
library for ajax-related activities
*/

goog.provide('postile.utils.ajax');

postile.util.ajax = function(url, data, callback, notifier_text){
    var xhr, formData, i;
    postile.util.ajax.notifier.show(notifier_text);
    if (postile.browser_compat.walkarounds.xdr) {
        xhr = new XDomainRequest();
        xhr.onload = function() { postile.util.ajax.fetchedHandler(callback, xhr.responseText); }
        xhr.onerror = function() { postile.util.ajax.notifier.networkError("Network Error"); }
    } else {
        xhr = new XMLHttpRequest();
    　  xhr.onreadystatechange = function(){
    　　　　if (xhr.readyState == 4 && xhr.status == 200) {
                postile.util.ajax.fetchedHandler(callback, xhr.responseText);
    　　　　} else {
    　　　　　　postile.util.ajax.notifier.networkError(xhr.statusText); //TODO
    　　　　}
    　　};
    }
    xhr.timeout = 10000;
    xhr.ontimeout = function(){ postile.util.ajax.notifier.networkError("Request timeout."); };
    xhr.open('POST', url);
    if (postile.browser_compat.walkarounds.xhr >= 2) {
        formData = new FormData();
        for (i in data) {
    　　　　formData.append(i, data[i]);
    　　}
    } else {
         headers.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
         formData = new Array();
         var (i in data) {
            formData.push(encodeURIComponent(i)+'='+encodeURIComponent(data[i]));
         }
         formData = formData.join('&');
    }
　　xhr.send(formData);
};

postile.util.ajax.fetchedHandler = function(callback, receivedText) {
    try {
        received = JSON.parse(received);
    } catch(e) {
        postile.util.ajax.notifier.networkError("Response data damaged."); //json parsing failed
    }
    if (received.expection && received.expection in postile.util.ajax.expection_handlers) {
        if (!postile.util.ajax.expection_handlers[received.expection](received)) {
            return;
        }
    }
　　callback(received);
    postile.util.ajax.notifier.hide();
};

postile.util.ajax.notifier.show = function(notifier_text){};

postile.util.ajax.notifier.hide = function(){};

postile.util.ajax.notifier.networkError = function(error_string) { //network error
    //todo
}

postile.util.ajax.expection_handlers = { //exception_string and corresponding handler functions. return true to allow the callback function to be called and return false to stop the workflow. the function can also modify the "received" object
    not_logged_login: function(received) {},
    privilege_required: function(received) {}
}