goog.provide('postile.view.post_expand');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

/**
 * @constructor
 */
postile.view.post.PostExpand = function(data) {
    this.postData = data;

    this.in_edit = false;

    // parent's constructor
    postile.view.PopView.call(this);

    // load static html template
    postile.ui.load(this.container, postile.conf.staticResource(['_post_expand.html']));
}

goog.inherits(postile.view.post.PostExpand, postile.view.PopView);

postile.view.post.PostExpand.prototype.open = function() {

    var instance = this;

    postile.data_manager.getUserData(this.postData.creator_id, function(uData) {
        instance.userData = uData;
    });

    // container for this view
    this.post_el = goog.dom.getElementByClass('post-expand', this.container);

    this.y_editor = null;

    this.commentContainer_el = postile.dom.getDescendantByClass(this.post_el, 'comment-container');

    /* set the dom according to data */
    this.title_el = goog.dom.getElementByClass('title', this.post_el);
    this.title_el.innerHTML = this.postData.title;

    this.author_el = goog.dom.getElementByClass('author', this.post_el);
    this.author_el.innerHTML = this.userData.username;

    this.toolbar = goog.dom.getElementByClass('toolbar', instance.post_el);

    this.content_el = goog.dom.getElementByClass('content', this.post_el);
    
    if (this.postData.image_url) {
    
        this.img_el = goog.dom.createDom('img');
        this.img_el.src = postile.conf.uploadsResource([this.postData.image_url]);
        
        goog.dom.appendChild(this.content_el, this.img_el);
    
    } else {

        this.content_el.innerHTML = postile.parseBBcode(this.postData.content);
        
        postile.bbcodePostProcess(this.content_el);

        if (this.postData.creator_id == localStorage.postile_user_id) { //created by current user, can edit
            goog.events.listen(this.content_el, goog.events.EventType.CLICK, function() {
                instance.edit();
            });
        }
    }
    
    this.initComments();
    this.addCloseButton(this.post_el);

    postile.view.PopView.prototype.open.call(this, 860);

};

postile.view.post.PostExpand.prototype.unloaded_stylesheets = ['_post_expand.css', '_close_button.css'];

postile.view.post.PostExpand.prototype.initComments = function() {
    this.commentBox_el = postile.dom.getDescendantByClass(this.post_el, 'comment-box');
    this.commentProfileImg_el = postile.dom.getDescendantByClass(this.commentBox_el, 'img');

    // comment input area
    this.commentArea_el = postile.dom.getDescendantByClass(this.commentBox_el, 'input');
    postile.ui.makeLabeledInput(this.commentArea_el, 'Enter your comments here',
            'half_opaque', function() {
                postile.ajax(
                        [ 'inline_comment', 'new' ],
                        {
                            post_id: this.postData.id,
                            content: this.commentArea_el.innerHTML
                        }, function(data) {
                            this.renderComment(data.message.inline_comment);
                            this.commentArea_el.innerHTML = '';
                        }.bind(this));
            }.bind(this));

    postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
        this.commentProfileImg_el.src = postile.conf.uploadsResource([ data.image_small_url ]);
    }.bind(this));

    postile.ajax([ 'inline_comment', 'get_inline_comments' ], { post_id: this.postData.id }, function(data) {
        this.comments = data.message.inline_comments;

        for (var i in this.comments) {
            this.renderComment(this.comments[i].inline_comment);
        }
    }.bind(this));
}

postile.view.post.PostExpand.prototype.renderComment = function(cmt) {
    postile.data_manager.getUserData(cmt.creator_id, function(userData) {
        var comment_el = goog.dom.createDom('div', 'comment');
        goog.dom.appendChild(this.commentContainer_el, comment_el);

        var profileImageContainer_el = goog.dom.createDom('div', 'profile-image');
        goog.dom.appendChild(comment_el, profileImageContainer_el);

        var profileImage_el = goog.dom.createDom('img', 'img');
        goog.dom.appendChild(profileImageContainer_el, profileImage_el);
        profileImage_el.src = postile.conf.uploadsResource([ userData.image_small_url ]);

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

postile.view.post.PostExpand.prototype.edit = function() {

    var instance = this;

    if (this.in_edit) { return; }

    this.in_edit = true;

    var actual_tools = goog.dom.createDom('div', 'tools');

    goog.dom.appendChild(this.toolbar, actual_tools);

    var submit_button = goog.dom.createDom('div', 'submit-button');

    submit_button.innerHTML = postile._('submit_edit');

    goog.dom.appendChild(this.toolbar, submit_button);

    goog.events.listen(submit_button, goog.events.EventType.CLICK, function() {
        instance.submitEdit();
    });

    postile.ajax(['post','start_edit'], { post_id: this.postData.id }, function() {

        instance.y_editor = new postile.WYSIWYF.Editor(instance.content_el, actual_tools);

    });

}

postile.view.post.PostExpand.prototype.submitEdit = function() {

    var instance = this;

    postile.ajax(['post','submit_change'], { post_id: this.postData.id, content: this.y_editor.getBbCode(), title: this.title_el.innerHTML }, function() {
        instance.in_edit = false;
    });

    goog.dom.removeChildren(this.toolbar);

    delete this.y_editor;

    this.content_el.contentEditable = false;

}

postile.view.post.PostExpand.prototype.onclose = function() {
    if (this.in_edit) {
        if (window.confirm('Save your changes?')) {
            this.submitEdit();
        }
    }
}
