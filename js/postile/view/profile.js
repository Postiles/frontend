goog.provide('postile.view.profile');

goog.require('postile.view');
goog.require('postile.data_manager');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');

postile.view.profile.ProfileView = function(id) { // constructor
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_profile_preview.html']));

    this.profile_el = goog.dom.getElementByClass('profile-preview', this.container);

    this.user_id = id;

    postile.data_manager.getUserData(this.user_id, function(data) {
        this.userData = data;
        this.initItems();

        this.addCloseButton(this.profile_el);
    }.bind(this));
}

// Profile is a subclass of PopView
goog.inherits(postile.view.profile.ProfileView, postile.view.PopView);

postile.view.profile.ProfileView.prototype.unloaded_stylesheets = ['_profile_preview.css', '_close_button.css'];

postile.view.profile.ProfileView.prototype.displayableItems = [
    { name: 'location', description: 'Lives in ', icon: 'profile-preview/work-icon.png' }, 
    { name: 'work', description: 'Works at ', icon: 'profile-preview/work-icon.png' },
    { name: 'education', description: 'Attends ', icon: 'profile-preview/work-icon.png' },
    { name: 'hometown', description: 'Comes from ', icon: 'profile-preview/work-icon.png' }
];

postile.view.profile.ProfileView.prototype.findDescriptionByName = function(name) {
    for (var i in this.displayableItems) {
        var item = this.displayableItems[i];
        if (item.name == name) {
            return item.description;
        }
    }
}

postile.view.profile.ProfileView.prototype.initItems = function() {
    /* init a container for all the editable profile items */
    this.profileItems = [ ];

    this.picture_el = goog.dom.getElementByClass('picture', this.container);
    this.pictureImg_el = goog.dom.getElementsByTagNameAndClass('img', null, this.picture_el)[0];
    this.pictureImg_el.src = postile.conf.uploadsResource([ this.userData.image_url ]);

    this.name_el = goog.dom.getElementByClass('username', this.container);
    goog.dom.classes.add(this.name_el, 'item');
    this.nameData_el = goog.dom.getElementByClass('data', this.name_el);
    this.nameData_el.innerHTML = this.userData.username;

    this.name_el.setAttribute('data-item', 'username');

    this.profileItems.push(this.name_el); // editable

    this.signiture_el = goog.dom.getElementByClass('signiture', this.container);
    this.signitureData_el = goog.dom.getElementByClass('data', this.signiture_el);
    this.signitureData_el.innerHTML = this.userData.signiture;

    this.signiture_el.setAttribute('data-item', 'signiture');
    
    this.profileItems.push(this.signiture_el); // editable

    this.selfIntro_el = goog.dom.getElementByClass('self-intro', this.container);
    this.selfIntroData_el = goog.dom.getElementByClass('data', this.selfIntro_el);
    this.selfIntroData_el.innerHTML = this.userData.personal_description;

    this.selfIntro_el.setAttribute('data-item', 'personal_description');

    this.profileItems.push(this.selfIntro_el); // editable

    if (this.isSelfProfile()) {
        this.pictureEdit_el = goog.dom.createDom('span', 'edit');
        this.pictureEdit_el.innerHTML = 'Edit Profile Picture';
        goog.dom.appendChild(this.picture_el, this.pictureEdit_el);

        this.imageUploadPop = new postile.view.image_upload.ImageUploadBlock(this);
        goog.events.listen(this.pictureEdit_el, goog.events.EventType.CLICK, function(e) {
            // this.mask.style.display = 'hidden';
            postile.uploader.upload_path = 'profile_image';
            this.imageUploadPop.open(this);
        }.bind(this));

        this.nameEdit_el = goog.dom.createDom('span', 'edit');
        this.nameEdit_el.innerHTML = 'Edit';
        goog.dom.appendChild(this.name_el, this.nameEdit_el);

        this.signitureEdit_el = goog.dom.createDom('span', 'edit');
        this.signitureEdit_el.innerHTML = 'Edit';
        goog.dom.appendChild(this.signiture_el, this.signitureEdit_el);

        this.selfIntroEdit_el = goog.dom.createDom('span', 'edit');
        this.selfIntroEdit_el.innerHTML = 'Edit';
        goog.dom.appendChild(this.selfIntro_el, this.selfIntroEdit_el);
    }
    /* display the valid data items available in the profile */
    this.itemContainer_el = goog.dom.getElementByClass('item-container', this.container);

    for (i in this.displayableItems) {
        var item = this.displayableItems[i];

        if (this.userData[item.name] // item exists, should display
                || this.isSelfProfile()) {
            var itemValue = this.userData[item.name];

            /* create new data item */
            var newItem = goog.dom.createDom('div', 'item');
            goog.dom.appendChild(this.itemContainer_el, newItem);

            var newItemIcon = goog.dom.createDom('div', 'icon');
            goog.dom.appendChild(newItem, newItemIcon);

            var newItemIconImg = goog.dom.createDom('img', null);
            newItemIconImg.src = postile.conf.imageResource([ item.icon ]);
            goog.dom.appendChild(newItemIcon, newItemIconImg);

            var newItemText = goog.dom.createDom('div', 'text');

            var newItemTextTitle = goog.dom.createDom('span', 'title');

            if (!this.userData[item.name] && this.isSelfProfile) {
                newItemTextTitle.innerHTML = item.name;
                newItemTextTitle.style.opacity = '0.3';
            } else {
                newItemTextTitle.innerHTML = item.description;
            }

            goog.dom.appendChild(newItemText, newItemTextTitle);
            goog.dom.appendChild(newItem, newItemText);

            var newItemTextData = goog.dom.createDom('span', 'data');
            newItemTextData.innerHTML = itemValue;
            goog.dom.appendChild(newItemText, newItemTextData);

            newItem.setAttribute('data-item', item.name);

            if (this.isSelfProfile()) {
                var newItemEditButton = goog.dom.createDom('div', 'edit');
                newItemEditButton.innerHTML = 'Edit';
                goog.dom.appendChild(newItem, newItemEditButton);
            }

            this.profileItems.push(newItem); // add item to container for editing
        }
    }

    /* init edit function of data items */
    for (i in this.profileItems) {
        new postile.view.profile.ProfileItem(this.profileItems[i], this);
    }
}

postile.view.profile.ProfileView.prototype.changePicture = function(image_link){
    this.pictureImg_el.src = postile.conf.uploadsResource([ this.userData.image_url ]);
}

postile.view.profile.ProfileView.prototype.isSelfProfile = function() {
    return this.user_id == localStorage.postile_user_id;
}

postile.view.profile.ProfileItem = function(baseDom, profileInstance) { // constructor
    this.baseDom = baseDom;
    this.className = goog.dom.classes.get(this.baseDom)[0];

    this.item = this.baseDom.getAttribute('data-item');

    this.text_el = goog.dom.getElementByClass('text', this.baseDom);
    this.title_el = goog.dom.getElementByClass('title', this.baseDom);
    this.data_el = goog.dom.getElementByClass('data', this.baseDom);
    this.edit_el = goog.dom.getElementByClass('edit', this.baseDom);

    if (profileInstance.isSelfProfile()) {
        this.clearEvent();
    }
}

postile.view.profile.ProfileItem.prototype.clearEvent = function() {
    this.data_val = this.data_el.innerHTML;

    goog.events.removeAll(this.edit_el);
    goog.events.listen(this.edit_el, goog.events.EventType.CLICK, this.editClicked.bind(this));
}

postile.view.profile.ProfileItem.prototype.editClicked = function() {
    this.data_el.innerHTML = '';

    /*
    if (!this.data_val) { // data val not set
        for (var i in postile.view.profile.ProfileView.prototype.displayableItems) {
            var displayableItem = postile.view.profile.ProfileView.prototype.displayableItems[i];
            if (displayableItem.name == this.item) {
                this.text_el.innerHTML = displayableItem.description;
                break;
            }
        }
        this.text_el.style.opacity = '1.0';
    }
    */

    if (this.className == 'signiture' ||
            this.className == 'self-intro') {
        this.input_el = goog.dom.createDom('textarea', null);
    } else {
        this.input_el = goog.dom.createDom('input', null);
    }

    this.input_el.value = this.data_val;

    goog.dom.appendChild(this.data_el, this.input_el);

    this.edit_el.innerHTML = 'Save';

    goog.events.removeAll(this.edit_el);

    // set focus on the input field
    this.input_el.focus();

    goog.events.listen(this.edit_el, goog.events.EventType.CLICK, this.saveTriggered.bind(this));

    /* save when enter key is pressed */
    goog.events.listen(this.input_el, goog.events.EventType.KEYDOWN, function(e) {
        if (e.keyCode == 13) { // enter pressed
            this.saveTriggered();
        }
    }.bind(this));
}

postile.view.profile.ProfileItem.prototype.saveTriggered = function() {
    postile.ajax([ 'profile', 'update_profile_item' ], 
        { item: this.item, value: this.input_el.value }, 
        function() {
            this.data_el.innerHTML = this.input_el.value;
            this.edit_el.innerHTML = 'Edit';

            if (this.className != 'signiture' &&
                    this.className != 'self-intro' &&
                    this.className != 'username') {
                if (this.data_el.innerHTML) {
                    var description = postile.view.profile.ProfileView.prototype.findDescriptionByName(this.item);
                    this.title_el.innerHTML = description;
                    this.title_el.style.opacity = 1.0;
                } else {
                    this.title_el.innerHTML = this.item;
                    this.title_el.style.opacity = 0.3;
                }
            }

            this.clearEvent();

            postile.data_manager.markDataDirty(localStorage.postile_user_id); // user data changed, mark as dirty
        }.bind(this));
}
