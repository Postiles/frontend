/*
library for ajax-related activities
*/

goog.provide('postile.ajax');
goog.provide('postile.faye');

goog.require('goog.net.jsloader');

postile.ajax = function(url, data, onsuccess, onfail, notifier_text) { 
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
        xhr.onload = function() { postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText); }
        xhr.onerror = function() { postile.ajax.notifier.networkError("XDR unknwon error"); }
    } else {
        xhr = new XMLHttpRequest();
    　  xhr.onreadystatechange = function(){
    　　　　if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText);
    　　　　    } else {
    　　　　　　    postile.ajax.notifier.networkError("XHR unknown error"); //TODO
    　　　　    }
            }
    　　};
    }
    xhr.timeout = 10000;
    xhr.ontimeout = function(){ postile.ajax.notifier.networkError("request timeout"); };
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

postile.ajax.status = { //possible returning status from server
    ERROR: 'error',
    OK: 'ok'
}

postile.ajax.fetchedHandler = function(onsuccess, onfail, receivedText) {
    var received;
    try {
        received = JSON.parse(receivedText);
    } catch(e) {
        postile.ajax.notifier.networkError("response data damaged"); //json parsing failed
        return;
    }
    if (received.status == postile.ajax.status.ERROR) {
        if (received.message in postile.ajax.expection_handlers) {
            postile.ajax.expection_handlers[received.message](received);
        } else if (typeof onfail == 'function') {
            onfail(received);
        }
    } else if (typeof onsuccess == 'function') { onsuccess(received); }
    postile.ajax.notifier.hide();
};

postile.ajax.notifier = {};

postile.ajax.notifier.show = function(notifier_text){};

postile.ajax.notifier.hide = function(){};

postile.ajax.notifier.networkError = function(error_string) { //network error
    new postile.toast.Toast(5, "Network error: "+error_string+'.', [], 'red');
}

postile.ajax.expection_handlers = { //exception_string and corresponding handler functions.
    USER_NOT_LOGGED_IN: function() {
        postile.user.openLoginBox();
        return false;
    },
    SERVER_ERROR: function() {
        new postile.toast.Toast(5, "We are experiencing an magic error (again)...", [], 'red');
    }
}

postile.faye.client = null;

postile.faye.init = function(callback) {
    goog.net.jsloader.load(postile.fayeLocation+'/client.js').addCallback(function() { postile.faye.client = new Faye.Client(postile.fayeLocation); callback(); });
}

postile.faye.subscribe = function(channel, listener) {
    var faye_action = function() {
        postile.faye.client.subscribe('/faye/'+channel, function(data) {
            var json = data.data.message;
            /*
            var json = null;       
            try {
                json = JSON.parse(data.data.message);
            } catch(e) {
                postile.ajax.notifier.networkError("Faye response data damaged"); //json parsing failed
            }
            */
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
