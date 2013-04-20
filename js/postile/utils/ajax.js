/*
library for ajax-related activities
*/

goog.provide('postile.ajax');
goog.provide('postile.faye');

goog.require('postile.conf');
goog.require('goog.net.jsloader');
goog.require('postile.user');

postile.ajax = function(url, data, onsuccess, onfail, notifier_text) {
    var xhr, formData, i;

    data.user_id = localStorage.postile_user_id;
    data.session_key = localStorage.postile_user_session_key;

    if (url instanceof Array) {
        url = postile.conf.dynamicResource(url);
    }

    if (notifier_text && notifier_text.length) {
        postile.ajax.notifier.show(notifier_text);
    }

    if (postile.conf.useragent.features.xdr) {
        xhr = new XDomainRequest();
        xhr.onload = function() { postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText); }
        xhr.onerror = function() { postile.ajax.notifier.networkError("XDR unknwon error"); }
    } else {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
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
    xhr.ontimeout = function() {
        postile.ajax.notifier.networkError("request timeout");
    };

    if (postile.conf.useragent.features.xhr >= 2) {
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

postile.ajax.upload = function(url, formData, onsuccess, onfail, notifier_text) {
    if ("postile_user_id" in localStorage && "postile_user_session_key" in localStorage) {
        formData.user_id = localStorage.postile_user_id;
        formData.session_key = localStorage.postile_user_session_key;
    }

    if (url instanceof Array) {
        url = postile.conf.dynamicResource(url);
    }
    if (postile.conf.useragent.features.xdr) {
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
    if (postile.conf.useragent.features.xhr >= 2) {
        xhr.open('POST', url);
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
}

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
        if (received.message in postile.ajax.exception_handlers) {
            postile.ajax.exception_handlers[received.message](received);
        } else if (typeof onfail == 'function') {
            onfail(received);
        }
    } else if (typeof onsuccess == 'function') {
        onsuccess(received);
    }
    postile.ajax.notifier.hide();
};

postile.ajax.notifier = {};

postile.ajax.notifier.show = function(notifier_text){};

postile.ajax.notifier.hide = function(){};

postile.ajax.notifier.networkError = function(error_string) { //network error
    new postile.toast.Toast(5, "Network error: "+error_string+'.', [], 'red');
}

postile.ajax.exception_handlers = { //exception_string and corresponding handler functions.
    USER_NOT_FOUND: function(args) {
        // postile.user.openLoginBox();
        return false;
    },
    USER_NOT_LOGGED_IN: function() {
        console.log('user_not_logged_in');
        postile.user.openLoginBox();
        return false;
    },
    SERVER_ERROR: function() {
        new postile.toast.Toast(5, "We are experiencing an magic error (again)...", [], 'red');
    },
    BOARD_NOT_FOUND: function() {
        new postile.toast.Toast(5, "Board not exist. Please check the URL you entered", [], 'red');
    },
    POST_NOT_FOUND: function() {
        new postile.toast.Toast(5, "Post not exsit. Maybe it was deleted");
    }
}

postile.faye.client = null;

postile.faye.init = function(callback) {
    goog.net.jsloader.load(postile.conf.fayeLocation + '/client.js').addCallback(function() {
        postile.faye.client = new Faye.Client(postile.conf.fayeLocation);
        callback();
    });
}

postile.faye.subscribe = function(channel, listener) {
    var faye_action = function() {
        postile.faye.client.subscribe('/faye/' + channel, function(data) {
            listener(data.status, data.msg);
        });
    };
    if (!postile.faye.client) {
        postile.faye.init(faye_action);
    } else {
        faye_action();
    }
};

postile.faye.publish = function(channel, status, data) {
    var msg = {
        status: status,
        msg:data
    };
    postile.faye.client.publish('/faye/'+channel, msg);
};

postile.faye.unsubscribe = function(channel) {
    if (!postile.faye.client) { return; }
    postile.faye.client.unsubscribe(channel);
};
