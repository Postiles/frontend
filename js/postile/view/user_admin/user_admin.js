goog.provide('postile.view.user_admin');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.user_admin.create_user = {
    init: function() {
        var submit_button = goog.dom.getElement('confirm_button');
        goog.events.listen(submit_button, goog.events.EventType.CLICK, this.submit);

        var username_input = goog.dom.getElement('username_input');
        var email_input = goog.dom.getElement('email_input');
        var password_input = goog.dom.getElement('password_input');
        var confirm_password_input = goog.dom.getElement('confirm_password_input');

        goog.events.listen(username_input, goog.events.EventType.CHANGE, this.check_value);
    },

    check_value: function(e) { // checks the values of the fields by AJAX
        var type = e.target.name;

        switch (type) {
        case "username":
            var username = e.target.value;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3000/user/check_username_valid');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send('username=' + username);

            xhr.onreadystatechange = function() {
                if (xhr.status == 200) {
                    console.log(xhr.responseText);
                } else {
                    console.log("hehe");
                }
            };
            break;
        case "email":
            var email = e.target.value;
            break;
        case "password":
            var password = e.target.value;
            break;
        case "confirm_password":
            var confirm_password = e.target.value;
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

        if (username == "" || email == "" || password == "" || confirm_password == "") {
        }

    },
}
