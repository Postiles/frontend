/*
library for ajax-related activities
*/

goog.provide('postile.ajax');
goog.provide('postile.faye');

goog.require('goog.net.jsloader');
goog.require('goog.async.Deferred');
goog.require('postile.conf');
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

    //if (postile.conf.useragent.features.xdr) {
    //    xhr = new XDomainRequest();
    //    xhr.onload = function() { postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText); }
    //    xhr.onerror = function() { postile.ajax.notifier.networkError("XDR unknwon error"); }
    //} else {
        try {
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
        } catch (e) {
            postile.conf.logErrorByException(e);
        }
    //}

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
    //if (postile.conf.useragent.features.xdr) {
    //    xhr = new XDomainRequest();
    //    xhr.onload = function() { postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText); }
    //    xhr.onerror = function() { postile.ajax.notifier.networkError("XDR unknown error"); }
    //} else {
        xhr = new XMLHttpRequest();
    　  xhr.onreadystatechange = function(){
            try {
        　　　　if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        postile.ajax.fetchedHandler(onsuccess, onfail, xhr.responseText);
        　　　　    } else {
        　　　　　　    postile.ajax.notifier.networkError("XHR unknown error"); //TODO
        　　　　    }
                }
            } catch (e) {
                postile.conf.logErrorByException(e);
            }           
    　　};
    //}
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
    postile.toast.title_bar_toast('Network error: '+error_string+'.', 3);
}

postile.ajax.exception_handlers = { //exception_string and corresponding handler functions.
    USER_NOT_FOUND: function(args) {
        // postile.user.openLoginBox();
        return false;
    },
    USER_NOT_LOGGED_IN: function() {
        postile.user.openLoginBox();
        return false;
    },
    SERVER_ERROR: function() {
        new postile.toast.title_bar_toast("Server error, please refresh", 3);
    },
    BOARD_NOT_FOUND: function() {
        new postile.toast.title_bar_toast("Board not exist.", 3);
    },
    POST_NOT_FOUND: function() {
        new postile.toast.title_bar_toast("Post not exist. Maybe it has been deleted", 3);
    }
}

postile.faye.client = null;

postile.faye.init = function(callback) {
    goog.net.jsloader.load(postile.conf.fayeLocation + '/client.js').addCallback(function() {
        postile.faye.client = new Faye.Client(postile.conf.fayeLocation);
        callback();
    });
}

/**
 * Subscribes to a faye channel.
 * @param {String} channel The channel to subscribe on
 * @param {function(string, Object)} listener The callback function to
 * be called when message arrives.
 * @param {Object=} opt_scope The this object to call listener with.
 * @return {goog.async.Deferred} A deferred object whose callback value is a
 * {Faye.Subscription} object, which you could call .cancel() on it.
 */
postile.faye.subscribe = function(channel, listener, opt_scope) {
    var dfd = new goog.async.Deferred();
    var faye_action = function() {
        var subscr = postile.faye.client.subscribe('/faye/' + channel,
            function(data) {
                listener.call(opt_scope, data.status, data.msg);
            });
        dfd.callback(subscr);
    };
    if (!postile.faye.client) {
        postile.faye.init(faye_action);
    } else {
        faye_action();
    }
    return dfd;
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
