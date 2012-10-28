/*
library for ajax-related activities
*/

goog.provide('postile.ajax');
goog.provide('postile.faye');

postile.ajax = function(url, data, callback, use_get, notifier_text){ 
    var xhr, formData, i;
	if (url instanceof Array) {
		url = postile.dynamicResource.apply(null, url);
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
    　　　　if (xhr.readyState == 4 && xhr.status == 200) {
                postile.ajax.fetchedHandler(callback, xhr.responseText);
    　　　　} else {
    　　　　　　postile.ajax.notifier.networkError(xhr.statusText); //TODO
    　　　　}
    　　};
    }
    xhr.timeout = 10000;
    xhr.ontimeout = function(){ postile.ajax.notifier.networkError("Request timeout."); };
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

postile.ajax.fetchedHandler = function(callback, receivedText) {
    try {
        received = JSON.parse(received);
    } catch(e) {
        postile.ajax.notifier.networkError("Response data damaged."); //json parsing failed
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

postile.faye.init = function() { postile.faye.faye_client = new Faye.Client('http://localhost:9292/faye'); }

postile.faye.subscribe = function(channel, listener) {
	if (!postile.faye.client) {
		postile.faye.init();
		postile.faye.client.subscribe(channel, function(data) {
			try {
				json = JSON.parse(data);
			} catch(e) {
				postile.ajax.notifier.networkError("Response data damaged."); //json parsing failed
			}
			listener(data.data.status, json);
		});
	}
};

postile.faye.unsubscribe = function(channel) {
	if (!postile.faye.client) { return; }
	postile.faye.client.unsubscribe(channel);
};


