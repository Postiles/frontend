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

            this.gender_el = goog.dom.getElement("gender");
            this.gender_el.value = profile.gender;

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

    init: function() {
        var profileItems = goog.dom.getElementsByClass('editable');
        for (var i = 0; i < profileItems.length; i++) {
            item = new postile.view.profile.ProfileItem(profileItems[i]);
        }
    },
}

postile.view.profile.ProfileItem = function(baseDom) { // constructor
    this.baseDom = baseDom;
    this.className = goog.dom.classes.get(this.baseDom)[0];

    this.data_el = goog.dom.getElementByClass('data', this.baseDom);
    this.edit_el = goog.dom.getElementByClass('edit', this.baseDom);

    this.clearEvent();
}

postile.view.profile.ProfileItem.prototype.clearEvent = function() {
    this.data_val = this.data_el.innerHTML;

    goog.events.removeAll(this.edit_el);
    goog.events.listen(this.edit_el, goog.events.EventType.CLICK, this.editClicked.bind(this));
}

postile.view.profile.ProfileItem.prototype.editClicked = function() {
    this.data_el.innerHTML = '';

    if (this.className == 'item') {
        this.input_el = goog.dom.createDom('input', null);
    } else {
        this.input_el = goog.dom.createDom('textarea', null);
    }
    this.input_el.value = this.data_val;
    goog.dom.appendChild(this.data_el, this.input_el);

    this.edit_el.innerHTML = 'Save';

    goog.events.removeAll(this.edit_el);
    goog.events.listen(this.edit_el, goog.events.EventType.CLICK, this.saveClicked.bind(this));
}

postile.view.profile.ProfileItem.prototype.saveClicked = function() {
    this.data_el.innerHTML = this.input_el.value;

    this.edit_el.innerHTML = 'Edit';

    this.clearEvent();
}
