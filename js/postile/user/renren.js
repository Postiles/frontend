goog.provide('postile.renren_connection');
goog.require('goog.net.Cookies');
goog.require('goog.events');

postile.renren_connection = {
    appid: 'cc9572056f984573a79c0c85a7d45838',
    user_id: null,
    session_key: null,
    session_key_secret:null,
    expires:null,
    signature:null,
    init: function() {
        this.user_id = goog.net.cookies.get(this.appid+'_user');
        this.session_key = goog.net.cookies.get(this.appid+'_session_key');
        this.session_key_secret = goog.net.cookies.get(this.appid+'_ss');
        this.expires = goog.net.cookies.get(this.appid+'_expires');
        this.signature = goog.net.cookies.get(this.appid);
        console.log(this);
    }

}

