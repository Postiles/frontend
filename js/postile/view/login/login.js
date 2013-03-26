goog.provide('postile.view.login');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.view');

postile.view.login.LoginView = function() { //constructor
    postile.view.FullScreenView.call(this);

    this.emailInput_el = goog.dom.getElement('email-input');
    this.passwordInput_el = goog.dom.getElement('password-input');

    goog.events.listen(this.emailInput_el, goog.events.EventType.KEYUP, this.enterPressed.bind(this));
    goog.events.listen(this.passwordInput_el, goog.events.EventType.KEYUP, this.enterPressed.bind(this));

    this.loginButtonContainer_el = goog.dom.getElement('login-button-container');
    goog.events.listen(this.loginButtonContainer_el, goog.events.EventType.CLICK, this.login.bind(this));

    this.incorrect_el = goog.dom.getElement('incorrect-alert');
}

goog.inherits(postile.view.login.LoginView, postile.view.FullScreenView);

postile.view.login.LoginView.prototype.unloaded_stylesheets = ['fonts.css', 'login.css'];

postile.view.login.LoginView.prototype.html_segment = postile.staticResource(['login.html']);

postile.view.login.LoginView.prototype.enterPressed = function(e) {
    if (e.keyCode == 13) { // enter key pressed
        this.login();
    }
}

postile.view.login.LoginView.prototype.login = function() {
    var email = this.emailInput_el.value;
    var password = this.passwordInput_el.value;

    postile.user.login(email, password, function(data) {
        window.location.reload();
    }, function(e) {
        console.log(this);
        this.incorrect_el.style.visibility = 'visible';
    }.bind(this));
}
