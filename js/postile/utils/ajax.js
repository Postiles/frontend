/*
library for ajax-related activities
*/

goog.provide('postile.utils.ajax');
goog.provide('postile.utils.faye');

postile.utils.ajax = function(url, data, callback, use_get, notifier_text){ 
    var xhr, formData, i;
	if (url instanceof Array) {
		url = postile.dynamicResource.apply(null, url);
	}
	if (notifier_text && notifier_text.length) {
		postile.utils.ajax.notifier.show(notifier_text);
	}
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
    if ((!use_get) && postile.browser_compat.walkarounds.xhr >= 2) {
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
        if (!use_get) {
            xhr.open('POST', url);
            xhr.send(formData);
        } else {
            xhr.open('GET', url+'?'+formData);
            xhr.send(null);
        }
   }
};

postile.utils.ajax.fetchedHandler = function(callback, receivedText) {
    try {
        received = JSON.parse(received);
    } catch(e) {
        postile.utils.ajax.notifier.networkError("Response data damaged."); //json parsing failed
    }
    if (received.status == 'error' && received.message in postile.utils.ajax.expection_handlers) {
        if (!postile.utils.ajax.expection_handlers[received.message](received)) {
            return;
        }
    }
　　callback(received);
    postile.utils.ajax.notifier.hide();
};

postile.utils.ajax.notifier = {};

postile.utils.ajax.notifier.show = function(notifier_text){};

postile.utils.ajax.notifier.hide = function(){};

postile.utils.ajax.notifier.networkError = function(error_string) { //network error
    //todo
}

postile.utils.ajax.expection_handlers = { //exception_string and corresponding handler functions. return true to allow the callback function to be called and return false to stop the workflow. the function can also modify the "received" object
    not_logged_login: function(received) {},
    privilege_required: function(received) {}
}

postile.utils.faye.client = null;

postile.utils.faye.init = function() { postile.utils.faye.faye_client = new Faye.Client('http://localhost:9292/faye'); }

postile.utils.faye.subscribe = function(channel, listener) {
	if (!postile.utils.faye.client) {
		postile.utils.faye.init();
		postile.utils.faye.client.subscribe(channel, function(data) {
			try {
				json = JSON.parse(data);
			} catch(e) {
				postile.utils.ajax.notifier.networkError("Response data damaged."); //json parsing failed
			}
			listener(data.data.status, json);
		});
	}
};

postile.utils.faye.unsubscribe = function(channel) {
	if (!postile.utils.faye.client) { return; }
	postile.utils.faye.client.unsubscribe(channel);
};


