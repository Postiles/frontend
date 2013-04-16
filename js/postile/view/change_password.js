goog.provide('postile.view.change_password');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');
goog.require('postile.toast');

postile.view.change_password.ChangePassword = function() {
    var instance = this;
    postile.view.PopView.call(this);
    this.container.style.width = '500px';
    postile.ui.load(this.container, postile.conf.staticResource(['_change_password.html']));

    this.create_button = postile.dom.getDescendantByCondition(this.container, function(tag) { return tag.tagName && tag.tagName.toUpperCase() == 'A'; });
    this.cur_pass = postile.dom.getDescendantByClass(this.container, "cur_pass");
    this.new_pass = postile.dom.getDescendantByClass(this.container, "new_pass");
    this.con_pass = postile.dom.getDescendantByClass(this.container, "con_pass");

    goog.events.listen(this.create_button, goog.events.EventType.CLICK, function() {
        var cur_pass = goog.string.trim(this.cur_pass.value);
        var new_pass = goog.string.trim(this.new_pass.value);
        var con_pass = goog.string.trim(this.con_pass.value);
        if (!new_pass.length || !con_pass.length || !cur_pass.length) {
            //new postile.toast.Toast(5, postile._('Please fill fields.'), [], 'red');
            new postile.toast.Toast(5, "Please fill fields");
            return;
        }
        if(new_pass != con_pass){
            new postile.toast.Toast(5, "Please type the same password in confirm");
            return;
        }

        postile.ajax(['user', 'change_password'], { old_password: cur_pass, new_password: new_pass}, function(r) {
            console.log(r);
            new postile.toast.Toast(5, "Password modification was successful");
            this.close();
        }.bind(this));
    }.bind(this));

    this.addCloseButton(this.container);
}

goog.inherits(postile.view.change_password.ChangePassword, postile.view.PopView);

postile.view.change_password.ChangePassword.prototype.unloaded_stylesheets = ['change_password.css'];
