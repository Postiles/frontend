goog.provide('postile.user');

postile.user.current_user = null;

postile.user.login = function(username, password) {
	postile.utils.ajax(['user', 'login'], {'username': username, 'password': password}, function(data) {
		//TODO
	}, false, 'Please wait for logging in...');
}