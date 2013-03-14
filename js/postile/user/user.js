goog.provide('postile.user');

goog.require('postile.view.login');

postile.user.current_username = null;

postile.user.login_window = null;

postile.user.login = function(username, password, onsuccess, onfail) {
    postile.ajax(['user', 'login'], {'username': username, 'password': password}, function(data) {
        localStorage.postile_user_id = data.message.user_id;
        localStorage.postile_user_session_key = data.message.session_key;
        postile.user.current_username = username;
        onsuccess();
    }, function(re) {
        onfail(re.message);
    }, 'Please wait for logging in...');
}

postile.user.openLoginBox = function() {
    if (postile.user.current_user) { return; } //already logged in
    if (postile.user.login_window) { return; } //login window already opened

    postile.user.login_window = new postile.view.login.LoginView();
}
