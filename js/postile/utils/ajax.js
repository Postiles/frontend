/*
library for ajax-related activities
*/

goog.provide('postile.ajax');
goog.provide('postile.faye');

goog.require('goog.net.jsloader');

postile.ajax = function(url, data, callback, notifier_text){ 
    var xhr, formData, i;
    if ("postile_user_id" in localStorage && "postile_user_session_key" in localStorage) {
        data.user_id = localStorage.postile_user_id;
        data.session_key = localStorage.postile_user_session_key;
    }
    if (url instanceof Array) {
        url = postile.dynamicResource(url);
    }
    if (notifier_text && notifier_text.length) {
        postile.ajax.notifier.show(notifier_text);
    }
    if (postile.browser_compat.walkarounds.xdr) {
        xhr = new XDomainRequest();
        xhr.onload = function() { postile.ajax.fetchedHandler(callback, xhr.responseText); }
        xhr.onerror = function() { postile.ajax.notifier.networkError("Network Error"); }
    } else {
        xhr = new XMLHttpRequest();
    　  xhr.onreadystatechange = function(){
    　　　　if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    postile.ajax.fetchedHandler(callback, xhr.responseText);
    　　　　    } else {
    　　　　　　    postile.ajax.notifier.networkError(xhr.statusText); //TODO
    　　　　    }
            }
    　　};
    }
    xhr.timeout = 10000;
    xhr.ontimeout = function(){ postile.ajax.notifier.networkError("Request timeout."); };
    if (postile.browser_compat.walkarounds.xhr >= 2) {
        xhr.open('POST', url);
        formData = new FormData();
        for (i in data) {
    　　　　formData.append(i, data[i]);
    　　}
    　　xhr.send(formData);
   } else {
        headers.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
        formData = new Array();
        for (i in data) {
            formData.push(encodeURIComponent(i)+'='+encodeURIComponent(data[i]));
        }
        formData = formData.join('&');
        xhr.open('POST', url);
        xhr.send(formData);
   }
};

postile.ajax.fetchedHandler = function(callback, receivedText) {
    var received;
    try {
        received = JSON.parse(receivedText);
    } catch(e) {
        postile.ajax.notifier.networkError("Response data damaged."); //json parsing failed
        return;
    }
    if (received.status == 'error' && received.message in postile.ajax.expection_handlers) {
        if (!postile.ajax.expection_handlers[received.message](received)) {
            return;
        }
    }
　　callback(received);
    postile.ajax.notifier.hide();
};

postile.ajax.notifier = {};

postile.ajax.notifier.show = function(notifier_text){};

postile.ajax.notifier.hide = function(){};

postile.ajax.notifier.networkError = function(error_string) { //network error
    //todo
}

postile.ajax.expection_handlers = { //exception_string and corresponding handler functions. return true to allow the callback function to be called and return false to stop the workflow. the function can also modify the "received" object
    not_logged_login: function(received) {},
    privilege_required: function(received) {}
}

postile.faye.client = null;

postile.faye.init = function(callback) {
    goog.net.jsloader.load(postile.fayeLocation+'/client.js').addCallback(function() {  postile.faye.client = new Faye.Client(postile.fayeLocation); });
}

postile.faye.subscribe = function(channel, listener) {
    var faye_action = function() {
        postile.faye.client.subscribe('/faye/'+channel, function(data) {
            console.log(data);
            try {
                json = JSON.parse(data);
            } catch(e) {
                postile.ajax.notifier.networkError("Response data damaged."); //json parsing failed
            }
            listener(data.data.status, json);
        });
    };
    if (!postile.faye.client) {
        postile.faye.init(faye_action);
    } else {
        faye_action();
    }
};

postile.faye.unsubscribe = function(channel) {
    if (!postile.faye.client) { return; }
    postile.faye.client.unsubscribe(channel);
};