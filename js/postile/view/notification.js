goog.provide('postile.view.notification');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.notification.Notification = function(notificationList) {
    //var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_notification.html']));
    this.container.id = 'notifications_pop_up';
    console.log("notification called");
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}


/* base class and thier dummy subclasses */
postile.view.notification.NotificationItem = function() {
}
postile.view.notification.WriteOnItem = function() {
	postile.view.notification.NotificationItem.call(this);
}
postile.view.notification.MentionItem = function() {
	postile.view.notification.NotificationItem.call(this);
}
postile.view.notification.FriendItem = function() {
	postile.view.notification.NotificationItem.call(this);
}
postile.view.notification.LikeItem = function() {
	postile.view.notification.NotificationItem.call(this);
}

postile.view.notification.WriteOnItem.prototype.render = function(parent, data, fromUser) {
	var time = data.create_at;
	var fromUserId = data.from_user_id;
	var notificationType = data.notification_type;
	var targetId = data.targetId;
	var fromUserName = fromUser.last_name + fromUser.first_name;

	var profile_img_url = fromUser.image_small_url;

	this.notificationList = postile.dom.getDescendantById(this.container, 'notification_list');

	/* begins the rendering of notification item */
	this.notificationItem = goog.dom.createDom('div', 'notification');
	goog.dom.appendChild(this.notificationList, notificationItem);

	this.profile_img = goog.dom.createDom('img', 'notification_profile', {'src': profile_img_url, 'alt': 'profile'});
	goog.dom.appendChild(this.notificationItem, this.profile_img);

	this.notificationTitle = goog.dom.createDom('div', 'title');
	goog.dom.appendChild(this.notificationItem, this.notificationTitle);

	this.fromUser = goog.dom.createDom('p', 'name', fromUserName);
	goog.dom.appendChild(this.notificationTitle, this.fromUser);

	/* add a litener for watching poping profile */
	goog.events.litener(this.fromUser, goog.events.EventType.CLICK, function(){
		new postile.view.profile.ProfileView(fromUserId);
	});

	goog.dom.appendChild(this.notificationTitle, goog.dom.createDom('p','','wrote on'));

	this.targetPost = goog.dom.createDom('p', 'post_text_link', 'your post');
	goog.dom.appendChild(this.notificationTitle, this.targetPost);

	/* footer part */
	this.notificationFooter = goog.dom.createDom('div','notification_footer');
	goog.dom.appendChild(this.notification, this.notificationFooter);

	this.notificationTime = goog.dom.createDom('p','message_time', time);
	goog.dom.appendChild(this.notificationFooter, this.notificationTime);

	this.ignore = goog.dom.createDom('p','ignore', 'Ignore');
	goog.dom.appendChild(this.notificationFooter, this.ignore);
}

postile.view.notification.WriteOnItem.prototype.userHandle = function(userChoice) {

}


goog.inherits(postile.view.notification.Notification, postile.view.TipView);
postile.view.notification.Notification.prototype.unloaded_stylesheets = ['notification.css'];


postile.view.notification.Notification.prototype.renderNotificationItem = fucntion() {

}