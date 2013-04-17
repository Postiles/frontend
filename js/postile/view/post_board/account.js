goog.provide('postile.view.post_board.Account');

postile.view.post_board.Account = function(opt_board) {
    goog.base(this);

    postile.ui.load(this.container, postile.conf.staticResource(['account_container.html']));
    
    this.container.id = 'accout_container';
    var instance = this;
    console.log(instance.container);
    this.usernameText_el = postile.dom.getDescendantById(instance.container, 'username_text');
    //this.usernameText_el.innerHTML = this.board.userData.username;

    // change account view for anonymous
    var profileView = new postile.view.profile.ProfileView(localStorage.postile_user_id);
    /* Fei Pure for testing
    this.imageUploadPop = new postile.view.image_upload.ImageUploadBlock(this);
    goog.events.listen(this.usernameText_el, goog.events.EventType.CLICK, function(e) {
        new postile.view.profile.ProfileView(localStorage.postile_user_id);
    });
    */
    // create view for displaying user information
    this.settingButton_el = postile.dom.getDescendantById(instance.container, 'settings_button');

    this.change_password = new postile.view.change_password.ChangePassword(this);
    goog.events.listen(this.settingButton_el, goog.events.EventType.CLICK, function(e){
        this.change_password.open(500);
    }.bind(this));

    /* logout button */
    this.logoutButton_el = postile.dom.getDescendantById(instance.container, 'logout_button');
    goog.events.listen(this.logoutButton_el, goog.events.EventType.CLICK, function(e) {
        postile.user.logout();
    });

    /* testing end */

    this.profileImageContainer_el = postile.dom.getDescendantById(instance.container, 'profile_image_container');
    this.profileImageContainerImg_el = goog.dom.getElementByClass('image', this.profileImageContainer_el);
    postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
        instance.usernameText_el.innerHTML = data.username;
        instance.profileImageContainerImg_el.src = postile.conf.uploadsResource([ data.image_small_url ]);
    }.bind(this));

    console.log(instance.container);
    this.login_button = postile.dom.getDescendantById(this.container, 'login_button_account');
    this.account_container = postile.dom.getDescendantById(this.container, 'user_info_container');
    this.profile_image_container = postile.dom.getDescendantById(this.container, 'profile_image_container');

    goog.events.listen(this.login_button, goog.events.EventType.CLICK, function(){
        // redirect to login
        // TODO 
        // how to make sure that we can go back the same place when login?
        postile.router.dispatch('login');

    }.bind(this));

    console.log(instance.container);

    // preload images for switching
    var switch_board_active = new Image();
    switch_board_active.src = postile.conf.imageResource(['switch_board_icon_active.png']);
    var popup_icon_active = new Image();
    popup_icon_active.src = postile.conf.imageResource(['popup_icon_active.png']);
    var search_icon_active = new Image();
    search_icon_active.src = postile.conf.imageResource(['search_icon_active.png']);
    var message_icon_active = new Image();
    message_icon_active.src = postile.conf.imageResource(['message_icon_active.png']);


    this.alert_wrapper = goog.dom.createDom('div', 'notification_number_wrapper');
    goog.dom.appendChild(this.container, this.alert_wrapper);

    this.redCircle = goog.dom.createDom('div', 'notification_redCircle');
    goog.dom.appendChild(this.alert_wrapper, this.redCircle);

    this.function_buttons = goog.dom.getElementsByClass('function_button');
    for (var i = 0; i < this.function_buttons.length; i++) {
        new postile.view.post_board.FunctionButton(this.function_buttons[i]);
    }

    console.log(instance.container);
    // bool for if this opened
    this.search_button = postile.dom.getDescendantById(instance.container, "search_button");
    console.log(instance.container);
    this.sBTip = new postile.view.search_box.SearchBox(this.search_button);
    goog.events.listen(this.search_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation();
        console.log("sBTip");
        this.notification.close();
        this.switchBoardTip.close();
        this.sBTip.open(search_button);
    }.bind(this), true);

    /* Buttons on the right up corner */
    if (opt_board) {
        this.switchBoardTip = new postile.view.board_more_pop.OtherBoard(opt_board);
        this.switch_board_button = postile.dom.getDescendantById(instance.container, "switch_board_button");
        goog.events.listen(this.switch_board_button, goog.events.EventType.CLICK, function(e) {
            e.stopPropagation();
            console.log("switchBoard");
            this.notification.close();
            this.sBTip.close();
            this.switchBoardTip.open(switch_board_button);
        }.bind(this), true);
    }

    this.message_button = postile.dom.getDescendantById(instance.container, "message_button");

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

    postile.faye.subscribe('notification/' + localStorage.postile_user_id, function(status, data) {
        instance.notificationHandler(data);
    });
    this.notification_isOpened = false;
    this.notification = new postile.view.notification.Notification(this);
    goog.events.listen(this.message_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation();
        console.log("msgB");
        this.switchBoardTip.close();
        this.sBTip.close();  
        this.notification.open(message_button);
        this.notificationHandlerClear();
    }.bind(this), true);

    this.moreButtonPop_isOpened = false;
    this.more_button = postile.dom.getDescendantById(instance.container, "popup_button");
    this.moreButtonPop = new postile.view.board_more_pop.BoardMorePop(this.more_button);
    goog.events.listen(this.more_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation();
        if(this.moreButtonPop_isOpened){
            this.moreButtonPop_isOpened = false;
            this.moreButtonPop.close();
        }else{
            this.moreButtonPop.open(this.more_button);
            this.moreButtonPop_isOpened = true;
        }
    }.bind(this));

    this.changeAccoutView();

    // change account view for anonymous
    goog.events.listen(this.usernameText_el, goog.events.EventType.CLICK, function(){
        if(this.anonymous == true){
            return;
        }
        profileView.open(710);
    }.bind(this));
    goog.events.listen(this.profileImageContainer_el, goog.events.EventType.CLICK, function(){
        if(this.anonymous == true){
            return;
        }
        profileView.open(710);
    }.bind(this));
}

goog.inherits(postile.view.post_board.Account, postile.view.NormalView);

postile.view.post_board.Account.prototype.notificationHandler = function(data) {
    this.notificationHandlerClear();
    goog.dom.classes.add( this.alert_wrapper, 'notification_number_pop_up_wraper_animiation');
    goog.dom.classes.add( this.redCircle, 'notification_number_pop_up_animiation');
}
postile.view.post_board.Account.prototype.notificationHandlerClear = function() {
    goog.dom.classes.remove( this.alert_wrapper, 'notification_number_pop_up_wraper_animiation');
    goog.dom.classes.remove( this.redCircle, 'notification_number_pop_up_animiation');
}

postile.view.post_board.Account.prototype.loadUserInfo = function(){
    /* settings button */
}


// Remember to call change account view after switching the board
postile.view.post_board.Account.prototype.changeAccoutView = function(){

    postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
        this.cur_id = data.user_id;
    }.bind(this)); 
    this.anonymous = 'normal';
    // Here we define Three different interface for different users
    // First one is normal 

    if(!this.cur_id){ // did not login
        this.account_container.style.display = 'none';
        this.profile_image_container.style.display = 'none';
        this.login_button.style.display = 'block';
    }else {
        this.account_container.style.display = 'block';
        this.profile_image_container.style.display = 'block';
        this.login_button.style.display = 'none';

        // get current board type to check if is anonymous
        if(postile.router.current_view instanceof postile.view.post_board.PostBoard){
            this.anonymous = postile.router.current_view.boardData.anonymous;
            if(this.anonymous == true){
                this.profileImageContainerImg_el.src = postile.conf.uploadsResource([ 'default_image/profile.png' ]);
                this.usernameText_el.innerHTML = 'anonymous';
            } else {
                 postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
                     this.usernameText_el.innerHTML = data.username;
                     this.profileImageContainerImg_el.src = postile.conf.uploadsResource([ data.image_small_url ]);
                }.bind(this));
            }
        } else {
            console.log('error, current_view is not a board');
        }
    }
}



