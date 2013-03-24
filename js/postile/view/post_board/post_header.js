goog.provide('postile.view.post_board.Header');

goog.require('goog.events');
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
    goog.events.listen(this.usernameText_el , goog.events.EventType.CLICK, function(e) {
        new postile.view.image_upload.ImageUploadBlock(this);
    });

    /* testing end */

    this.profileImageContainer_el = postile.dom.getDescendantById(instance.container, 'profile_image_container');
    this.profileImageContainerImg_el = goog.dom.getElementByClass('image', this.profileImageContainer_el);
    this.profileImageContainerImg_el.src = postile.uploadsResource([ this.board.profileData.image_small_url ]);

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
        /* TODO add a notification to the mail box to notify user */
    }.bind(this));

    console.log('/notification/' + instance.board.userData.id);
    postile.faye.subscribe('notification/' + instance.board.userData.id, function(status, data) {
        instance.notificationHandler(data);
    });

    goog.events.listen(message_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.notification.Notification(notificationList)).open(message_button);
    });

    var more_button = postile.dom.getDescendantById(instance.container, "popup_button");
    goog.events.listen(more_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.board_more_pop.BoardMorePop(more_button)).open(more_button);
    });
}

goog.inherits(postile.view.post_board.Header, postile.view.NormalView);

postile.view.post_board.Header.prototype.notificationHandler = function(data) {
    alert('you have a new fucking notification!');
}
