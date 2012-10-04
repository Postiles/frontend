var ajax = function(url, data, callback, notifier_text){
	var xhr, formData, i;
	ajax.notifier.show(notifier_text);
	xhr = new XMLHttpRequest();
	xhr.open('POST', url);
	xhr.timeout = 10000;
	xhr.ontimeout = function(){ ajax.notifier.networkError("Request timeout."); };
　	xhr.onreadystatechange = function(){
　　　　if (xhr.readyState == 4 && xhr.status == 200) {
			var received;
			try {
				received = JSON.parse(xhr.responseText);
			} catch(e) {
				ajax.notifier.networkError("Response data damaged."); //json parsing failed
			}
			if (received.expection && received.expection in ajax.expection_handlers) {
				if (!ajax.expection_handlers[received.expection](received)) {
					return;
				}
			}
　　　　　　callback(received);
			ajax.notifier.hide();
　　　　} else {
　　　　　　ajax.notifier.networkError(xhr.statusText); //TODO
　　　　}
　　};
	formData = new FormData();
	for (i in data) {
　　　　formData.append(i, data[i]);
　　}
　　xhr.send(formData);
};

ajax.notifier.show = function(notifier_text){};

ajax.notifier.hide = function(){};

ajax.notifier.networkError = function(error_string) { //network error
	//todo
}

ajax.expection_handlers = { //exception_string and corresponding handler functions. return true to allow the callback function to be called and return false to stop the workflow. the function can also modify the "received" object
	not_logged_login: function(received) {},
	privilege_required: function(received) {}
}