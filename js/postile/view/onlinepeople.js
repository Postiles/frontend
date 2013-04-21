goog.provide('postile.view.onlinepeople');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.math');
goog.require('postile.dom');

/**
 * The major view of online people , inherits TipView to gain the property
 * of absolute positioning. It's position is calculated based on the
 * title_bar.
 *@constructor
 */
postile.view.onlinepeople.OnlinePeople = function(header) {
    this.BAR_WIDTH = 300;
    var instance = this;
    this.title_bar = header;
    //inherits TipView
    postile.view.TipView.call(this);
    this.container.id="onlinepeople_container"
    postile.ui.load(this.container,
            postile.conf.staticResource(['_onlinepeople.html']));
    this.container.style.top = '0px';
    this.container.style.left = '0px';

    this.online_bar = postile.dom.getDescendantById(
        this.container,'online_people_bar');
    this.online_list = postile.dom.getDescendantById(
        this.container,'online_people_list');

    this.expanded = false;
}


goog.inherits(postile.view.onlinepeople.OnlinePeople, postile.view.TipView);


postile.view.onlinepeople.OnlinePeople.prototype.render = function() {
    var title_bar_bound = goog.style.getBounds(this.title_bar.container);
    //Testing code here ===============
    var item = new postile.view.onlinepeople.Item();
    //item.renderItem(this,"Testing ");
    //Testing end =====================



    var coord = new goog.math.Coordinate(title_bar_bound.width,
                             title_bar_bound.height);
    coord.x = coord.x - this.BAR_WIDTH;
    goog.style.setPosition(this.container_wrap, coord);
    goog.dom.appendChild(this.title_bar.container, this.container_wrap);
}

postile.view.onlinepeople.OnlinePeople.prototype.unloaded_stylesheets = ['onlinepeople.css'];

postile.view.onlinepeople.Item = function() {
}

postile.view.onlinepeople.Item.prototype.renderItem = function(parent, user_id) {
    var container = parent.online_list;
    this.item_container = goog.dom.createDom('div', 'item_container');
    postile.ui.load(this.item_container,
                postile.conf.staticResource(['_online_people_item.html']));
    this.profile_img = postile.dom.getDescendantByClass(
        this.item_container,
        'onlinepeople_profile');
    this.name_container = postile.dom.getDescendantByClass(
        this.item_container,'name');
    this.act_container = postile.dom.getDescendantByClass(
        this.item_container,'activity');

    postile.data_manager.getUserData(user_id, function(data) {
        this.name_container.innerHTML = data.username;
        this.profile_img.src = postile.conf.uploadsResource(
            [data.image_small_url]);
    }.bind(this));

    goog.dom.appendChild(container,this.item_container);
}
