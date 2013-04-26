goog.provide('postile.view.post.InlineComment');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('postile.ui');
goog.require('postile.dom');

postile.view.post.InlineComment = function(commentContainer, commentData, parentInstance) {
    // create wrapper for post
    this.wrap_el = goog.dom.createDom('div', 'post_comment');

    this.parentInstance = parentInstance;

    this.commentData = commentData;

    commentData.dom = this.wrap_el;

    postile.ui.load(this.wrap_el, 
        postile.conf.staticResource([ '_inline_comment.html' ]));

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.wrap_el, nodeCls);
    }.bind(this);

    this.elements = {
        name_el: $('comment_name'),
        commentMiddle_el: $('comment_middle'),
        content_el: $('comment_content'),
        likeCount_el: $('comment_like_count'),
        likeButton_el: $('comment_like_button'),
        likeDot2_el: $('comment_like_dot_2'),
        time_el: $('comment_time'),
        deleteButton_el: $('comment_delete_button'),
        flagButton_el: $('comment_flag_button'),
        confirmDeleteContainer_el: $('confirm_delete_container'),
        confirmOk_el: $('confirm_delete_ok'),
        confirmCancel_el: $('confirm_delete_cancel')
    };

    if (!this.parentInstance.isInAnonymousBoard()) {
        postile.data_manager.getUserData(
            commentData.inline_comment.creator_id, 
            function(data) {
                this.elements.name_el.innerHTML = data.username;

                goog.events.listen(
                    this.elements.name_el, 
                    goog.events.EventType.CLICK, 
                    function(e) {
                        var profileView = 
                            new postile.view.profile.ProfileView(data.id);
                        profileView.open(710);
                    }.bind(this));

            }.bind(this));
    } else {
        this.elements.commentMiddle_el.style.display = 'none';
    }

    this.elements.content_el.innerHTML = commentData.inline_comment.content;
    this.elements.content_el.innerHTML = postile.parseBBcode(commentData.inline_comment.content);
    postile.bbcodePostProcess(this.elements.content_el);

    var likedUsers = commentData.likes.map(function(l) {
        return l.user_id;
    });

    this.elements.likeCount_el.innerHTML = commentData.likes.length;

    if (postile.conf.userLoggedIn()) {
        if (likedUsers.indexOf(postile.conf.getSelfUserId()) != -1) { // like by me
            this.elements.likeButton_el.innerHTML = 'Unlike';
        } else {
            this.elements.likeButton_el.innerHTML = 'Like';
        }
    } else {
        this.elements.likeDot2_el.style.display = 'none';
    }

    this.elements.time_el.innerHTML = postile.date(
        commentData.inline_comment.created_at, 'inline');

    goog.events.listen(
        this.elements.likeButton_el,
        goog.events.EventType.CLICK,
        function(e) {
            var action = this.elements.likeButton_el.innerHTML.toLowerCase();
            postile.ajax(
                [ 'inline_comment', action ],
                { comment_id: commentData.inline_comment.id },
                function(data) {
                    if (action == 'like') { // like
                        this.elements.likeCount_el.innerHTML = 
                            (++commentData.likes.length);
                        this.elements.likeButton_el.innerHTML = 'Unlike';
                    } else {
                        this.elements.likeCount_el.innerHTML = 
                            (--commentData.likes.length);
                        this.elements.likeButton_el.innerHTML = 'Like';
                    }
                }.bind(this));
        }.bind(this));

    goog.events.listen(
        this.elements.deleteButton_el,
        goog.events.EventType.CLICK,
        function(e) {
            this.elements.confirmDeleteContainer_el.style.display = 'block';
        }.bind(this));

    goog.events.listen(
        this.elements.flagButton_el,
        goog.events.EventType.CLICK,
        function(e) {
            if (confirm("Are you sure you're going to flag this comment as inappropriate?")) {
                postile.ajax(
                    [ 'inline_comment', 'report_comment_abuse' ],
                    { comment_id: this.commentData.inline_comment.id },
                    function(data) {
                    });
            }
        }.bind(this));

    goog.events.listen(
        this.elements.confirmOk_el, 
        goog.events.EventType.CLICK,
        function(e) {
            postile.ajax(
                [ 'inline_comment', 'delete' ],
                { comment_id: commentData.inline_comment.id },
                function(data) {
                    // handled by faye
                });
        }.bind(this));
    
    goog.events.listen(
        this.elements.confirmCancel_el,
        goog.events.EventType.CLICK,
        function(e) {
            this.elements.confirmDeleteContainer_el.style.display = 'none';
        }.bind(this));

    if (postile.conf.userLoggedIn()) {
        var currUserId = parseInt(localStorage.postile_user_id);
        if (commentData.inline_comment.creator_id == currUserId ||
                this.parentInstance.postData.post.creator_id == currUserId) { // comment in my post, can delete
            this.elements.deleteButton_el.style.display = 'inline';
        } else {
            this.elements.flagButton_el.style.display = 'inline';
        }
    }

    goog.dom.appendChild(commentContainer, this.wrap_el);
}
