goog.provide('postile.view.profile');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.profile = {
    get_profile: function(user_id) {
        var onsuccess = function(data) {
            var user = data.message.user;
            var profile = data.message.profile;

            for (var attr in user) {
                profile[attr] = user[attr];
            }
            console.log(profile);

            this.username_el = goog.dom.getElement("username");
            this.username_el.innerHTML = profile.username;

            this.email_el = goog.dom.getElement("email");
            this.email_el.innerHTML = profile.email;

            this.firstname_el = goog.dom.getElement("firstname");
            this.firstname_el.innerHTML = profile.first_name;

            this.lastname_el = goog.dom.getElement("lastname");
            this.lastname_el.innerHTML = profile.last_name;
        };

        var onfailure = function(data) {
        };

        postile.ajax(['user', 'get_profile'], { }, onsuccess, onfailure);
    }
}
