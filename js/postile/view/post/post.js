goog.provide('postile.view.post');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.post.PostExpand = function(data) { // constructor
    var instance = this;

    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_post_expand.html']));

    this.postData = data;
    postile.data_manager.getUserData(this.postData.creator_id, function(uData) {
        instance.userData = uData;
    });

    this.post_el = goog.dom.getElementByClass('post-expand', this.container);

    this.commentContainer_el = postile.dom.getDescendantByClass(this.post_el, 'comment-container');

    /* set the dom according to data */
    this.title_el = goog.dom.getElementByClass('title', this.post_el);
    this.title_el.innerHTML = this.postData.title;

    this.author_el = goog.dom.getElementByClass('author', this.post_el);
    this.author_el.innerHTML = this.userData.username;

    this.content_el = goog.dom.getElementByClass('content', this.post_el);
    this.content_el.innerHTML = this.postData.content;

    this.closeButton_el = goog.dom.getElementByClass('close-button', this.post_el);
    goog.events.listen(this.closeButton_el, goog.events.EventType.CLICK, function(e) {
        this.close();
    }.bind(this));

    this.initComments();

    this.open(1165);
}

goog.inherits(postile.view.post.PostExpand, postile.view.PopView);

postile.view.post.PostExpand.prototype.unloaded_stylesheets = ['_post_expand.css'];

postile.view.post.PostExpand.prototype.initComments = function() {
    this.commentBox_el = postile.dom.getDescendantByClass(this.post_el, 'comment-box');
    this.commentProfileImg = postile.dom.getDescendantByClass(this.commentBox_el, 'img');

    postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
        this.commentProfileImg.src = postile.uploadsResource([ data.image_small_url ]);
    }.bind(this));

    postile.ajax([ 'inline_comment', 'get_inline_comments' ], { post_id: this.postData.id }, function(data) {
        this.comments = data.message.inline_comments;
        console.log(data.message);

        for (var i in this.comments) {
            var cmt = this.comments[i].inline_comment;

            postile.data_manager.getUserData(cmt.creator_id, function(userData) {
                var comment_el = goog.dom.createDom('div', 'comment');
                goog.dom.appendChild(this.commentContainer_el, comment_el);

                var profileImageContainer_el = goog.dom.createDom('div', 'profile-image');
                goog.dom.appendChild(comment_el, profileImageContainer_el);

                var profileImage_el = goog.dom.createDom('img', 'img');
                goog.dom.appendChild(profileImageContainer_el, profileImage_el);
                profileImage_el.src = postile.uploadsResource([ userData.image_small_url ]);

                var commentRight_el = goog.dom.createDom('div', 'comment-right');
                goog.dom.appendChild(comment_el, commentRight_el);

                var username_el = goog.dom.createDom('div', 'username');
                goog.dom.appendChild(commentRight_el, username_el);
                username_el.innerHTML = userData.username;

                var content_el = goog.dom.createDom('div', 'content');
                goog.dom.appendChild(commentRight_el, content_el);
                content_el.innerHTML = cmt.content;
            }.bind(this));
        }
    }.bind(this));
}
