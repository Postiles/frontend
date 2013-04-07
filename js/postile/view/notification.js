goog.provide('postile.view.notification');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

postile.view.notification.Notification = function(header) {
    //var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_notification.html']));
    this.container.id = 'notifications_pop_up';
    //console.log("notification called");
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.opened = false;

    this.notificationListView = postile.dom.getDescendantById(this.container, 'notification_list');
    this.markRead = postile.dom.getDescendantByClass(this.container, 'mark_read');
    //console.log(this.markRead);

    this.numberOfNotification = postile.dom.getDescendantById(this.container, 'number_of_unread');

// See more part more see more
}
//goog.inherits(postile.view.notification.Notification, postile.view.TipView);

postile.view.notification.Notification.prototype.close = function() {
    postile.view.TipView.prototype.close.call(this);
    this.opened = false;
    if(this.listedNotification == undefined) {
        console.log("Loading notification");
        return;
    }

    for (var i = 0; i < this.listedNotification.length; i++) {
        if(this.listedNotification[i].removed == false){
            goog.dom.removeNode(this.listedNotification[i].notificationItem);
        }
    }
}

postile.view.notification.Notification.prototype.open = function(a, b) {
    if(this.opened == false){
        postile.view.TipView.prototype.open.call(this,a,b);
        this.currentIndex = 0;
        this.currentMax = 4;
        this.opened = true;
        postile.ajax([ 'notification', 'get_notifications' ], {}, function(data) {
            /* handle the data return after getting the boards information back */

            notificationList = data.message.notifications;
            console.log(notificationList[0]);
            this.numberOfNotification.innerHTML = notificationList.length;
            this.numberOfUnread = notificationList.length;

            goog.events.listen(this.markRead, goog.events.EventType.CLICK, function() {
                postile.ajax([ 'notification', 'dismiss_all' ], {}, function(data) {
                    // Nothing to do
                }.bind(this));

                goog.dom.removeNode(this.notificationMore);
                this.numberOfUnread = 0;
                this.numberOfNotification.innerHTML = this.numberOfUnread;
                this.currentIndex = 0;
                for (var i = 0; i < this.listedNotification.length; i++) {
                    if(this.listedNotification[i].removed == false){
                        goog.dom.removeNode(this.listedNotification[i].notificationItem);
                    }
                }
                this.notificationList = new Array();
                this.listedNotification =  new Array();

            }.bind(this));


            this.listedNotification = new Array();
            if(this.numberOfUnread > 4) {
                for (var i = 0; i < 4; i++) {
                    this.currentIndex++;
                    var notificationType = notificationList[i].notification.notification_type;
                    this.listedNotification[i] = new postile.view.notification.InfoItem();
                    this.listedNotification[i].render(this, notificationList[i].notification, notificationList[i].from_user_profile);
                }
                this.seeMore();

            } else {
                for (i in notificationList) {
                    this.currentIndex++;
                    var notificationType = notificationList[i].notification.notification_type;
                    this.listedNotification[i] = new postile.view.notification.InfoItem();
                    this.listedNotification[i].render(this, notificationList[i].notification, notificationList[i].from_user_profile);
                }
            }

            this.notificationList = notificationList;

        }.bind(this));
    }
}

postile.view.notification.Notification.prototype.seeMore = function() {

    goog.dom.removeNode(this.notificationMore);
    this.notificationMore = goog.dom.createDom('div', 'notification_more');
    goog.dom.appendChild(this.notificationListView, this.notificationMore);
    goog.dom.appendChild(this.notificationMore, goog.dom.createDom('p','','See More'));

    goog.events.listen(this.notificationMore, goog.events.EventType.CLICK, function(){
        for (var i = this.currentMax; i < Math.min(this.currentMax + 3, this.numberOfUnread); i++) {
            this.currentIndex++;
            this.listedNotification[i] = new postile.view.notification.InfoItem();
            this.listedNotification[i].render(this, this.notificationList[i].notification, this.notificationList[i].from_user_profile);
        }
        this.currentMax = this.currentMax + 3;
        this.seeMore();

    }.bind(this));
}

postile.view.notification.Notification.prototype.appendOneMore = function() {

    if(this.numberOfUnread > this.currentMax) { // still can append
        console.log(this.currentIndex);
        this.listedNotification[this.currentIndex] = new postile.view.notification.InfoItem();
        this.listedNotification[this.currentIndex].render(this, this.notificationListView, this.notificationList[this.currentIndex].notification, this.notificationList[this.currentIndex].from_user_profile);
        this.currentIndex++;
    }
    this.numberOfUnread--;
    goog.dom.getElement('number_of_unread');
    this.numberOfNotification.innerHTML = this.numberOfUnread;
    if(this.numberOfUnread > this.currentMax) {
        this.seeMore();
    }else{
        goog.dom.removeNode(this.notificationMore);
    }
}
postile.view.notification.Notification.prototype.unloaded_stylesheets = ['notification.css'];


/* base class and thier dummy subclasses */
postile.view.notification.NotificationItem = function() {
}
postile.view.notification.InfoItem = function() {
    postile.view.notification.NotificationItem.call(this);
}
postile.view.notification.FriendItem = function() {
    postile.view.notification.NotificationItem.call(this);
}

postile.view.notification.TypeMap = {'reply in post':'writes on', 'like post': 'likes', 'mention': 'mentions you at', 'link post': 'links'};

postile.view.notification.InfoItem.prototype.render = function(parent, data, fromUser) {
    this.removed = false;
    this.NotificationParent = parent;
    //console.log("rendering");
    this.notification_id = data.id;
    var time = data.updated_at;
    console.log(data);
    var notificationType = data.notification_type;
    var fromUserId = data.from_user_id;
    var targetId = data.target_id;
    var fromUserName = fromUser.last_name + ' ' + fromUser.first_name;

    var profile_img_url = fromUser.image_small_url;

    /* begins the rendering of notification item */
    //console.log(profile_img_url);
    this.notificationItem = goog.dom.createDom('div', 'notification');
    goog.dom.appendChild(parent.notificationListView, this.notificationItem);


    //console.log(profile_img_url);
    this.profile_img = goog.dom.createDom('img', {
        'class':'notification_profile',
        'src': postile.conf.uploadsResource([profile_img_url]),
        'alt': 'profile'
    });
    goog.dom.appendChild(this.notificationItem, this.profile_img);

    this.notificationTitle = goog.dom.createDom('div', 'title');
    goog.dom.appendChild(this.notificationItem, this.notificationTitle);

    this.fromUser = goog.dom.createDom('p', 'name', fromUserName);
    goog.dom.appendChild(this.notificationTitle, this.fromUser);

    /* add a litener for watching poping profile */
    goog.events.listen(this.fromUser, goog.events.EventType.CLICK, function(){
        new postile.view.profile.ProfileView(fromUserId);
    });

    goog.dom.appendChild(this.notificationTitle, goog.dom.createDom('p','',' ' + postile.view.notification.TypeMap[notificationType] +' '));
    this.targetPost = goog.dom.createDom('p', 'post_text_link', 'your post');
    goog.dom.appendChild(this.notificationTitle, this.targetPost);

    goog.events.listen(this.targetPost, goog.events.EventType.CLICK, function(){
        if (postile.router.current_view instanceof postile.view.post_board.PostBoard) {
            postile.router.current_view.moveToPost(targetId);
        }
    }.bind(this));

    /* footer part */
    this.notificationFooter = goog.dom.createDom('div','notification_footer');
    goog.dom.appendChild(this.notificationItem, this.notificationFooter);

    this.notificationTime = goog.dom.createDom('p','message_time',  postile.date(time, 'inline'));
    goog.dom.appendChild(this.notificationFooter, this.notificationTime);

    this.ignore = goog.dom.createDom('p','ignore', 'Ignore');
    goog.dom.appendChild(this.notificationFooter, this.ignore);
    goog.events.listen(this.ignore, goog.events.EventType.CLICK, function(){
        this.userHandle();
    }.bind(this));
}

postile.view.notification.InfoItem.prototype.userHandle = function() {
    postile.ajax([ 'notification', 'dismiss' ], {notification_id: this.notification_id}, function(data) {
        this.removeFromList();
    }.bind(this));
}

postile.view.notification.InfoItem.prototype.removeFromList = function() {
    if(this.removed == false) {
        this.removed = true;
        goog.dom.removeNode(this.notificationItem);
        this.NotificationParent.appendOneMore();
    }
    // if there are other posts, we need to display them.
}
