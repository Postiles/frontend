goog.provide('postile.view.post_board.Header');

goog.require('goog.events');
goog.require('goog.dom');
goog.require('postile.dom');
goog.require('postile.view.notification');

postile.view.post_board.Header = function(board) {
    postile.view.NormalView.call(this);
    
    var instance = this;
    
    this.board = board;

    this.container.id = 'title_bar';
    
    postile.ui.load(this.container, postile.staticResource(['post_board_title_bar.html']));
    
    this.topicTitle_el = postile.dom.getDescendantById(instance.container, 'topic_title');
    instance.topicTitle_el.innerHTML = this.board.boardData.name;

    this.topicImgContainer_el = postile.dom.getDescendantById(instance.container, 'topic_image_container');
    this.topicImg_el = postile.dom.getDescendantByClass(this.topicImgContainer_el, 'topic_image');
    this.topicImg_el.src = postile.uploadsResource( [this.board.boardData.image_small_url] );

    this.usernameText_el = postile.dom.getDescendantById(instance.container, 'username_text');
    this.usernameText_el.innerHTML = this.board.userData.username;

    /* Fei Pure for testing */
    goog.events.listen(this.usernameText_el, goog.events.EventType.CLICK, function(e) {
        new postile.view.image_upload.ImageUploadBlock(this);
    });

    /* settings button */
    this.settingButton_el = postile.dom.getDescendantById(instance.container, 'setting_button');

    /* logout button */
    this.logoutButton_el = postile.dom.getDescendantById(instance.container, 'logout_button');
    goog.events.listen(this.logoutButton_el, goog.events.EventType.CLICK, function(e) {
        postile.user.logout();
    });

    /* testing end */

    this.profileImageContainer_el = postile.dom.getDescendantById(instance.container, 'profile_image_container');
    this.profileImageContainerImg_el = goog.dom.getElementByClass('image', this.profileImageContainer_el);
    this.profileImageContainerImg_el.src = postile.uploadsResource([ this.board.profileData.image_small_url ]);

    this.alert_wrapper = goog.dom.createDom('div', 'notificatoin_number_wrapper');
    goog.dom.appendChild(this.container, this.alert_wrapper);

    this.redCircle = goog.dom.createDom('div', 'notification_redCircle');
    goog.dom.appendChild(this.alert_wrapper, this.redCircle);

    this.function_buttons = goog.dom.getElementsByClass('function_button');
    for (var i = 0; i < this.function_buttons.length; i++) {
        new postile.view.post_board.FunctionButton(this.function_buttons[i]);
    }

    var search_button = postile.dom.getDescendantById(instance.container, "search_button");
    goog.events.listen(search_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.search_box.SearchBox(search_button)).open(search_button);
    });

    /* Buttons on the right up corner */
    var switch_board_button = postile.dom.getDescendantById(instance.container, "switch_board_button");
    goog.events.listen(switch_board_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.board_more_pop.OtherBoard(this.board)).open(switch_board_button);
    }.bind(this));

    var message_button = postile.dom.getDescendantById(instance.container, "message_button");

    var notificationList;
    /* get hte number of new notifications from server */
    postile.ajax([ 'notification', 'get_notifications' ], {}, function(data) {
        /* handle the data return after getting the boards information back */
        notificationList = data.message.notifications;
        if(notificationList.length != 0 ) {
            this.notificationHandler(data);
        }
        /* TODO add a notification to the mail box to notify user */
    }.bind(this));

    console.log('/notification/' + instance.board.userData.id);
    postile.faye.subscribe('notification/' + instance.board.userData.id, function(status, data) {
        instance.notificationHandler(data);
    });

    goog.events.listen(message_button, goog.events.EventType.CLICK, function(e) {
        this.notification = new postile.view.notification.Notification(this);
        this.notification.open(message_button);
        this.notificationHandlerClear();
    }.bind(this));

    var more_button = postile.dom.getDescendantById(instance.container, "popup_button");
    goog.events.listen(more_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.board_more_pop.BoardMorePop(more_button)).open(more_button);
    });
}

goog.inherits(postile.view.post_board.Header, postile.view.NormalView);

postile.view.post_board.Header.prototype.notificationHandler = function(data) {
    this.notificationHandlerClear();
    goog.dom.classes.add( this.alert_wrapper, 'notification_number_pop_up_wraper_animiation');
    goog.dom.classes.add( this.redCircle, 'notification_number_pop_up_animiation');
}
postile.view.post_board.Header.prototype.notificationHandlerClear = function() {
    goog.dom.classes.remove( this.alert_wrapper, 'notification_number_pop_up_wraper_animiation');
    goog.dom.classes.remove( this.redCircle, 'notification_number_pop_up_animiation');
}
