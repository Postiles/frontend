goog.provide('postile.view.login');
goog.provide('postile.view.login.handlers');

goog.require('postile.user');
goog.require('postile.view');
goog.require('goog.events');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.CustomButton');
goog.require('goog.dom');

postile.view.login.Login = function() {
    var i;
    postile.view.PopView.call(this);
    for (i in postile.view.login.inputs) {
        this[i] = new goog.ui.LabelInput(postile.view.login.inputs[i]);
        this[i].render(this.container);
        goog.dom.classes.add(this[i].getElement(), 'login_'+i);
    }
    this.submit = new goog.ui.CustomButton('Login', goog.ui.ImagelessButtonRenderer);
    this.submit.render(this.container);
    goog.dom.classes.add(this.submit.getElement(), 'login_submit');
    goog.events.listen(this.submit.getElement(), goog.events.EventType.CLICK, postile.view.login.handlers.submit);
}

goog.inherits(postile.view.login.Login, postile.view.PopView);

postile.view.login.inputs = {'username': 'Username', 'password': 'Your little secret'};

postile.view.login.handlers.submit = function() {
    if (this.username.getValue().length && this.password.getValue().length) {
        postile.user.login(this.username.getValue(), this.password.getValue());
    }
}

postile.view.login.Login.prototype.unloadedStylesheets = ['login.css'];