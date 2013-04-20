goog.provide('postile.user');

goog.require('postile.view.login');

postile.user.current_username = null;

postile.user.login = function(username, password, onsuccess, onfail) {
    postile.ajax(['user', 'login'], {'username': username, 'password': password}, function(data) {
        localStorage.postile_user_id = data.message.user.id;
        localStorage.postile_user_session_key = data.message.user.session_key;

        onsuccess();
    }, function(re) {
        onfail(re.message);
    }, 'Please wait for logging in...');
}

postile.user.anonymous = function() {
    localStorage.postile_user_id = 0;
    //Dummy session key to fail some requests
    localStorage.postile_user_session_key = "Anonymous"
}

postile.user.logout = function() {
    postile.ajax([ 'user', 'logout' ], { }, function(e) {
        localStorage.postile_user_id = '';
        localStorage.postile_user_session_key = '';

        postile.router.dispatch('login' + '#' + window.location.pathname.substr(1) + window.location.hash);
    });
}

postile.user.openLoginBox = function() {
    if (postile.user.current_user) { return; } //already logged in
    if (postile.router.current_view instanceof postile.view.login.LoginView) { return; } //login window already opened

    postile.router.dispatch('login' + '#' + window.location.pathname.substr(1) + window.location.hash);
}
