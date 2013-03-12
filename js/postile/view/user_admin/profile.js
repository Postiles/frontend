goog.provide('postile.view.profile');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.profile.ProfileView = function() { // constructor
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_profile_preview.html']));

    this.exitButton = goog.dom.getElementByClass('exit-button', this.container);
    goog.events.listen(this.exitButton, goog.events.EventType.CLICK, function(e) {
        this.close();
    }.bind(this));

    this.profileItems = goog.dom.getElementsByClass('editable', this.container);
    console.log('hehe');
    console.log(this.profileItems);
    for (var i = 0; i < this.profileItems.length; i++) {
        item = new postile.view.profile.ProfileItem(this.profileItems[i]);
    }
}

// Profile is a subclass of PopView
goog.inherits(postile.view.profile.ProfileView, postile.view.PopView);

postile.view.profile.ProfileView.prototype.unloaded_stylesheets = ['_profile_preview.css'];

postile.view.profile.ProfileItem = function(baseDom) { // constructor
    console.log(baseDom);
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
