goog.provide('postile.view.post.InlineComment');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('postile.ui');
goog.require('postile.dom');

postile.view.post.InlineComment = function(commentContainer, commentData) {
    // create wrapper for post
    this.wrap_el = goog.dom.createDom('div', 'post_comment');

    commentData.dom = this.wrap_el;

    postile.ui.load(this.wrap_el, 
        postile.conf.staticResource([ '_inline_comment.html' ]));

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.wrap_el, nodeCls);
    }.bind(this);

    this.elements = {
        name_el: $('comment_name'),
        content_el: $('comment_content'),
        time_el: $('comment_time'),
        deleteButton_el: $('comment_delete_button'),
    }

    postile.data_manager.getUserData(
        commentData.inline_comment.creator_id, 
        function(data) {
            this.elements.name_el.innerHTML = data.username;

            goog.events.listen(
                this.elements.name_el, 
                goog.events.EventType.CLICK, 
                function(e) {
                    var profileView = 
                        new postile.view.profile.ProfileView(
                            commentData.creator.id);
                    profileView.open(710);
                }.bind(this));

        }.bind(this));

    this.elements.content_el.innerHTML = commentData.inline_comment.content;
    this.elements.content_el.innerHTML = 
        commentData.inline_comment.content.replace(
            / @(\d+)/g, 
            '<span class="at_person" at-person="$1">' + 
                '@[Username pending]</span>');

    this.elements.time_el.innerHTML = postile.date(
        commentData.inline_comment.created_at, 'inline');

    goog.events.listen(
        this.elements.deleteButton_el, 
        goog.events.EventType.CLICK,
        function(e) {
            console.log(commentData.inline_comment.id);
            postile.ajax(
                [ 'inline_comment', 'delete' ],
                { comment_id: commentData.inline_comment.id },
                function(data) {
                });
        }.bind(this));

    if (commentData.inline_comment.creator_id == parseInt(localStorage.postile_user_id)) {
        this.elements.deleteButton_el.style.display = 'inline';
    }

    goog.dom.appendChild(commentContainer, this.wrap_el);
}
