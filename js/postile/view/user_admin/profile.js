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

            this.username_el = goog.dom.getElement("username");
            this.username_el.innerHTML = profile.username;

            this.email_el = goog.dom.getElement("email");
            this.email_el.innerHTML = profile.email;

            this.first_name_el = goog.dom.getElement("first_name");
            this.first_name_el.innerHTML = profile.first_name;

            this.last_name_el = goog.dom.getElement("last_name");
            this.last_name_el.innerHTML = profile.last_name;
        };

        var onfailure = function(data) {
        };

        postile.ajax(['user', 'get_profile'], { }, onsuccess, onfailure);
    },

    get_profile_for_edit: function(user_id) {
        var onsuccess = function(data) {
            var user = data.message.user;
            var profile = data.message.profile;

            for (var attr in user) {
                profile[attr] = user[attr];
            }
            console.log(profile);

            this.first_name_el = goog.dom.getElement("first_name");
            this.first_name_el.value = profile.first_name;

            this.last_name_el = goog.dom.getElement("last_name");
            this.last_name_el.value = profile.last_name;

            this.submit_button = goog.dom.getElement("submit_button");
            goog.events.listen(this.submit_button, goog.events.EventType.CLICK, 
                    function() {
                        var params = {
                            first_name: this.first_name_el.value,
                            last_name: this.last_name_el.value,
                        };
                        postile.view.profile.save_profile(params);
                    }.bind(this));
        };

        var onfailure = function(data) {
            console.log(data);
        };

        postile.ajax(['user', 'get_profile'], { }, onsuccess, onfailure);
    },

    save_profile: function(params) {
        var onsuccess = function(data) {
            console.log(data);
        };

        var onfailure = function(data) {
            console.log(data);
        };

        postile.ajax(['profile', 'save_profile'], params, onsuccess, onfailure);
    },
}
