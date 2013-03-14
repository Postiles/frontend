goog.provide('postile.view.profile');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.profile.ProfileView = function(id) { // constructor
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_profile_preview.html']));

    this.profile_el = goog.dom.getElementByClass('profile-preview', this.container);

    this.user_id = id;

    postile.ajax([ 'user', 'get_profile' ], { target_user_id: this.user_id }, function(data) {
        this.profile = data.message.profile;

        this.initItems();
        this.initExitButton();
        this.open(710); // magic width
    }.bind(this));
}

// Profile is a subclass of PopView
goog.inherits(postile.view.profile.ProfileView, postile.view.PopView);

postile.view.profile.ProfileView.prototype.unloaded_stylesheets = ['_profile_preview.css'];

postile.view.profile.ProfileView.prototype.displayableItems = [
    [ 'location', 'Lives in ', 'profile-preview/work-icon.png' ], 
    [ 'work', 'Works at ', 'profile-preview/work-icon.png' ],
    [ 'education', 'Attends ', 'profile-preview/work-icon.png' ],
];

postile.view.profile.ProfileView.prototype.initExitButton = function() {
    this.exitButton = goog.dom.getElementByClass('exit-button', this.container);
    goog.events.listen(this.exitButton, goog.events.EventType.CLICK, function(e) {
        this.close();
    }.bind(this));
}

postile.view.profile.ProfileView.prototype.initItems = function() {
    /* init a container for all the editable profile items */
    this.profileItems = [ ];

    this.picture_el = goog.dom.getElementByClass('picture', this.container);
    this.pictureImg_el = goog.dom.getElementsByTagNameAndClass('img', null, this.picture_el)[0];
    this.pictureImg_el.src = postile.uploadsResource([ this.profile.image_url ]);

    this.name_el = goog.dom.getElementByClass('name', this.container);
    this.name_el.innerHTML = this.profile.first_name + ' ' + this.profile.last_name;

    this.signiture_el = goog.dom.getElementByClass('signiture', this.container);
    this.signitureData_el = goog.dom.getElementByClass('data', this.signiture_el);
    this.signitureData_el.innerHTML = this.profile.signiture;
    this.profileItems.push(this.signiture_el); // editable

    this.selfIntro_el = goog.dom.getElementByClass('self-intro', this.container);
    this.selfIntroData_el = goog.dom.getElementByClass('data', this.selfIntro_el);
    this.selfIntroData_el.innerHTML = this.profile.self_intro;
    this.profileItems.push(this.selfIntro_el); // editable

    /* display the valid data items available in the profile */
    this.itemContainer_el = goog.dom.getElementByClass('item-container', this.container);

    for (i in this.displayableItems) {
        var item = this.displayableItems[i];
        var itemName = item[0];

        if (this.profile[itemName]) {
            var itemDiscriptive = item[1];
            var itemIcon = item[2];
            var itemValue = this.profile[itemName];

            /* create new data item */
            var newItem = goog.dom.createDom('div', 'item');
            goog.dom.appendChild(this.itemContainer_el, newItem);

            var newItemIcon = goog.dom.createDom('div', 'icon');
            goog.dom.appendChild(newItem, newItemIcon);

            var newItemIconImg = goog.dom.createDom('img', null);
            newItemIconImg.src = postile.imageResource([ itemIcon ]);
            goog.dom.appendChild(newItemIcon, newItemIconImg);

            var newItemText = goog.dom.createDom('div', 'text');
            newItemText.innerHTML = itemDiscriptive;
            goog.dom.appendChild(newItem, newItemText);

            var newItemTextData = goog.dom.createDom('span', 'data');
            newItemTextData.innerHTML = itemValue;
            goog.dom.appendChild(newItemText, newItemTextData);

            var newItemEditButton = goog.dom.createDom('div', 'edit');
            newItemEditButton.innerHTML = 'edit';
            goog.dom.appendChild(newItem, newItemEditButton);

            this.profileItems.push(newItem); // add item to container for editing
        }
    }

    /* init edit function of data items */
    for (i in this.profileItems) {
        item = new postile.view.profile.ProfileItem(this.profileItems[i]);
    }
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
