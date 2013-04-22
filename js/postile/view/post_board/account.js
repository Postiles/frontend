goog.provide('postile.view.post_board.Account');

goog.require('postile.view.inline_login');

postile.view.post_board.Account = function(optBoardData) {
    goog.base(this);

    /**
     * Stores the faye subscription for future disposal.
     * @type {goog.async.Deferred}
     * @private
     */
    this.fayeSubscrDfd_ = null;

    postile.ui.load(this.container, postile.conf.staticResource(['account_container.html']));
    
    this.container.id = 'accout_container';
    var instance = this;
    this.usernameText_el = postile.dom.getDescendantById(instance.container, 'username_text');
    //this.usernameText_el.innerHTML = this.board.userData.username;


    // create view for displaying user information
    this.settingButton_el = postile.dom.getDescendantById(instance.container, 'settings_button');

    this.change_password = new postile.view.change_password.ChangePassword();
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

    if (postile.conf.userLoggedIn()) {
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            instance.usernameText_el.innerHTML = data.username;
            instance.profileImageContainerImg_el.src = postile.conf.uploadsResource([ data.image_small_url ]);
        }.bind(this));
    }

    this.login_button = postile.dom.getDescendantById(this.container, 'login_button_account');
    this.signup_button = postile.dom.getDescendantById(this.container, 'signup_button_account');

    this.account_container = postile.dom.getDescendantById(this.container, 'user_info_container');

    this.inline_login = new postile.view.inline_login.InlineLogin(this.login_button);
    goog.events.listen(this.login_button, goog.events.EventType.CLICK, function(e){
        // how to make sure that we can go back the same place when login?
        e.stopPropagation();
        this.inline_login.open(this.login_button);
        if (optBoardData) {
            this.switchBoardTip.close();
        }
        this.sBTip.close();
    }.bind(this));

    goog.events.listen(this.signup_button, goog.events.EventType.CLICK, function(e){
        e.stopPropagation();
        postile.router.dispatch('signup');
    }.bind(this));

    // preload images for switching
    if (optBoardData) {
        var switch_board_active = new Image();
        switch_board_active.src = postile.conf.imageResource(['switch_board_icon_active.png']);
    }
    var popup_icon_active = new Image();
    popup_icon_active.src = postile.conf.imageResource(['popup_icon_active.png']);
    var search_icon_active = new Image();
    search_icon_active.src = postile.conf.imageResource(['search_icon_active.png']);
    if (optBoardData) {
        var message_icon_active = new Image();
        message_icon_active.src = postile.conf.imageResource(['message_icon_active.png']);
    }

    this.function_buttons = postile.dom.getDescendantsByClass(this.container, 'function_button');
    for (var i = 0; i < this.function_buttons.length; i++) {
        if ((!optBoardData && i == 0) || i == 3) {
            goog.dom.removeNode(this.function_buttons[i]); 
        } else {
            // no longer needed, depracated
            //new postile.view.post_board.FunctionButton(this.function_buttons[i]);
        }
    }

    // bool for if this opened
    this.search_button = postile.dom.getDescendantById(instance.container, "search_button");
    this.sBTip = new postile.view.search_box.SearchBox(this.search_button);
    goog.events.listen(this.search_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation();
        if(this.logged_in){
            this.notification.close();
        }
        if (optBoardData) {
            this.switchBoardTip.close();
        }
        this.sBTip.open(this.search_button);
        this.inline_login.close();
    }.bind(this), true);

    /* Buttons on the right up corner */
    if (optBoardData) {
        this.switchBoardTip = new postile.view.board_more_pop.OtherBoard(optBoardData);
        this.switch_board_button = postile.dom.getDescendantById(instance.container, "switch_board_button");
        goog.events.listen(this.switch_board_button, goog.events.EventType.CLICK, function(e) {
            e.stopPropagation();
            if(this.logged_in){
                this.notification.close();
            }
            this.sBTip.close();
            this.switchBoardTip.open(this.switch_board_button);
            this.inline_login.close();
        }.bind(this), true);
    }

    this.message_button = postile.dom.getDescendantById(instance.container, "message_button");

    if (postile.conf.userLoggedIn()) {
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            if(data.user_id){ // login and show
                this.logged_in = true;
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
                
                this.alert_wrapper = goog.dom.createDom('div', 'notification_number_wrapper');
                goog.dom.appendChild(this.message_button, this.alert_wrapper);

                this.redCircle = goog.dom.createDom('div', 'notification_redCircle');
                goog.dom.appendChild(this.alert_wrapper, this.redCircle);

                // Stores faye subscription for future disposal
                this.fayeSubscrDfd_ = postile.faye.subscribe('notification/' + localStorage.postile_user_id, function(status, data) {
                    instance.notificationHandler(data);
                });
                this.notification_isOpened = false;
                this.notification = new postile.view.notification.Notification(this, optBoardData);
                goog.events.listen(this.message_button, goog.events.EventType.CLICK, function(e) {
                    e.stopPropagation();
                    if (optBoardData) {
                        this.switchBoardTip.close();
                    }
                    this.sBTip.close();  
                    this.notification.open(this.message_button);
                    this.notificationHandlerClear();
                }.bind(this), true);
            }else{
            }
        }.bind(this)); 
    } else {
        this.logged_in = false;
        this.message_button.style.display = 'none';
    }
    /*
    if (optBoardData) {
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
    }
    */

    this.changeAccoutView();

    // change account view for anonymous
    goog.events.listen(this.usernameText_el, goog.events.EventType.CLICK, function(){
        if(!postile.conf.userLoggedIn()){
            return;
        }
        var profileView = new postile.view.profile.ProfileView(localStorage.postile_user_id);
        profileView.open(710);
    }.bind(this));

    goog.events.listen(this.profileImageContainer_el, goog.events.EventType.CLICK, function(){
        if(!postile.conf.userLoggedIn()){
            return;
        }
        var profileView = new postile.view.profile.ProfileView(localStorage.postile_user_id);
        profileView.open(710);
    }.bind(this));
}
goog.inherits(postile.view.post_board.Account, postile.view.NormalView);

postile.view.post_board.Account.prototype.unloaded_stylesheets = ['post_board.css'];

/**
 * @inheritDoc
 */
postile.view.post_board.Account.prototype.close = function() {
    if (this.fayeSubscrDfd_) {
        this.fayeSubscrDfd_.addCallback(function(subscr) {
            subscr.cancel();
        });
    }
    goog.base(this, 'close');
};

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
    if (postile.conf.userLoggedIn()) {
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            this.cur_id = data.user_id;
                if(!this.cur_id){ // did not login
                    this.account_container.style.display = 'none';
                    this.profileImageContainer_el.style.display = 'none';
                    this.login_button.style.display = 'block';
                    this.signup_button.style.display = 'block';

                    new postile.toast.title_bar_toast(
                        "You are not logged in. Please login to enable edit functions", 2);

                }else {
                    this.account_container.style.display = 'block';
                    this.profileImageContainer_el.style.display = 'block';
                    this.login_button.style.display = 'none';
                    this.signup_button.style.display = 'none';

                    postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
                        this.usernameText_el.innerHTML = data.username;
                        this.profileImageContainerImg_el.src = postile.conf.uploadsResource([ data.image_small_url ]);
                    }.bind(this));
                }
        }.bind(this)); 
    }
}

/* 
postile.view.post_board.FunctionButton = function(dom) { // constructor
    this.body_el = dom;
    this.image_el = goog.dom.getElementsByTagNameAndClass('img', null, this.body_el)[0];

    this.id = this.body_el.id;

    goog.events.listen(this.body_el, goog.events.EventType.CLICK, function(e) {
        this.open();
    }.bind(this));
}

postile.view.post_board.FunctionButton.prototype.open = function() {
    this.body_el.style.backgroundColor = '#024d61'
    this.image_el.style.webkitFilter = 'brightness(95%)';
}

postile.view.post_board.FunctionButton.prototype.close = function() {
    this.body_el.style.backgroundColor = 'transparent';
    this.image_el.style.webkitFilter = '';
}

*/
