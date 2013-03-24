goog.provide('postile.user');

goog.require('postile.view.login');

postile.user.current_username = null;

postile.user.login_window = null;

postile.user.login = function(username, password, onsuccess, onfail) {
    postile.ajax(['user', 'login'], {'username': username, 'password': password}, function(data) {
        localStorage.postile_user_id = data.message.user.id;
        localStorage.postile_user_session_key = data.message.user.session_key;

        onsuccess();
    }, function(re) {
        onfail(re.message);
    }, 'Please wait for logging in...');
}

postile.user.logout = function() {
    postile.ajax([ 'user', 'logout' ], { }, function(e) {
        localStorage.postile_user_id = '';
        localStorage.postile_user_session_key = '';

        postile.user.login_window = new postile.view.login.LoginView();
    });
}

postile.user.openLoginBox = function() {
    console.log('login box');
    if (postile.user.current_user) { return; } //already logged in
    if (postile.user.login_window) { return; } //login window already opened

    postile.user.login_window = new postile.view.login.LoginView();
}
