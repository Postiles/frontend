goog.provide('postile.view.login');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.view');

postile.view.login.LoginView = function() { //constructor
    postile.view.FullScreenView.call(this);

    this.emailInput_el = goog.dom.getElement('email-input');
    this.passwordInput_el = goog.dom.getElement('password-input');

    this.loginButtonContainer_el = goog.dom.getElement('login-button-container');
    goog.events.listen(this.loginButtonContainer_el, goog.events.EventType.CLICK, function(e) {
        var email = this.emailInput_el.value;
        var password = this.passwordInput_el.value;
        postile.user.login(email, password, function() {
            window.location.reload();
        }, function(e) {
            alert(e);
        });
    }.bind(this));
}

goog.inherits(postile.view.login.LoginView, postile.view.FullScreenView);

postile.view.login.LoginView.prototype.unloaded_stylesheets = ['fonts.css', 'login.css'];

postile.view.login.LoginView.prototype.html_segment = postile.staticResource(['login.html']);
