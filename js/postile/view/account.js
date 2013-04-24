goog.provide('postile.view.account');

goog.require('postile.view.inline_login');

/*
opt_boardData: set iff inside a board/sheet
*/
postile.view.account.Account = function(opt_boardData) {
    goog.base(this);
    
    this.container.id = 'account_container';
    
    this.tips = [];
    
    var instance = this;
    
    postile.view.account.initComponents.search(instance);
    
    if (postile.conf.userLoggedIn()) {
        postile.view.account.initComponents.notification(instance);
    }
    
    if (opt_boardData) {
        postile.view.account.initComponents.switch_board(instance, opt_boardData);
    }
    
    if (!document.body.getAttribute("postiles-chrome-plugin-injected")) {
        postile.view.account.initComponents.feedback(instance);
    }
    
    if (postile.conf.userLoggedIn()) {
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            postile.view.account.initComponents.profile(instance, postile.conf.uploadsResource([ data.image_small_url ]));
            postile.view.account.initComponents.user_info(instance, data.username);
        });
    } else {
        postile.view.account.initComponents.signup(instance);
        postile.view.account.initComponents.login(instance);
        new postile.toast.title_bar_toast("You are not logged in. Please login to enable edit functions", 2);
    }
}
goog.inherits(postile.view.account.Account, postile.view.NormalView);

postile.view.account.Account.prototype.unloaded_stylesheets = ['post_board.css'];

/**
 * @inheritDoc
 */
postile.view.account.Account.prototype.close = function() {
    if (this.fayeSubscrDfd_) {
        this.fayeSubscrDfd_.addCallback(function(subscr) {
            subscr.cancel();
        });
    }
    goog.base(this, 'close');
};

/*
// Remember to call change account view after switching the board
postile.view.account.Account.prototype.changeAccoutView = function(){
    if (postile.conf.userLoggedIn()) {
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            this.cur_id = data.user_id;
                if(!this.cur_id){ // did not login
                    this.account_container.style.display = 'none';
                    this.profileImageContainer_el.style.display = 'none';
                    this.login_button.style.display = 'block';
                    this.signup_button.style.display = 'block';

                    

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
*/

postile.view.account.Account.prototype.closeAllTips = function() {
    for (var i in this.tips) {
        this.tips[i].close();
    }
}

postile.view.account.Account.prototype.createAccountItem = function(id, additional_class) {
    var container = goog.dom.createDom('div', 'account_item' + (additional_class ? (' ' + additional_class) : ''));
    container.id = id;
    goog.dom.appendChild(this.container, container);
    return container;
}

postile.view.account.initComponents = {
    search: function(instance) {
        var search_button = instance.createAccountItem('search_button', 'function_button');
        search_button.innerHTML = '<addr title="Search for content"> <img src="/images/search_icon.png" /> </addr> <div class="pop_tip"> <div class="tip_arrow"></div> <div class="tip_text">Search</div> </div>';
        var sBTip = new postile.view.search_box.SearchBox(search_button);
        instance.tips.push(sBTip);
        goog.events.listen(search_button, goog.events.EventType.CLICK, function(e) {
            e.stopPropagation();
            instance.closeAllTips();
            sBTip.open(search_button);
        }, true);
    },
    user_info: function(instance, user_name) {
        var account_container = instance.createAccountItem('user_info_container');
        account_container.innerHTML = '<div id="username_text"></div> <div id="settings_logout_buttons_container"> <div id="settings_button" class="accout_button"> CHANGE PASSWORD </div> <div id="accout_button_delimeter" class="accout_button"> | </div> <div id="logout_button" class="accout_button"> LOGOUT </div> </div>';
        var usernameText_el = postile.dom.getDescendantById(account_container, 'username_text');
        usernameText_el.innerHTML = user_name;
        var settingButton_el = postile.dom.getDescendantById(account_container, 'settings_button');
        var logoutButton_el = postile.dom.getDescendantById(account_container, 'logout_button');
        var change_password = new postile.view.change_password.ChangePassword();
        goog.events.listen(settingButton_el, goog.events.EventType.CLICK, function(e){
            change_password.open(500);
        });
        goog.events.listen(logoutButton_el, goog.events.EventType.CLICK, function(e) {
            postile.user.logout();
        });
        goog.events.listen(usernameText_el, goog.events.EventType.CLICK, function(){
            var profileView = new postile.view.profile.ProfileView(localStorage.postile_user_id);
            profileView.open(710);
        });
    },
    profile: function(instance, img_src) {
        var profileImageContainer_el = instance.createAccountItem('profile_image_container');
        profileImageContainer_el.innerHTML = '<img class="image" /><div id="profile_image_left_caret"></div>';
        profileImageContainer_el.firstChild.src = img_src;  
        // profileImageContainer_el.firstChild.style.background = 'url(' + img_src + ')';
        goog.events.listen(profileImageContainer_el, goog.events.EventType.CLICK, function(){
            var profileView = new postile.view.profile.ProfileView(localStorage.postile_user_id);
            profileView.open(710);
        });
    },
    switch_board: function(instance, opt_boardData) {
        var switch_board_button = instance.createAccountItem('switch_board_button', 'function_button');
        switch_board_button.innerHTML = '<addr title="Switch Discussion Board"> <img src="/images/switch_board_icon.png" /> </addr> <div class="pop_tip"> <div class="tip_arrow"></div> <div class="tip_text">Switch Board</div> </div>';
        var switchBoardTip = new postile.view.board_more_pop.OtherBoard(opt_boardData);
        instance.tips.push(switchBoardTip);
        goog.events.listen(switch_board_button, goog.events.EventType.CLICK, function(e) {
            e.stopPropagation();
            instance.closeAllTips();
            switchBoardTip.open(switch_board_button);
        }, true);
    },
    signup: function(instance) {
        var signup = instance.createAccountItem('signup_button_account', 'account_login_button');
        signup.innerHTML = 'Signup';
        goog.events.listen(signup, goog.events.EventType.CLICK, function(e){
            postile.router.dispatch('signup');
        });
    },
    login: function(instance) {
        var login = instance.createAccountItem('login_button_account', 'account_login_button');
        login.innerHTML = 'Login';
        var inline_login = new postile.view.inline_login.InlineLogin();
        instance.tips.push(inline_login);
            goog.events.listen(login, goog.events.EventType.CLICK, function(e){
            e.stopPropagation();
            instance.closeAllTips();
            inline_login.open(login);
        });
    },
    notification: function(instance) {
        var message_button = instance.createAccountItem('message_button', 'function_button');
        message_button.innerHTML = '<addr title="See Messages"> <img src="/images/message_icon.png" /> </addr> <div class="pop_tip"> <div class="tip_arrow"></div> <div class="tip_text">Message</div> </div>';
        var alert_wrapper;
        var redCircle;
        var notificationHandlerClear = function() {
            goog.dom.classes.remove(alert_wrapper, 'notification_number_pop_up_wraper_animiation');
            goog.dom.classes.remove(redCircle, 'notification_number_pop_up_animiation');
        }
        var notificationHandler = function(data) {
            notificationHandlerClear();
            goog.dom.classes.add(alert_wrapper, 'notification_number_pop_up_wraper_animiation');
            goog.dom.classes.add(redCircle, 'notification_number_pop_up_animiation');
        }
        postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            var notificationList;
            /* get hte number of new notifications from server */
            postile.ajax([ 'notification', 'get_notifications' ], {}, function(data) {
                /* handle the data return after getting the boards information back */
                notificationList = data.message.notifications;
                if(notificationList.length != 0 ) {
                    notificationHandler(data);
                }
                /* TODO add a notification to the mail box to notify user */
            });
            
            alert_wrapper = goog.dom.createDom('div', 'notification_number_wrapper');
            goog.dom.appendChild(message_button, alert_wrapper);

            redCircle = goog.dom.createDom('div', 'notification_redCircle');
            goog.dom.appendChild(alert_wrapper, redCircle);

            // Stores faye subscription for future disposal
            instance.fayeSubscrDfd_ = postile.faye.subscribe('notification/' + localStorage.postile_user_id, function(status, data) {
                notificationHandler(data);
            });
            var notification = new postile.view.notification.Notification();
            instance.tips.push(notification);
            goog.events.listen(message_button, goog.events.EventType.CLICK, function(e) {
                e.stopPropagation();
                instance.closeAllTips();
                notification.open(message_button);
                notificationHandlerClear();
            }, true);
        });  
    },
    feedback: function(instance) {  
        var feedback = instance.createAccountItem('feedback_button'); //no use
        feedback.innerHTML = 'Feedback';
        feedback.style.cursor = 'pointer';
        feedback.style.margin = '6px 4px 0 10px';
        feedback.style.color = '#FFF';
        feedback.style.background = '#024d61';
        feedback.style.padding = '4px';
        feedback.style.fontSize = '14px';
        goog.events.listen(feedback, goog.events.EventType.CLICK, function() {
            new postile.feedback.FeedbackData();
        });
    }
};

