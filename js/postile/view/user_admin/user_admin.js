goog.provide('postile.view.user_admin');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.user_admin.create_user = {
    init: function() {
        var submit_button = goog.dom.getElement('confirm_button');
        goog.events.listen(submit_button, goog.events.EventType.CLICK, this.submit);
    },

    submit: function() {
        var username_input = goog.dom.getElement('username_input');
        console.log(username_input);
    }
}
