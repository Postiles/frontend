goog.provide('postile.view.post_board.Header');

goog.require('goog.events');
goog.require('postile.dom');

postile.view.post_board.Header = function(board) {

    postile.view.NormalView.call(this);
    
    var instance = this;
    
    this.board = board;
    
    this.container.id = 'title_bar';
    
    postile.ui.load(this.container, postile.staticResource(['post_board_title_bar.html']));
    
    this.topicTitle_el = postile.dom.getDescendantById(instance.container, 'topic_title');

    /*
    postile.ajax([ 'topic', 'get_topic' ], { topic_id: this.board.topic_id }, function(data) {
        instance.board.topic = data.message;
        instance.topicTitle_el.innerHTML = instance.board.topic.name;
    });
    */

    this.usernameText_el = postile.dom.getDescendantById(instance.container, 'username_text');

    this.profileImageContainer_el = postile.dom.getDescendantById(instance.container, 'profile_image_container');
    this.profileImageContainerImg_el = goog.dom.getElementByClass('image', this.profileImageContainer_el);

    /* get user profile */
    /*
    postile.ajax([ 'user', 'get_profile' ], { }, function(data) {
        instance.board.selfUser = data.message.user;
        instance.board.selfProfile = data.message.profile;

        instance.usernameText_el.innerHTML = instance.board.selfUser.username;

        var url = postile.uploadsResource([ instance.board.selfProfile.image_url ]); // to be changed to small image url
        instance.profileImageContainerImg_el.src = url;
    });
    */

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
        (new postile.view.board_more_pop.OtherBoard(switch_board_button)).open(switch_board_button);

    });

    var message_button = postile.dom.getDescendantById(instance.container, "message_button");
    goog.events.listen(message_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.notification.Notification(message_button)).open(message_button);
    });

    var more_button = postile.dom.getDescendantById(instance.container, "popup_button");
    goog.events.listen(more_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.board_more_pop.BoardMorePop(more_button)).open(more_button);
    });
    
    
}

goog.inherits(postile.view.post_board.Header, postile.view.FullScreenView);
