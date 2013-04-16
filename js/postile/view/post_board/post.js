goog.provide('postile.view.post');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.string');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.dom.classes');
goog.require('goog.ui.LabelInput');
goog.require('goog.events.KeyHandler');

goog.require('postile.i18n');
goog.require('postile.toast');
goog.require('postile.dom');
goog.require('postile.ui');
goog.require('postile.WYSIWYF');
goog.require('postile.debbcode');
goog.require('postile.fx');
goog.require('postile.view.At');
goog.require('postile.fx.effects');
goog.require('postile.view.post_expand');
goog.require('postile.view.post.text_post');
goog.require('postile.view.post.picture_post');
goog.require('postile.view.post.video_post');
goog.require('postile.view.post.PostExpand');
goog.require('postile.view.post.InlineComment');

/**
 * Factory function that creates a post from JSON data retrieved from the server
 */
postile.view.post.createPostFromJSON = function(postData, board, mode) {
    if (postData.post.image_url) { // PicturePost
        return new postile.view.post.picture_post.PicturePost(
            postData, board, mode);
    } else if (postData.post.video_link) { // VideoPost
        return new postile.view.post.video_post.VideoPost(
            postData, board, mode);
    } else { // TextPost
        return new postile.view.post.text_post.TextPost(
            postData, board, mode);
    }
}

/**
 * Constructor for the abstract Post class
 */
postile.view.post.Post = function(postData, board, mode) {
    this.board = board;
    this.postData = postData;
    this.currMode = mode;

    this.loadUIComponents();
    this.initEventListeners();

    // temporarilly disable all the modes to prevent glitch
    this.displayModePost_el.style.display = 'none';
    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    // precalculate this two so that future intersect test will be faster
    this.postData.post.coord_x_end = 
        this.postData.post.pos_x + this.postData.post.span_x;
    this.postData.post.coord_y_end = 
        this.postData.post.pos_y + this.postData.post.span_y;

    this.wrap_el.style.left = 
        this.board.xPosTo(this.postData.post.pos_x) + 'px';
    this.wrap_el.style.top = 
        this.board.yPosTo(this.postData.post.pos_y) + 'px';
    this.wrap_el.style.width = 
        this.board.widthTo(this.postData.post.span_x) + 'px';
    this.wrap_el.style.height = 
        this.board.heightTo(this.postData.post.span_y) + 'px';

    goog.dom.appendChild(this.board.canvas, this.wrap_el);

    this.changeCurrentMode(mode);

    // disable double click entering mask mode
    goog.events.listen(
        this.wrap_el, 
        goog.events.EventType.DBLCLICK, 
        function(e) {
            e.stopPropagation();
        });

    // NOTE: do not add any other event listener here unless it is for wrap_el
}

postile.view.post.Post.prototype.changeCurrentMode = function(mode) {
    switch (mode) {
    case postile.view.post.Post.PostMode.DISPLAY:
        this.enterDisplayMode();
        break;
    case postile.view.post.Post.PostMode.COMMENT:
        this.enterCommentMode();
        break;
    case postile.view.post.Post.PostMode.EDIT:
        if (this.isSelfPost()) {
            postile.ajax(
                [ 'post', 'start_edit' ], 
                { post_id: this.postData.post.id }, 
                function(data) {
                    this.enterEditMode(true);
                }.bind(this));
        }
        break;
    case postile.view.post.Post.PostMode.LOCKED:
        this.enterLockedMode();
        break;
    case postile.view.post.Post.PostMode.NEW:
        this.enterNewMode();
        break;
    case postile.view.post.Post.PostMode.CONFIRM_DELETE:
        this.enterConfirmDeleteMode();
        break;
    }
}

/**
 * Constant definitions for flags
 */
postile.view.post.Post.PostMode = {
    DISPLAY: 'display',
    COMMENT: 'comment', // display inline comments
    EDIT: 'edit',
    LOCKED: 'locked', // other users are editing
    NEW: 'new', // newly created
    CONFIRM_DELETE: 'confirm_delete',
}

/**
 * Load post UI components from the static html file and bind events for it
 */
postile.view.post.Post.prototype.loadUIComponents = function() {
    // create wrapper for post
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');

    // load static html template
    postile.ui.load(this.wrap_el, 
        postile.conf.staticResource([ '_post_in_board.html' ]));

    // load different post modes
    this.loadDisplayModeUIComponents();
    this.loadCommentModeUIComponents();
    this.loadEditModeUIComponents();
    this.loadLockedModeUIComponents();
    this.loadNewModeUIComponents();
    this.loadConfirmDeleteModeUIComponents();
}

postile.view.post.Post.prototype.loadDisplayModeUIComponents = function() {
    this.displayModePost_el = 
        postile.dom.getDescendantByClass(this.wrap_el, 'display_mode_post');

    // This function is just a shortcut for the getDescendantByClass function
    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(
            this.displayModePost_el, nodeCls);
    }.bind(this);

    // all the UI components for display mode
    this.displayModeElements = {
        container_el: $('post_container'),
        postInnerContainer_el: $('post_inner_container'),
        postTitleContainer_el: $('post_title_container'),
        postNoTitle_el: $('post_no_title'),
        postTitle_el: $('post_title'),
        postAuthor_el: $('post_author'),
        postContent_el: $('post_content'),
        postGradientMask_el: $('post_gradient_mask'),
        postEditButton_el: $('post_edit_button'),
        postLikeContainer_el: $('post_like_container'),
        postLikeCount_el: $('post_like_count'),
        postLikeButton_el: $('post_like_button'),
        postCommentCount_el: $('post_comment_count'),
        commentPreview_el: $('comment_preview'),
        commentPreviewNoComment_el: $('comment_preview_no_comment'),
        commentPreviewDisplay_el: $('comment_preview_display'),
        commentPreviewAuthor_el: $('comment_preview_author'),
        commentPreviewContent_el: $('comment_preview_content'),
    };
}

postile.view.post.Post.prototype.loadCommentModeUIComponents = function() {
    this.commentModePost_el = 
        postile.dom.getDescendantByClass(this.wrap_el, 'comment_mode_post');

    // This function is just a shortcut for the getDescendantByClass function
    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(
            this.commentModePost_el, nodeCls);
    }.bind(this);

    // all the UI components for display mode
    this.commentModeElements = {
        container_el: $('post_container'),
        postInnerContainer_el: $('post_inner_container'),
        postTitleContainer_el: $('post_title_container'),
        postNoTitle_el: $('post_no_title'),
        postTitle_el: $('post_title'),
        postAuthor_el: $('post_author'),
        commentContainer_el: $('comment_container'),
        commentList_el: $('comment_list'),
        commentContainerNoComment_el: $('comment_container_no_comment'),
        commentItems_el: $('comment_container_items'),
        commentInput_el: $('comment_container_input'),
        commentCloseButton_el: $('comment_list_close_button'),
    }
}

postile.view.post.Post.prototype.loadEditModeUIComponents = function() {
    this.editModePost_el = 
        postile.dom.getDescendantByClass(this.wrap_el, 'edit_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.editModePost_el, nodeCls);
    }.bind(this);

    this.editModeElements = {
        container_el: $('post_container'),
        postTitle_el: $('post_title'),
        postAuthor_el: $('post_author'),
        postWysiwyfIconContainer: $('post_wysiwyf_icon_container'),
        postContent_el: $('post_content'),
        postContentPlaceHolder_el: $('post_content_placeholder'),
        deleteIcon_el: $('post_delete_icon'),
    }
}

postile.view.post.Post.prototype.loadLockedModeUIComponents = function() {
    this.lockedModePost_el = 
        postile.dom.getDescendantByClass(this.wrap_el, 'locked_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.lockedModePost_el, nodeCls);
    }.bind(this);

    this.lockedModeElements = {
        container_el: $('post_container'),
        lockUsername_el: $('lock_username'),
    }
}

postile.view.post.Post.prototype.loadNewModeUIComponents = function() {
    this.newModePost_el = 
        postile.dom.getDescendantByClass(this.wrap_el, 'new_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.newModePost_el, nodeCls);
    }.bind(this);

    this.newModeElements = {
        container_el: $('post_container'),
        newUsername_el: $('new_username'),
    }
}

postile.view.post.Post.prototype.loadConfirmDeleteModeUIComponents = function() {
    this.confirmDeleteModePost_el = 
        postile.dom.getDescendantByClass(
            this.wrap_el, 'confirm_delete_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(
            this.confirmDeleteModePost_el, nodeCls);
    }.bind(this);

    this.confirmDeleteModeElements = {
        container_el: $('post_container'),
        confirmOk_el: $('confirm_ok'),
        confirmCancel_el: $('confirm_cancel'),
    }
}

/**
 * Initialize the event handlers
 */
postile.view.post.Post.prototype.initEventListeners = function() {
    this.initDisplayModeListener();
    this.initCommentModeListener();
    this.initEditModeListener();
    this.initLockedModeListener();
    this.initNewModeListener();
    this.initConfirmDeleteModeListener();
}

postile.view.post.Post.prototype.initDisplayModeListener = function() {
    var elements = this.displayModeElements;

    // expand post
    goog.events.listen(
        elements.postTitleContainer_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            var postExpand = 
                new postile.view.post.PostExpand(this.postData.post);
            postExpand.open();
        }.bind(this));

    // display user profile
    goog.events.listen(
        elements.postAuthor_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            var profileView = 
                new postile.view.profile.ProfileView(
                    this.postData.creator.id);
            profileView.open(710);
        }.bind(this));

    // like clicked
    goog.events.listen(
        elements.postLikeButton_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            var elements = this.displayModeElements;
            var action = elements.postLikeButton_el.innerHTML.toLowerCase();

            postile.ajax(
                [ 'post', action ], 
                { post_id: this.postData.post.id }, 
                function(data) {
                    if (action == 'like') { // like
                        elements.postLikeCount_el.innerHTML = 
                            (++this.postData.likes.length);
                        elements.postLikeButton_el.innerHTML = 'Unlike';
                    } else { // unlike
                        elements.postLikeCount_el.innerHTML = 
                            (--this.postData.likes.length);
                        elements.postLikeButton_el.innerHTML = 'Like';
                    }
                }.bind(this));
        }.bind(this));

    // comment count clicked, enter comment mode
    goog.events.listen(
        elements.postCommentCount_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            this.changeCurrentMode(postile.view.post.Post.PostMode.COMMENT);
        }.bind(this));

    // enter edit mode by clicking on edit button
    goog.events.listen(
        elements.postEditButton_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            this.changeCurrentMode(postile.view.post.Post.PostMode.EDIT);
        }.bind(this));

    // comment preview clicked, enter comment mode
    goog.events.listen(
        elements.commentPreview_el, 
        goog.events.EventType.CLICK, function(e) {
            this.changeCurrentMode(postile.view.post.Post.PostMode.COMMENT);
        }.bind(this));

    // comment preview author name clicked
    goog.events.listen(
        elements.commentPreviewAuthor_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            e.stopPropagation();
            var profileView = 
                new postile.view.profile.ProfileView(
                    this.latestComment.creator.id);
            profileView.open(710);
        }.bind(this));
}

postile.view.post.Post.prototype.initCommentModeListener = function() {
    var elements = this.commentModeElements;

    // expand post
    goog.events.listen(
        elements.postTitleContainer_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            var postExpand = 
                new postile.view.post.PostExpand(this.postData.post);
            postExpand.open();
        }.bind(this));

    // enter pressed for comment input
    goog.events.listen(
        elements.commentInput_el, 
        goog.events.EventType.KEYDOWN, 
        function(e) {
            if (e.keyCode == 13) { // enter pressed
                var content = 
                    goog.string.trim(
                        this.commentModeElements.commentInput_el.innerHTML);

                if (content.length) { // not empty comment
                    postile.ajax([ 'inline_comment', 'new' ], {
                        post_id: this.postData.post.id,
                        content: content,
                    }, function(data) {
                        /*
                        var comment = data.message;
                        if (!this.inlineCommentRendered(comment)) {
                            // add the new comment to list
                            this.postData.inline_comments.push(comment);

                            new postile.view.post.InlineComment(
                                this.commentModeElements.commentItems_el, 
                                comment);
                        }

                        // scroll the comment list to the bottom
                        // even if the comment is already rendered, we still 
                        // scroll it to the bottom since it's my own comment
                        this.commentModeElements.commentList_el.scrollTop = 
                            this.commentModeElements.commentList_el.scrollHeight;

                        this.hideNoCommentEl();
                        */
                    }.bind(this));

                    this.commentModeElements.commentInput_el.innerHTML = '';
               }
            }
        }.bind(this));

    // close clicked in comment mode
    goog.events.listen(
        elements.commentCloseButton_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            this.changeCurrentMode(postile.view.post.Post.PostMode.DISPLAY);
        }.bind(this));
}

postile.view.post.Post.prototype.initEditModeListener = function() {
    var elements = this.editModeElements;

    // enter pressed when editing title
    goog.events.listen(
        elements.postTitle_el, 
        goog.events.EventType.KEYDOWN, 
        function(e) {
            if (e.keyCode == 13) {
                this.submitChange();
            }
        }.bind(this));

    // ctrl + enter pressed for post content
    goog.events.listen(
        elements.postContent_el, 
        goog.events.EventType.KEYDOWN, 
        function(e) {
            if (e.keyCode == 13 && e.ctrlKey) {
                e.preventDefault();
                this.submitChange();
            }
        }.bind(this));

    // content key up, deals with placeholder
    goog.events.listen(
        elements.postContent_el, 
        goog.events.EventType.KEYUP, 
        function(e) {
            var elements = this.editModeElements;
            if (this.wrap_el.className.indexOf('text_post') != -1) { // text post
                var content = elements.postContent_el.innerHTML;
                if (goog.string.isEmpty(content) || content == '<br>') {
                    elements.postContentPlaceHolder_el.style.display = 'block';
                } else {
                    elements.postContentPlaceHolder_el.style.display = 'none';
                }
            }
        }.bind(this));

    // delete icon clicked
    goog.events.listen(
        elements.deleteIcon_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            this.changeCurrentMode(
                postile.view.post.Post.PostMode.CONFIRM_DELETE);
        }.bind(this));

    // body clicked, submit change
    goog.events.listen(
        document.body, 
        goog.events.EventType.CLICK, 
        function(e) {
            if (this.currMode == postile.view.post.Post.PostMode.EDIT) {
                this.submitChange();
            }
        }.bind(this));

    // stop body click propagation
    goog.events.listen(
        this.wrap_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            if (this.currMode == postile.view.post.Post.PostMode.EDIT) {
                e.stopPropagation();
            }
        }.bind(this));
}

postile.view.post.Post.prototype.initLockedModeListener = function() {
    var elements = this.lockedModeElements;

    // author's name clicked
    goog.events.listen(
        elements.lockUsername_el, 
        goog.events.EventType.CLICK, 
        function (e) {
            var profileView = 
                new postile.view.profile.ProfileView(this.postData.creator.id);
            profileView.open(710);
        }.bind(this));
}

postile.view.post.Post.prototype.initNewModeListener = function() {
    var elements = this.newModeElements;

    // author's name clicked
    goog.events.listen(
        elements.newUsername_el, 
        goog.events.EventType.CLICK, 
        function (e) {
            var profileView = new postile.view.profile.ProfileView(
                this.postData.creator.id);
            profileView.open(710);
        }.bind(this));
}

postile.view.post.Post.prototype.initConfirmDeleteModeListener = function() {
    var elements = this.confirmDeleteModeElements;

    // ok clicked
    goog.events.listen(
        elements.confirmOk_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            var id = this.postData.post.id;
            postile.ajax(['post','delete'], { post_id: id }, function(data) {
                this.board.removePost(id);
                this.board.disableMovingCanvas = false;
            }.bind(this));
        }.bind(this));

    // cancel clicked
    goog.events.listen(
        elements.confirmCancel_el, 
        goog.events.EventType.CLICK, 
        function(e) {
            this.enterEditMode(false);
        }.bind(this));
}

postile.view.post.Post.prototype.enterDisplayMode = function() {
    this.currMode = postile.view.post.Post.PostMode.DISPLAY;

    this.displayModePost_el.style.display = '';

    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    var elements = this.displayModeElements;
    elements.postTitle_el.innerHTML = this.postData.post.title;

    elements.postLikeCount_el.innerHTML = this.postData.likes.length;

    postile.data_manager.getUserData(
        this.postData.post.creator_id, 
        function(data) {
            this.postData.creator = data;
            elements.postAuthor_el.innerHTML = data.username;

            elements.postTitle_el.style.width = this.wrap_el.offsetWidth - 
                    elements.postAuthor_el.offsetWidth - 40 + 'px';
        }.bind(this));

    if (this.postData.post.title) { // title exists
        elements.postNoTitle_el.style.display = 'none';
    }

    var liked_users = this.postData.likes.map(function(l) {
        return l.user_id;
    });

    // display 'like' or 'unlike'
    if (liked_users.indexOf(postile.conf.currentUserId) != -1) { // liked
        elements.postLikeButton_el.innerHTML = 'Unlike';
    } else {
        elements.postLikeButton_el.innerHTML = 'Like';
    }

    // display number of comments
    this.resetCommentCount();

    if (this.isSelfPost()) { // my own post
        // elements.postContent_el.style.cursor = 'auto';
    } else {
        elements.postEditButton_el.style.display = 'none';
        // elements.postContent_el.style.cursor = 'default';
    }

    // latest inline comment
    this.latestComment = 
        this.postData.inline_comments[ 
            this.postData.inline_comments.length - 1 ];

    if (this.latestComment) { // at least one comment
        postile.data_manager.getUserData(
            this.latestComment.inline_comment.creator_id, 
            function(data) {
                this.latestComment.creator = data;

                elements.commentPreviewAuthor_el.innerHTML = 
                    this.latestComment.creator.username;
                elements.commentPreviewContent_el.innerHTML = 
                    this.latestComment.inline_comment.content;


                elements.commentPreviewNoComment_el.style.display = 'none';
                elements.commentPreview_el.style.display = 'block';

                elements.commentPreviewContent_el.style.width = 
                    this.wrap_el.offsetWidth - 
                        elements.commentPreviewAuthor_el.offsetWidth - 36 + 'px';
            }.bind(this));
    } else { // no comment
        elements.commentPreviewDisplay_el.style.display = 'none';
        elements.commentPreview_el.style.display = 'block';
        elements.commentPreviewNoComment_el.style.display = 'block';
    }
}

postile.view.post.Post.prototype.enterCommentMode = function() {
    this.currMode = postile.view.post.Post.PostMode.COMMENT;

    this.commentModePost_el.style.display = '';

    this.displayModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    var elements = this.commentModeElements;
    elements.postTitle_el.innerHTML = this.postData.post.title;

    postile.data_manager.getUserData(
        this.postData.post.creator_id, 
        function(data) {
            this.postData.creator = data;

            elements.postAuthor_el.innerHTML = this.postData.creator.username;
            elements.postTitle_el.style.width = this.wrap_el.offsetWidth - 
                    elements.postAuthor_el.offsetWidth - 40 + 'px';
        }.bind(this));

    elements.commentContainer_el.style.height = 
        this.wrap_el.offsetHeight - 
        elements.postInnerContainer_el.offsetHeight - 3 + 'px'; // 3 is padding

    elements.commentList_el.style.height = 
        parseInt(elements.commentContainer_el.style.height) - 34 + 'px'

    elements.commentInput_el.style.width = 
        this.wrap_el.offsetWidth - 65 + 'px';

    elements.commentInput_el.focus();

    if (this.postData.post.title) { // title exists
        elements.postNoTitle_el.style.display = 'none';
    }

    var comments = this.postData.inline_comments;
    goog.dom.removeChildren(elements.commentItems_el);

    if (comments.length > 0) {
        elements.commentContainerNoComment_el.style.display = 'none';
        for (var i in comments) {
            new postile.view.post.InlineComment(
                elements.commentItems_el, comments[i], this.postData.post.creator_id);
        }
    } else { // no comment
        elements.commentContainerNoComment_el.style.display = 'block';
    }

    elements.commentList_el.scrollTop = elements.commentList_el.scrollHeight;
}

postile.view.post.Post.prototype.enterEditMode = function(req) {
    if (!this.isSelfPost()) { // not my own post, cannot edit
        return;
    }

    this.board.disableMovingCanvas = true;

    this.currMode = postile.view.post.Post.PostMode.EDIT;

    this.editModePost_el.style.display = '';

    this.displayModePost_el.style.display = 'none';
    this.commentModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    var elements = this.editModeElements;
    elements.postTitle_el.style.width = this.wrap_el.offsetWidth - 26 + 'px';

    if (req) {
        elements.postTitle_el.value = this.postData.post.title;
    } else {
        elements.deleteIcon_el.style.display = '';
    }
}

postile.view.post.Post.prototype.enterLockedMode = function() {
    this.currMode = postile.view.post.Post.PostMode.LOCKED;

    this.lockedModePost_el.style.display = '';
    this.displayModePost_el.style.display = '';

    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    var elements = this.lockedModeElements;

    postile.data_manager.getUserData(
        this.postData.post.creator_id, 
        function(data) {
            this.postData.creator = data;
            elements.lockUsername_el.innerHTML = data.username;
        }.bind(this));
}

postile.view.post.Post.prototype.enterNewMode = function() {
    this.currMode = postile.view.post.Post.PostMode.NEW;

    this.newModePost_el.style.display = '';

    this.displayModePost_el.style.display = 'none';
    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.confirmDeleteModePost_el.style.display = 'none';

    var elements = this.newModeElements;

    postile.data_manager.getUserData(
        this.postData.post.creator_id, 
        function(data) {
            this.postData.creator = data;
            elements.newUsername_el.innerHTML = data.username;
        }.bind(this));
}

postile.view.post.Post.prototype.enterConfirmDeleteMode = function() {
    this.currMode = postile.view.post.Post.PostMode.CONFIRM_DELETE;

    this.confirmDeleteModePost_el.style.display = '';

    this.editModePost_el.style.display = '';
    this.displayModePost_el.style.display = 'none';
    this.commentModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';

    this.editModeElements.deleteIcon_el.style.display = 'none';

    var elements = this.confirmDeleteModeElements;
}

postile.view.post.Post.prototype.isSelfPost = function() {
    return localStorage.postile_user_id == this.postData.post.creator_id;
}

postile.view.post.Post.prototype.resetCommentPreview = function(data) {
    var elements = this.displayModeElements;

    var preview_el = elements.commentPreview_el;

    var opacity = 1.0;

    var fadeout = setInterval(function() {
        opacity -= 0.1;
        preview_el.style.opacity = opacity;
    }, 30);

    var fadein;
    setTimeout(function() {
        clearInterval(fadeout);

        postile.data_manager.getUserData(
            data.inline_comment.creator_id, 
            function(userData) {
                elements.commentPreviewNoComment_el.style.display = 'none';
                elements.commentPreviewDisplay_el.style.display = 'table-cell';
                elements.commentPreviewAuthor_el.innerHTML = 
                    userData.username;
                elements.commentPreviewContent_el.innerHTML = 
                    data.inline_comment.content;

                // reset width since length of different usernames are different
                elements.commentPreviewContent_el.style.width = 
                    this.wrap_el.offsetWidth - 
                        elements.commentPreviewAuthor_el.offsetWidth - 36 + 'px';

                fadein = setInterval(function() {
                    opacity += 0.1;
                    preview_el.style.opacity = opacity;
                }, 30);
            }.bind(this));
    }.bind(this), 300);

    setTimeout(function() {
        clearInterval(fadein);
    }, 600);

    this.resetCommentCount();
}

postile.view.post.Post.prototype.resetCommentCount = function() {
    var commentCount = this.postData.inline_comments.length;
    var commentCountText;

    if (commentCount == 0) {
        commentCountText = 'no comment';
    } else if (commentCount == 1) {
        commentCountText = '1 comment';
    } else {
        commentCountText = commentCount + ' comments';
    }
    
    this.displayModeElements.postCommentCount_el.innerHTML = commentCountText;
}

postile.view.post.Post.prototype.hideNoCommentEl = function() {
    this.commentModeElements.commentContainerNoComment_el.style.display = 'none';
}

postile.view.post.Post.prototype.inlineCommentRendered = function(comment) {
    var comment_ids = this.postData.inline_comments.map(function(c) {
        return c.inline_comment.id;
    });

    return (comment_ids.indexOf(comment.inline_comment.id) != -1);
}

postile.view.post.Post.prototype.appendInlineComment = function(comment) {
    new postile.view.post.InlineComment(
        this.commentModeElements.commentItems_el, comment, this.postData.post.creator_id);
}

postile.view.post.Post.prototype.removeInlineComment = function(comment) {
    var comments = this.postData.inline_comments;

    for (var i in this.postData.inline_comments) {
        var cmt = this.postData.inline_comments[i];

        if (cmt.inline_comment.id == comment.id) {
            this.commentModeElements.commentItems_el.removeChild(cmt.dom); // remove dom
            this.postData.inline_comments.splice(i, 1); // remove data from array
            break;
        }
    }

    if (comments.length == 0) { // removed last comment
        this.commentModeElements.commentContainerNoComment_el.style.display = 'block';
    }
}
