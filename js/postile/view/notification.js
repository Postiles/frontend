goog.provide('postile.view.notification');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.notification.Notification = function(header) {
    //var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_notification.html']));
    this.container.id = 'notifications_pop_up';
    console.log("notification called");
    this.container.style.top = '0px';
    this.container.style.left = '0px';

    this.currentMax = 6;

    postile.ajax([ 'notification', 'get_notifications' ], {}, function(data) {
        /* handle the data return after getting the boards information back */
        notificationList = data.message.notifications;
        this.markRead = postile.dom.getDescendantByClass(this.container, 'mark_read');
        console.log(this.markRead);

        this.numberOfNotification = postile.dom.getDescendantById(this.container, 'number_of_unread');
        this.numberOfNotification.innerHTML = notificationList.length;
        this.numberOfUnread = notificationList.length;

        goog.events.listen(this.markRead, goog.events.EventType.CLICK, function() {
            postile.ajax([ 'notification', 'dismiss_all' ], {}, function(data) {
                for (var i = 0; i < this.listedNotification.length; i++) {
                    this.listedNotification[i].removeFromList();
                    
                };
                // Nothing to do
            }.bind(this));
        }.bind(this));

        this.notificationListView = postile.dom.getDescendantById(this.container, 'notification_list');

        this.listedNotification = new Array();
        if(this.numberOfUnread > 6) {
            for (var i = 0; i < 6; i++) {
                var notificationType = notificationList[i].notification.notification_type;
                this.listedNotification[i] = new postile.view.notification.InfoItem();
                this.listedNotification[i].render(this, this.notificationListView, notificationList[i].notification, notificationList[i].from_user_profile);
            }
            this.seeMore();

        } else {
            for (i in notificationList) {
                var notificationType = notificationList[i].notification.notification_type;
                this.listedNotification[i] = new postile.view.notification.InfoItem();
                this.listedNotification[i].render(this, this.notificationListView, notificationList[i].notification, notificationList[i].from_user_profile);
            }
        }

        this.notificationList = notificationList;

    }.bind(this));
    // See more part more see more
}

postile.view.notification.Notification.prototype.seeMore = function() {
    this.notificationMore = goog.dom.createDom('div', 'notification_more');
    goog.dom.appendChild(this.notificationListView, this.notificationMore);
    goog.dom.appendChild(this.notificationMore, goog.dom.createDom('p','','See More'));

    for (var i = this.currentMax; i < this.currentMax + 3; i++) {
        var notificationType = notificationList[i].notification.notification_type;
        this.listedNotification[i] = new postile.view.notification.InfoItem();
        this.listedNotification[i].render(this.notificationListView, this.notificationList[i].notification, this.notificationList[i].from_user_profile);
    }
    this.currentMax = this.currentMax + 3;

}

postile.view.notification.Notification.prototype.appendOneMore = function() {
    this.numberOfUnread--;
    goog.dom.getElement('number_of_unread');
    this.numberOfNotification.innerHTML = this.numberOfUnread;

    
}


goog.inherits(postile.view.notification.Notification, postile.view.TipView);

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

postile.view.notification.TypeMap = {'reply in post':'write on'};

postile.view.notification.InfoItem.prototype.render = function(parent, parent_el, data, fromUser) {

    this.NotificationParent = parent;

    this.notification_id = data.id;
    var time = data.create_at;
    var notificationType = data.notification_type;
    var fromUserId = data.from_user_id;
    var targetId = data.targetId;
    var fromUserName = fromUser.last_name + fromUser.first_name;

    var profile_img_url = fromUser.image_small_url;

    /* begins the rendering of notification item */
    console.log(profile_img_url);
    this.notificationItem = goog.dom.createDom('div', 'notification');
    goog.dom.appendChild(parent, this.notificationItem);

    this.profile_img = goog.dom.createDom('img', {'class':'notification_profile', 'src': postile.uploadsResource([profile_img_url]) , 'alt': 'profile'});
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

    // TODO provide a link to the post

    /* footer part */
    this.notificationFooter = goog.dom.createDom('div','notification_footer');
    goog.dom.appendChild(this.notificationItem, this.notificationFooter);

    this.notificationTime = goog.dom.createDom('p','message_time', time);
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
    goog.dom.removeNode(this.notificationItem);


    this.NotificationParent.appendOneMore();
    // if there are other posts, we need to display them.

}
