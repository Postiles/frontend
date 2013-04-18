goog.provide('postile.view.signup');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.toast');

postile.view.signup.SignupView = function() {
    var instance = this;
    postile.view.FullScreenView.call(this);
    postile.ui.load(this.container,
                    postile.conf.staticResource(['signup_pg1.html']));

    this.btn = goog.dom.getElement('btn');
    this.username_el = goog.dom.getElement('username');
    this.email_el = goog.dom.getElement('email');
    this.reason_el = goog.dom.getElement('reason');
    this.sentText_el = goog.dom.getElement('sent_text');
    this.backButton_el = goog.dom.getElement('back');

    goog.events.listen(this.btn, goog.events.EventType.CLICK,
        function(e) {
            var username = this.username_el.value;
            var email = this.email_el.value;
            var reason = this.reason_el.value;
            if (username && email) {
                postile.ajax(
                    [ 'user', 'request_invitation' ],
                    { username: username, email: email, reason: reason },
                    function(data) {
                        this.sentText_el.style.display = 'block';
                    }.bind(this));
            }
        }.bind(this));

    goog.events.listen(this.backButton_el, goog.events.EventType.CLICK,
        function(e) {
            history.back();
        });
}

goog.inherits(postile.view.signup.SignupView, postile.view.FullScreenView);

postile.view.signup.SignupView.prototype.unloaded_stylesheets = ['signup.css'];

/*
postile.view.signup.SignupView.prototype.verify_pg1 = function() {
    this.first_name = this.first_name_el.value;
    this.second_name = this.second_name_el.value;
    this.preferred_name = this.preferred_name_el.value;
    if(/^(\s|&nbsp;)*$/.test(this.preferred_name)) {
            new postile.toast.Toast(5, "Preferred name cannot be empty");
            return;
    }
    postile.ajax(['user','verify_username_unique'],{username:this.preferred_name},this.next.bind(this),
        function(data){
            new postile.toast.Toast(5, "Preferred Name is already taken");
        });
}

postile.view.signup.SignupView.prototype.next = function() {
    this.container.innerHTML = "";
    postile.ui.load(this.container,
                    postile.conf.staticResource(['signup_pg2.html']));
    this.btn_done = goog.dom.getElement('btn');
    this.name_el = goog.dom.getElement('name');
    this.name_el.innerHTML = this.preferred_name;

    this.email_el = goog.dom.getElement('email');
    this.passwd_el = goog.dom.getElement('passwd');
    this.passwd_confirm_el = goog.dom.getElement('passwd_confirm');
    goog.events.listen(this.btn_done, goog.events.EventType.CLICK,
                      this.verify_pg2.bind(this));
}

postile.view.signup.SignupView.prototype.verify_pg2 = function() {
    this.email =this.email_el.value;
    this.passwd = this.passwd_el.value;
    this.passwd_confirm = this.passwd_confirm_el.value;
    var emailre = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\ ".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA -Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!emailre.test(this.email)) {
       new postile.toast.Toast(5, "Your email address is invalid");
       return;
    }
    if(/^(\s|&nbsp;)*$/.test(this.passwd)) {
       new postile.toast.Toast(5, "Please input your password");
       return;
    }
    if(this.passwd != this.passwd_confirm) {
       new postile.toast.Toast(5, "Password confirm is different from the password");
       return;
    }
    postile.ajax(['user','new'],
                {username:this.preferred_name,
                 email:this.email,
                 password:this.passwd,
                 first_name:this.first_name,
                 last_name:this.second_name},
                 function(data) {
                    new postile.toast.Toast(5, "Signup Success, you can [login] now!",[function() {
                        postile.router.dispatch('login');
                    }])
                 },
                 function(data) {
                    new postile.toast.Toast(5, "Your mail has been registered");

                 });

}
*/

