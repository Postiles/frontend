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

/**
 * A factory function that creates a post from JSON data retrieved from the server
 */
postile.view.post.createPostFromJSON = function(postData, board, mode) {
    if (postData.post.image_url) { // PicturePost
        return new postile.view.post.picture_post.PicturePost(postData, board, mode);
    } else if (postData.post.video_link) { // VideoPost
        return new postile.view.post.video_post.VideoPost(postData, board, mode);
    } else { // TextPost
        return new postile.view.post.text_post.TextPost(postData, board, mode);
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

    // precalculate this two so that future intersect test will be faster
    this.postData.post.coord_x_end = this.postData.post.pos_x + this.postData.post.span_x;
    this.postData.post.coord_y_end = this.postData.post.pos_y + this.postData.post.span_y;

    this.wrap_el.style.left = this.board.xPosTo(this.postData.post.pos_x) + 'px';
    this.wrap_el.style.top = this.board.yPosTo(this.postData.post.pos_y) + 'px';
    this.wrap_el.style.width = this.board.widthTo(this.postData.post.span_x) + 'px';
    this.wrap_el.style.height = this.board.heightTo(this.postData.post.span_y) + 'px';

    goog.dom.appendChild(this.board.canvas, this.wrap_el);
    this.changeCurrentMode(this.currMode);

    // disable double click entering mask mode
    goog.events.listen(this.wrap_el, goog.events.EventType.DBLCLICK, function(e) {
        e.stopPropagation();
    });

    // NOTE: do not add any other event listener here unless it is for wrap_el
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
}

/**
 * Load post UI components from the static html file and bind events for it
 */
postile.view.post.Post.prototype.loadUIComponents = function() {
    // create wrapper for post
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');

    // load static html template
    postile.ui.load(this.wrap_el, postile.conf.staticResource([ '_post_in_board.html' ]));

    // load different post modes
    this.loadDisplayModeUIComponents();
    this.loadCommentModeUIComponents();
    this.loadEditModeUIComponents();
    this.loadLockedModeUIComponents();
    this.loadNewModeUIComponents();
}

postile.view.post.Post.prototype.loadDisplayModeUIComponents = function() {
    this.displayModePost_el = postile.dom.getDescendantByClass(this.wrap_el, 'display_mode_post');

    // This function is just a shortcut for the getDescendantByClass function
    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.displayModePost_el, nodeCls);
    }.bind(this);

    // all the UI components for display mode
    this.displayModeElements = {
        container_el: $('post_container'),
        postInnerContainer_el: $('post_inner_container'),
        postTitle_el: $('post_title'),
        postAuthor_el: $('post_author'),
        postContent_el: $('post_content'),
        postEditButton_el: $('post_edit_button'),
        postLikeContainer_el: $('post_like_container'),
        postLikeCount_el: $('post_like_count'),
        postLikeButton_el: $('post_like_button'),
        commentPreview_el: $('comment_preview'),
        commentPreviewNoComment_el: $('comment_preview_no_comment'),
        commentPreviewDisplay_el: $('comment_preview_display'),
        commentPreviewAuthor_el: $('comment_preview_author'),
        commentPreviewContent_el: $('comment_preview_content'),
    };
}

postile.view.post.Post.prototype.loadCommentModeUIComponents = function() {
    this.commentModePost_el = postile.dom.getDescendantByClass(this.wrap_el, 'comment_mode_post');

    // This function is just a shortcut for the getDescendantByClass function
    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.commentModePost_el, nodeCls);
    }.bind(this);

    // all the UI components for display mode
    this.commentModeElements = {
        container_el: $('post_container'),
        postInnerContainer_el: $('post_inner_container'),
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
    this.editModePost_el = postile.dom.getDescendantByClass(this.wrap_el, 'edit_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.editModePost_el, nodeCls);
    }.bind(this);

    this.editModeElements = {
        container_el: $('post_container'),
        postTitle_el: $('post_title'),
        postAuthor_el: $('post_author'),
        postContent_el: $('post_content'),
    }
}

postile.view.post.Post.prototype.loadLockedModeUIComponents = function() {
    this.lockedModePost_el = postile.dom.getDescendantByClass(this.wrap_el, 'locked_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.lockedModePost_el, nodeCls);
    }.bind(this);

    this.lockedModeElements = {
        container_el: $('post_container'),
        lockUsername_el: $('lock_username'),
    }
}

postile.view.post.Post.prototype.loadNewModeUIComponents = function() {
    this.newModePost_el = postile.dom.getDescendantByClass(this.wrap_el, 'new_mode_post');

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.newModePost_el, nodeCls);
    }.bind(this);

    this.newModeElements = {
        container_el: $('post_container'),
        newUsername_el: $('new_username'),
    }
}

/**
 * Define the global event handles for the post
 */
postile.view.post.Post.prototype.eventHandlers = {
    postExpandHandler: function() {
        var postExpand = new postile.view.post.PostExpand(this.postData.post);
        postExpand.open();
    },
    profilePreviewHandler: function() {
        var profileView = new postile.view.profile.ProfileView(this.postData.creator.id);
    },
    displayMode: function() {
        this.changeCurrentMode(postile.view.post.Post.PostMode.DISPLAY);
    },
    commentMode: function() {
        this.changeCurrentMode(postile.view.post.Post.PostMode.COMMENT);
    },
    editMode: function() {
        this.changeCurrentMode(postile.view.post.Post.PostMode.EDIT);
    },
    lockedMode: function() {
        this.changeCurrentMode(postile.view.post.Post.PostMode.LOCKED);
    },
    commentKeyDown: function(e) {
        if (e.keyCode == 13) { // enter pressed
            var content = this.commentModeElements.commentInput_el.value;
            if (content) {
                // TODO: submit inline comment
            }
        }
    },
    postContentKeyDown: function(e) {
        if (e.keyCode == 13 && e.ctrlKey) {
            /*
            postile.ajax([ 'post', 'submit_change' ], { }, function(data) {
            });
            */
            this.submitChange();
        }
    },
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
}

postile.view.post.Post.prototype.initDisplayModeListener = function() {
    var elements = this.displayModeElements;
    this.displayModeListeners = {
        // expand post
        titleClick: new postile.events.EventHandler(
                elements.postTitle_el, goog.events.EventType.CLICK, 
                this.eventHandlers.postExpandHandler.bind(this)),
        // display user profile
        authorClick: new postile.events.EventHandler(
                elements.postAuthor_el, goog.events.EventType.CLICK,
                this.eventHandlers.profilePreviewHandler.bind(this)),
        // enter edit mode by clicking on content
        contentClick: new postile.events.EventHandler(
                elements.postContent_el, goog.events.EventType.CLICK,
                this.eventHandlers.editMode.bind(this)),
        // enter edit mode by clicking on edit button
        editClick: new postile.events.EventHandler(
                elements.postEditButton_el, goog.events.EventType.CLICK,
                this.eventHandlers.editMode.bind(this)),
        // comment preview clicked, enter comment mode
        commentPreviewClick: new postile.events.EventHandler(
                elements.commentPreview_el, goog.events.EventType.CLICK,
                this.eventHandlers.commentMode.bind(this)),
    }
}

postile.view.post.Post.prototype.initCommentModeListener = function() {
    var elements = this.commentModeElements;
    this.commentModeListeners = {
        // enter pressed for comment input
        inputEnterKey: new postile.events.EventHandler(
                elements.commentInput_el, goog.events.EventType.KEYDOWN,
                this.eventHandlers.commentKeyDown.bind(this)),
        // close clicked in comment mode
        closeClick: new postile.events.EventHandler(
                elements.commentCloseButton_el, goog.events.EventType.CLICK,
                this.eventHandlers.displayMode.bind(this)),
    }
}

postile.view.post.Post.prototype.initEditModeListener = function() {
    var elements = this.editModeElements;
    this.editModeListeners = {
        // ctrl + enter pressed for post content
        postContentCtrlEnter: new postile.events.EventHandler(
                elements.postContent_el, goog.events.EventType.KEYDOWN,
                this.eventHandlers.postContentKeyDown.bind(this)),
    }
}

postile.view.post.Post.prototype.initLockedModeListener = function() {
    var elements = this.lockedModeElements;
    this.lockedModelListener = {
        // TODO
    }
}

postile.view.post.Post.prototype.initNewModeListener = function() {
    var elements = this.newModeElements;
    this.newModeListener = {
        // TODO
    }
}

/**
 * Change current mode, this function calls specific functions to do stuff
 */
postile.view.post.Post.prototype.changeCurrentMode = function(mode) {
    switch (mode) {
    case postile.view.post.Post.PostMode.DISPLAY:
        this.enterDisplayMode();
        break;
    case postile.view.post.Post.PostMode.COMMENT:
        this.enterCommentMode();
        break;
    case postile.view.post.Post.PostMode.EDIT:
        this.enterEditMode();
        break;
    case postile.view.post.Post.PostMode.LOCKED:
        this.enterLockedMode();
        break;
    case postile.view.post.Post.PostMode.NEW:
        this.enterNewMode();
        break;
    }
}

postile.view.post.Post.prototype.enterDisplayMode = function() {
    this.currMode = postile.view.post.Post.PostMode.DISPLAY;

    this.displayModePost_el.style.display = '';
    this.displayModePost_el.style.opacity = '1.0';

    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';

    // enable all the listeners
    for (var i in this.displayModeListeners) {
        this.displayModeListeners[i].listen();
    }

    var elements = this.displayModeElements;
    elements.postTitle_el.innerHTML = this.postData.post.title;
    elements.postLikeCount_el.innerHTML = this.postData.likes.length;

    postile.data_manager.getUserData(this.postData.post.creator_id, function(data) {
        this.postData.creator = data;
        elements.postAuthor_el.innerHTML = data.username;
    }.bind(this));

    if (this.postData.post.title) { // title not empty
        elements.postAuthor_el.style.marginLeft = '20px';
    }

    var liked_users = this.postData.likes.map(function(l) {
        return l.user_id;
    });

    // display 'like' or 'unlike'
    if (liked_users.indexOf(postile.conf.currentUserId) != -1) { // liked
        elements.postLikeButton_el.innerHTML = 'unlike';
    } else {
        elements.postLikeButton_el.innerHTML = 'like';
    }

    if (this.isSelfPost()) { // my own post
        elements.postContent_el.style.cursor = 'auto';
    } else {
        elements.postEditButton_el.style.display = 'none';
        elements.postContent_el.style.cursor = 'default';
    }

    // latest inline comment
    var latestComment = this.postData.inline_comments[ this.postData.inline_comments.length - 1 ];

    if (latestComment) { // at least one comment
        postile.data_manager.getUserData(latestComment.inline_comment.creator_id, function(data) {
            latestComment.creator = data;

            elements.commentPreviewAuthor_el.innerHTML = latestComment.creator.username;
            elements.commentPreviewContent_el.innerHTML = latestComment.inline_comment.content;
            elements.commentPreviewNoComment_el.style.display = 'none';
            elements.commentPreview_el.style.display = 'block';
        });
    } else { // no comment
        elements.commentPreviewDisplay_el.style.display = 'none';
        elements.commentPreview_el.style.display = 'block';
    }
}

postile.view.post.Post.prototype.enterCommentMode = function() {
    this.currMode = postile.view.post.Post.PostMode.COMMENT;

    this.commentModePost_el.style.display = '';

    this.displayModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.lockedModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';

    // enable all the listeners
    for (var i in this.commentModeListeners) {
        this.commentModeListeners[i].listen();
    }

    var elements = this.commentModeElements;
    elements.postTitle_el.innerHTML = this.postData.post.title;
    elements.postAuthor_el.innerHTML = this.postData.creator.username;
    elements.commentContainer_el.style.height = 
            this.wrap_el.offsetHeight - elements.postInnerContainer_el.offsetHeight + 'px';
    elements.commentInput_el.style.width = 
            this.wrap_el.offsetWidth - 60 + 'px';

    var comments = this.postData.inline_comments;
    if (comments.length > 0) {
        elements.commentContainerNoComment_el.style.display = 'none';
    } else { // no comment
        for (var i in comments) {
            // TODO
        }
    }
}

postile.view.post.Post.prototype.enterEditMode = function() {
    if (!this.isSelfPost()) { // not my own post, cannot edit
        return;
    }

    postile.ajax([ 'post', 'start_edit' ], { post_id: this.postData.post.id }, function(data) {
        this.currMode = postile.view.post.Post.PostMode.EDIT;

        this.editModePost_el.style.display = '';

        this.displayModePost_el.style.display = 'none';
        this.commentModePost_el.style.display = 'none';
        this.lockedModePost_el.style.display = 'none';
        this.newModePost_el.style.display = 'none';

        // enable all the listeners
        for (var i in this.editModeListeners) {
            this.editModeListeners[i].listen();
        }

        var elements = this.editModeElements;
        elements.postTitle_el.innerHTML = this.postData.post.title;
        console.log(elements.postTitle_el);
        elements.postTitle_el.style.width = this.wrap_el.offsetWidth - 26 + 'px';
    }.bind(this));
}

postile.view.post.Post.prototype.enterLockedMode = function() {
    this.currMode = postile.view.post.Post.PostMode.LOCKED;

    this.lockedModePost_el.style.display = '';

    this.displayModePost_el.style.opacity = '0.2';
    this.commentModePost_el.style.display = 'none';
    this.editModePost_el.style.display = 'none';
    this.newModePost_el.style.display = 'none';

    // enable all the listeners
    for (var i in this.lockedModelListener) {
        this.lockedModelListener[i].listen();
    }

    var elements = this.lockedModeElements;

    postile.data_manager.getUserData(this.postData.post.creator_id, function(data) {
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

    // enable all the listeners
    for (var i in this.newModeListener) {
        this.newModeListener[i].listen();
    }

    var elements = this.newModeElements;

    console.log(elements);
    postile.data_manager.getUserData(this.postData.post.creator_id, function(data) {
        this.postData.creator = data;
        elements.newUsername_el.innerHTML = data.username;
    }.bind(this));
}

postile.view.post.Post.prototype.isSelfPost = function() {
    return postile.conf.currentUserId == this.postData.post.creator_id;
}
