/*
library for ajax-related activities
*/

goog.provide('postile.utils.ajax');

postile.utils.ajax = function(url, data, callback, notifier_text, use_get){ 
    var xhr, formData, i;
    postile.utils.ajax.notifier.show(notifier_text);
    if (postile.browser_compat.walkarounds.xdr) {
        xhr = new XDomainRequest();
        xhr.onload = function() { postile.utils.ajax.fetchedHandler(callback, xhr.responseText); }
        xhr.onerror = function() { postile.utils.ajax.notifier.networkError("Network Error"); }
    } else {
        xhr = new XMLHttpRequest();
    　  xhr.onreadystatechange = function(){
    　　　　if (xhr.readyState == 4 && xhr.status == 200) {
                postile.utils.ajax.fetchedHandler(callback, xhr.responseText);
    　　　　} else {
    　　　　　　postile.utils.ajax.notifier.networkError(xhr.statusText); //TODO
    　　　　}
    　　};
    }
    xhr.timeout = 10000;
    xhr.ontimeout = function(){ postile.utils.ajax.notifier.networkError("Request timeout."); };
    if (!use_get) {
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
   } else {
        xhr.open('GET', url);
        xhr.send(null);
   }
};

postile.utils.ajax.fetchedHandler = function(callback, receivedText) {
    try {
        received = JSON.parse(received);
    } catch(e) {
        postile.utils.ajax.notifier.networkError("Response data damaged."); //json parsing failed
    }
    if (received.expection && received.expection in postile.utils.ajax.expection_handlers) {
        if (!postile.utils.ajax.expection_handlers[received.expection](received)) {
            return;
        }
    }
　　callback(received);
    postile.utils.ajax.notifier.hide();
};

postile.utils.ajax.notifier.show = function(notifier_text){};

postile.utils.ajax.notifier.hide = function(){};

postile.utils.ajax.notifier.networkError = function(error_string) { //network error
    //todo
}

postile.utils.ajax.expection_handlers = { //exception_string and corresponding handler functions. return true to allow the callback function to be called and return false to stop the workflow. the function can also modify the "received" object
    not_logged_login: function(received) {},
    privilege_required: function(received) {}
}