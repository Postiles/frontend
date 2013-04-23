goog.provide('postile.view.change_password');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');
goog.require('postile.toast');

postile.view.change_password.ChangePassword = function(old_pswd) {
    var instance = this;
    postile.view.PopView.call(this);
    this.container.style.width = '500px';
    postile.ui.load(this.container, postile.conf.staticResource(['_change_password.html']));

    this.create_button = postile.dom.getDescendantByCondition(this.container, function(tag) { return tag.tagName && tag.tagName.toUpperCase() == 'A'; });
    this.cur_pass = postile.dom.getDescendantByClass(this.container, "cur_pass");
    this.new_pass = postile.dom.getDescendantByClass(this.container, "new_pass");
    this.con_pass = postile.dom.getDescendantByClass(this.container, "con_pass");
    
    if (old_pswd) {
        this.cur_pass.style.display = 'none';
        postile.dom.getDescendantByClass(this.container, "cptip").style.display = 'none';
    }

    goog.events.listen(this.create_button, goog.events.EventType.CLICK, function() {
        var cur_pass = old_pswd ? old_pswd : goog.string.trim(this.cur_pass.value);
        var new_pass = goog.string.trim(this.new_pass.value);
        var con_pass = goog.string.trim(this.con_pass.value);
        if (!new_pass.length || !con_pass.length || !cur_pass.length) {
            new postile.toast.title_bar_toast("Please fill fields", 3);
            return;
        }
        if(new_pass != con_pass){
            new postile.toast.title_bar_toast("Please type the same password in confirm", 3);
            return;
        }

        postile.ajax(['user', 'change_password'], { old_password: cur_pass, new_password: new_pass}, function(r) {
            console.log(r);
            new postile.toast.title_bar_toast("Password modification was successful", 3);
            this.close();
        }.bind(this));
    }.bind(this));

    this.addCloseButton(this.container);
}

goog.inherits(postile.view.change_password.ChangePassword, postile.view.PopView);

postile.view.change_password.ChangePassword.prototype.unloaded_stylesheets = ['change_password.css'];
