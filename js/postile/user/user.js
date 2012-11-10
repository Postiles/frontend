goog.provide('postile.user');

goog.require('postile.view.login');

postile.user.current_user = null;

postile.user.login = function(username, password) {
    postile.ajax(['user', 'login'], {'username': username, 'password': password}, function(data) {
        if (data.status == 'ok') {
            localStorage.postile_user_id = data.message.user_id;
            localStorage.postile_user_session_key = data.message.session_key;
            alert("Test login successful.");
        }
    }, false, 'Please wait for logging in...');
}

postile.user.openLoginBox = function() {
    if (postile.user.current_user) { return; } //already logged in
    login_window = new postile.view.login.Login(); 
    login_window.open(200);
}