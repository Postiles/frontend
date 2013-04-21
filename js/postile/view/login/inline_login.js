goog.provide('postile.view.inline_login');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.dom');


postile.view.inline_login.InlineLogin = function(instance){
	postile.view.TipView.call(this);

	// indication of invalid email and password
	postile.ui.load(this.container, postile.conf.staticResource(['_inline_login.html']));
	this.container.id = 'inline_login';
    this.container.style.top = '0px';
    this.container.style.left = '0px';

	this.incorrect_el = postile.dom.getDescendantById(this.container, 'incorrect-alert');
	this.email_input_el = postile.dom.getDescendantsByClass(this.container, 'inline_login_email')[0];
	this.password_input_el = postile.dom.getDescendantsByClass(this.container, 'inline_login_password')[0];
	this.submit_el = postile.dom.getDescendantsByClass(this.container, 'inline_login_submit')[0];

	goog.events.listen(this.submit_el, goog.events.EventType.CLICK, function(){
		this.login(this.email_input_el.value, this.password_input_el.value);
	}.bind(this));

	goog.events.listen(this.password_input_el, goog.events.EventType.KEYUP, function(e){
		if(e.keyCode == 13){
			this.login(this.email_input_el.value, this.password_input_el.value);
		}
	}.bind(this));

}

goog.inherits(postile.view.inline_login.InlineLogin, postile.view.TipView);

postile.view.inline_login.InlineLogin.prototype.unloaded_stylesheets = ['inline_login.css'];

postile.view.inline_login.InlineLogin.prototype.open = function(a, b){
	postile.view.TipView.prototype.open.call(this,a,b);
	// goog.base(this, 'open', a, b);
	this.incorrect_el.style.display = 'none';
}


postile.view.inline_login.InlineLogin.prototype.login = function(email, password){
	postile.user.login(email, password, function(data) {
    	window.location.reload();
    }, function(e) {
        this.incorrect_el.style.display = 'block';
    }.bind(this));
}