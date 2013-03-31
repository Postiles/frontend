goog.provide('postile.view.create_user');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.create_user = {
    init: function() {
        var submit_button = goog.dom.getElement('confirm_button');
        goog.events.listen(submit_button, goog.events.EventType.CLICK, this.submit);

        var username_input = goog.dom.getElement('username_input');
        var email_input = goog.dom.getElement('email_input');
        var password_input = goog.dom.getElement('password_input');
        var confirm_password_input = goog.dom.getElement('confirm_password_input');

        goog.events.listen(username_input, goog.events.EventType.CHANGE, this.check_value);
        goog.events.listen(email_input, goog.events.EventType.CHANGE, this.check_value);
        goog.events.listen(password_input, goog.events.EventType.CHANGE, this.check_value);
        goog.events.listen(confirm_password_input, goog.events.EventType.CHANGE, this.check_value);
    },

    check_value: function(e) { // checks the values of the fields by AJAX
        var type = e.target.name;

        switch (type) {
        case "username":
            var username = e.target.value;
            var username_valid = goog.dom.getElement('username_valid');

            var onsuccess = function(data) { // username not used
                username_valid.innerHTML = 'ok!';
            };

            var onfailure = function(data) { // username used
                username_valid.innerHTML = data.message;
            };

            postile.ajax(['user', 'check_username_valid'], { username: username }, onsuccess, onfailure);
            break;

        case "email":
            var email = e.target.value;
            var email_valid = goog.dom.getElement('email_valid');

            var onsuccess = function(data) {
                email_valid.innerHTML = 'ok!';
            };

            var onfailure = function(data) {
                email_valid.innerHTML = data.message;
            };

            postile.ajax(['user', 'check_email_valid'], { email: email }, onsuccess, onfailure);
            break;

        case "password":
            var password = e.target.value;
            var password_valid = goog.dom.getElement('password_valid');

            var onsuccess = function(data) {
                password_valid.innerHTML = 'ok!';
            };

            var onfailure = function(data) {
                password_valid.innerHTML = data.message;
            };

            postile.ajax(['user', 'check_password_valid'], { password: password }, onsuccess, onfailure);
            break;

        case "confirm_password":
            var password = goog.dom.getElement('password_input').value;
            var confirm_password = e.target.value;
            var confirm_password_valid = goog.dom.getElement('confirm_password_valid');

            var onsuccess = function(data) {
                confirm_password_valid.innerHTML = 'ok!';
            };

            var onfailure = function(data) {
                confirm_password_valid.innerHTML = data.message;
            };

            postile.ajax(['user', 'check_password_confirm'], 
                    { password: password, confirm_password: confirm_password }, onsuccess, onfailure);
            break;
        }
    },

    submit: function() {
        var username_input = goog.dom.getElement('username_input');
        var email_input = goog.dom.getElement('email_input');
        var password_input = goog.dom.getElement('password_input');
        var confirm_password_input = goog.dom.getElement('confirm_password_input');

        var username = username_input.value;
        var email = email_input.value;
        var password = password_input.value;
        var confirm_password = confirm_password_input.value;

        var onsuccess = function(data) {
            alert("account successfully created!");
        };

        var onfailure = function(data) {
            alert("account cannot be created!");
        };

        if (username != "" && email != "" && password != "" 
                && confirm_password != "" && password == confirm_password) {
            postile.ajax(['user', 'create'],
                    {
                        username: username, 
                        email: email, 
                        password: password, 
                        confirm_password: confirm_password
                    }, onsuccess, onfailure);
        }
    }
}
