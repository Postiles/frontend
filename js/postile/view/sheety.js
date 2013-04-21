goog.provide('postile.view.Sheety');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.functions');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.date');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.Container');
goog.require('goog.ui.Control');
goog.require('goog.ui.Textarea');

goog.require('postile.conf');
goog.require('postile.faye');
goog.require('postile.view');
goog.require('postile.view.post_board.handlers');
goog.require('postile.templates.sheety');
goog.require('postile.data_manager');
goog.require('postile.async');

/**
 * FullScreenView-compatible goog.ui.Component.
 * Specifically, it has a .close method and closes postile.current_view
 * in its constructor.
 * @constructor
 */
postile.view.GoogFSV = function() {
    postile.view.closeCurrentFullScreenView();
    goog.base(this);
};
goog.inherits(postile.view.GoogFSV, goog.ui.Component);

/**
 * Close this view by removing its element out of the dom, clearing
 * all event handlers, etc etc.
 * The default action is to dispose it. And it should be sufficient.
 * Override {exitDocument} to provide additional behavior.
 */
postile.view.GoogFSV.prototype.close = function() {
    this.dispose();
};

/**
 * Spread-sheety view.
 * @constructor
 */
postile.view.Sheety = function(opt_boardId) {
    goog.base(this);

    /**
     * @type {number}
     * @private
     */
    this.boardId_ = goog.isDef(opt_boardId) ? opt_boardId : 1;

    /**
     * Contains a list of posts. Its model is a {Array.<PostWE>}
     * The left hand side of the sheet.
     * @private
     */
    this.postList_ = new postile.view.Sheety.PostList();

    /**
     * Comment row container.
     * The right hand side of the sheet.
     * @private
     */
    this.commentRows_ = new goog.ui.Component();

    /**
     * Maps post id to row in sheet. Initialized after fetching data.
     * @type {Object.<postile.view.Sheety.CommentRow>}
     * @private
     */
    this.postIdToRow_ = {};

    /**
     * Faye channel, to be cancelled on destroy.
     * Initialized in this.enterDocument.
     * @type {Faye.Subscription}
     * @private
     */
    this.fayeSubscr_ = null;

    // Fetchs board data, then fetchs user data, finally renders the view.
    var fetchPosts = goog.partial(
        postile.ajax,
        ['board', 'get_recent_posts'],
        { 'board_id': this.boardId_, 'number': 40 });
    postile.async.Promise.fromCallback(fetchPosts)
    .bind(postile.view.Sheety.fetchUserOfBoardData_)
    .bind(this.renderPosts_, this);

    postile.view.loadCss(['sheety.css']);
};
goog.inherits(postile.view.Sheety, postile.view.GoogFSV);

/**
 * Custom event types used by sheety.
 * @enum {string}
 */
postile.view.Sheety.EventType = {
    LOCAL_ADD_COMMENT: goog.events.getUniqueId('add-cmt'),
    LOCAL_SUBMIT_COMMENT: goog.events.getUniqueId('submit-cmt'),
    LOCAL_CANCEL_ADD_COMMENT: goog.events.getUniqueId('cancel-edit-cmt'),
    LOCAL_SUBMIT_COMMENT_OK: goog.events.getUniqueId('submit-cmt-ok'),

    LOCAL_SUBMIT_LIKE:
        goog.events.getUniqueId('submit-like'),
    LOCAL_SUBMIT_UNLIKE:
        goog.events.getUniqueId('submit-unlike'),
    LOCAL_ALTER_LIKE_OK:
        goog.events.getUniqueId('alter-like-ok'),

    LOCAL_DEL_COMMENT:
        goog.events.getUniqueId('del-cmt'),

    REMOTE_NEW_COMMENT: goog.events.getUniqueId('faye-new-cmt'),
    REMOTE_DEL_COMMENT: goog.events.getUniqueId('faye-del-cmt')
};

/**
 * Create a skeleton dom for self and children.
 * @inheritDoc
 */
postile.view.Sheety.prototype.createDom = function() {
    var el = goog.dom.createDom('div', 'sheety-body');
    this.setElementInternal(el);

    goog.array.forEach(this.getModel(), function(postEx) {
        var postId = postEx['post']['id'];

        var row = new postile.view.Sheety.CommentRow(
            postId,
            postEx['comments'] /* model */);

        // Add mapping from postId to row view.
        // XXX: move this out of createDom?
        this.postIdToRow_[postId] = row;

        this.commentRows_.addChild(row, true);
    }, this);

    this.addChild(this.postList_, true);
    this.addChild(this.commentRows_, true);
};

postile.view.Sheety.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    goog.events.listen(this,
        postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT,
        goog.bind(this.submitNewComment, this));

    goog.events.listen(this,
        [ postile.view.Sheety.EventType.LOCAL_SUBMIT_LIKE
        , postile.view.Sheety.EventType.LOCAL_SUBMIT_UNLIKE
        ], goog.bind(this.submitAlterLike, this));

    goog.events.listen(this,
        postile.view.Sheety.EventType.LOCAL_DEL_COMMENT,
        goog.bind(this.submitDelComment, this));

    goog.events.listen(this,
        postile.view.Sheety.EventType.REMOTE_NEW_COMMENT,
        goog.bind(this.receivedNewComment, this));

    goog.events.listen(this,
        postile.view.Sheety.EventType.REMOTE_DEL_COMMENT,
        goog.bind(this.receivedDelComment, this));

    this.fayeSubscr_ = postile.faye.subscribe(this.boardId_,
        function(code, data) {
            // Copied from view/post_board/post_board.js
            switch (code) {
            case postile.view.post_board.faye_status.INLINE_COMMENT:
                this.dispatchEvent(
                    new goog.events.Event(
                        postile.view.Sheety.EventType.REMOTE_NEW_COMMENT,
                        data));
                break;

            case postile.view.post_board.faye_status.DELETE_COMMENT:
                this.dispatchEvent(
                    new goog.events.Event(
                        postile.view.Sheety.EventType.REMOTE_DEL_COMMENT,
                        data));
                break;

            default:
                return;
            }
        }, this);
};

postile.view.Sheety.prototype.exitDocument = function() {
    this.fayeSubscr_.addCallback(function(subscr) {
        subscr.cancel();
    });

    goog.base(this, 'exitDocument');
};

/**
 * Find the corresponding CommentRow by the given postId, or null
 * if not found.
 */
postile.view.Sheety.prototype.findRowByPostId = function(postId) {
    return goog.object.get(this.postIdToRow_, postId, null);
};

postile.view.Sheety.prototype.submitNewComment = function(e) {
    /** @type {postId: number, content: string} */
    var target = e.target;

    // The actual comment dom insertion is not handled here.
    // See receivedAddComment
    postile.ajax(['inline_comment', 'new'], {
        'post_id': target.postId,
        'content': target.content
    }, goog.bind(this.dispatchEvent, this,
        new goog.events.Event(
            postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT_OK)));

    // XXX: handle timeout?
};

postile.view.Sheety.prototype.submitAlterLike = function(e) {
    var isLiking;
    if (e.type == postile.view.Sheety.EventType.LOCAL_SUBMIT_LIKE) {
        isLiking = true;
    }
    else {
        isLiking = false;
    }

    postile.ajax(['inline_comment', isLiking ? 'like' : 'unlike'], {
        'comment_id': e.target.commentId
    }, function() {
        var cell = e.target.commentCell;
        var newLikeCount = e.target.likeCount + (isLiking ? 1 : (-1));
        var newE = new goog.events.Event(
            postile.view.Sheety.EventType.LOCAL_ALTER_LIKE_OK, {
                likeCount: newLikeCount,
                liked: isLiking
            });
        cell.dispatchEvent(newE);
    });
};

postile.view.Sheety.prototype.submitDelComment = function(e) {
    /** 
     * @type {
     *   commentCell: postile.view.Sheety.CommentCell,
     *   commentId: number
     * }
     */
    var target = e.target;

    postile.ajax(['inline_comment', 'delete'], {
        'comment_id': target.commentId
    }, function() {
        // Not handled here (instead in faye)
        // See receivedDelComment
    });
};

postile.view.Sheety.prototype.receivedNewComment = function(e) {
    var comment = e.target['inline_comment'];
    var row = this.findRowByPostId(comment['post_id']);
    if (!row) {
        // No such post id
        return;
    }
    postile.view.Sheety.fetchUserOfComment_(e.target, comment['post_id'])
    .lift(function(commentData) {
        row.showNewComment(commentData);
    });
};

postile.view.Sheety.prototype.receivedDelComment = function(e) {
    var comment = e.target['inline_comment'];
    var row = this.findRowByPostId(comment['post_id']);
    if (!row) {
        // No such post id
        return;
    }
    row.delCommentById(comment['id']);
};

/**
 * Transform a boarddata into renderable data.
 * @private
 */
postile.view.Sheety.fetchUserOfBoardData_ = function(response) {
    var postExs = response['message'];
    var postProms = goog.array.map(postExs, function(postEx) {
        return postile.view.Sheety.fetchUserOfPost_(postEx['post']);
    });
    var commentProms = goog.array.map(postExs, function(postEx) {
        var innerProms = goog.array.map(postEx['inline_comments'],
            function(comment) {
                return postile.view.Sheety.fetchUserOfComment_(
                    comment, postEx['post']['creator_id']);
            });
        return postile.async.Promise.waitForAll(innerProms);
    });
    return postile.async.Promise.waitForAll([
               postile.async.Promise.waitForAll(postProms),
               postile.async.Promise.waitForAll(commentProms)
           ]).lift(function(xs) {
               var posts = xs[0];
               var commentss = xs[1];
               goog.array.forEach(posts, function(post, i) {
                   post['comments'] = commentss[i];
               });
               return posts;
           });
};

/**
 * @typedef {
 *   post: {content: ...}
 *   post_creator: {username: ...}
 *   comments: [
 *     {
 *       cmt_likes: number,
 *       cmt_liked: boolean,
 *       cmt_data: {content: ...}
 *       cmt_creator: {username: ...}
 *     }
 *   ]
 * }
 */
postile.view.Sheety.PostEx;

/**
 * Data fetch pipeline.
 *
 * Two kinds of data source:
 *   1. <board-data>
 *   2. <inline-comment-we> (likes = 0)
 *
 *   where board-data = post-we*
 *         post-we = <post> _ <inline-comments>
 *         inline-comments = <inline-comment-we>*
 *         inline-comment-we = <inline-comment> <likes>
 *
 * Two kind of processed data:
 *   a. <board-data'>
 *   b. <comment'>
 *   
 *   where board-data' = post-ex*
 *         post-ex = <post> <post-creator> <comment'>*
 *         comment' = <cmt-like> <cmt-liked> <cmt-data> <cmt-creator>
 *
 * Processors:
 *   fetchUserOfPost: <post> -> <post> <post-creator>
 *   fetchUserOfComment: <inline-comment-we> -> <comment'>
 */

postile.view.Sheety.fetchUserOfPost_ = function(post) {
    var cid = post['creator_id'];
    var fetcher = goog.partial(postile.data_manager.getUserData, cid);
    return postile.async.Promise.fromCallback(fetcher)
           .lift(function(user) {
               // Merge with post
               return {
                   'post': post,
                   'post_creator': user
               };
           });
};

postile.view.Sheety.fetchUserOfComment_ = function(commentWe, postCid) {
    var inlCmt = commentWe['inline_comment'];
    var cid = inlCmt['creator_id'];
    var likes = commentWe['likes'];
    var selfId = postile.conf.getSelfUserId();
    var liked = goog.array.some(likes, function(like) {
        return like['user_id'] == selfId;
    });
    var fetcher = goog.partial(postile.data_manager.getUserData, cid);
    var skeleton = {
        'cmt_data': inlCmt,
        'cmt_likeCount': likes.length,
        'cmt_liked': liked,
        // Either the comment is created by this user
        // Or the post is created by this user
        'cmt_canDel': cid == selfId || postCid == selfId
    };

    return postile.async.Promise.fromCallback(fetcher)
           .lift(function(user) {
               // Merge with comment
               skeleton['cmt_creator'] = user;
               return skeleton;
           });
};

/**
 * Called when board data is received.
 * @param {Array.<postile.view.Sheety.PostEx>} postExs
 * post-processed data, suitable for rendering.
 * @private
 */
postile.view.Sheety.prototype.renderPosts_ = function(postExs) {

    var comments = goog.array.map(postExs,
        function(postEx) {
            return postEx['comments'];
        });

    this.setModel(postExs);
    this.postList_.setModel(postExs);
    this.commentRows_.setModel(comments);
    this.render(goog.dom.getElement('wrapper'));
};

/**
 * Contains many post cells.
 * @constructor
 */
postile.view.Sheety.PostList = function() {
    goog.base(this);

    /**
     * Used to unlisten document event.
     * Initialized in this.enableFloat()
     * @private
     */
    this.floatHandlerKey_ = null;
};
goog.inherits(postile.view.Sheety.PostList, goog.ui.Component);

postile.view.Sheety.PostList.prototype.createDom = function() {
    var el = goog.dom.createDom('div', 'sheety-post-list');
    this.setElementInternal(el);

    // Make and add post cells
    goog.array.forEach(this.getModel(), function(postEx) {
        var cell = new postile.view.Sheety.PostCell();
        cell.setModel(postEx);
        this.addChild(cell, true);
    }, this);
};

postile.view.Sheety.PostList.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');
    this.enableFloat();
};

postile.view.Sheety.PostList.prototype.exitDocument = function() {
    goog.events.unlistenByKey(this.floatHandlerKey_);
    goog.base(this, 'exitDocument');
};

postile.view.Sheety.PostList.prototype.enableFloat = function() {
    // XXX: adjust initScrollTop a bit when we have something
    // above this view.
    var initScrollTop = document.body.scrollTop;
    this.floatHandlerKey_ = goog.events.listen(
        document,
        goog.events.EventType.SCROLL,
        goog.bind(this.syncScroll, this, initScrollTop));
    this.startFloating();
    this.syncScroll(initScrollTop);
};

postile.view.Sheety.PostList.prototype.syncScroll =
function(initScrollTop) {
    var el = this.getElement();
    el.style.top =
        String(initScrollTop - document.body.scrollTop) + 'px';
};

/**
 * Make self a fix-positioned element, and attach event handlers
 * to sync it with y-scrolling.
 */
postile.view.Sheety.PostList.prototype.startFloating = function() {
    var elem = this.getElement();
    var STORED_STYLE_PROPS_ = [
        'position', 'top', 'left', 'width', 'cssFloat'];

    var PLACEHOLDER_STYLE_PROPS_ = [
        'position', 'top', 'left', 'display', 'cssFloat',
        'marginTop', 'marginLeft', 'marginRight', 'marginBottom'];

    // Read properties of element before modifying it.
    var originalLeft_ = goog.style.getPageOffsetLeft(elem);
    var originalWidth_ = goog.style.getContentBoxSize(elem).width;
    var parentElement = document.body;
    var placeholder_ = goog.dom.createDom('div', {
        'style': 'visibility: hidden'
    });
  
    var originalStyles_ = {};  
  
    // Store styles while not floating so we can restore them when the
    // element stops floating.
    goog.object.forEach(STORED_STYLE_PROPS_,
                        function(property) {
                          originalStyles_[property] = elem.style[property];
                        });

    // Copy relevant styles to placeholder so it will be layed out the same
    // as the element that's about to be floated.
    goog.object.forEach(PLACEHOLDER_STYLE_PROPS_,
                        function(property) {
                          placeholder_.style[property] =
                            elem.style[property] ||
                            goog.style.getCascadedStyle(elem, property) ||
                            goog.style.getComputedStyle(elem, property);
                        });

    goog.style.setSize(placeholder_, elem.offsetWidth, elem.offsetHeight);

    // Make element float.
    goog.style.setStyle(elem, {
      'left': originalLeft_ + 'px',
      'width': originalWidth_ + 'px',
      'cssFloat': 'none'
    });

    // If parents are the same, avoid detaching and reattaching elem.
    // This prevents Flash embeds from being reloaded, for example.
    elem.parentNode.replaceChild(placeholder_, elem);
    parentElement.appendChild(elem);

    elem.style.position = 'fixed';
    elem.style.top = '0';
};

/**
 * Displays a post and a button for editing new comments.
 * @constructor
 */
postile.view.Sheety.PostCell = function() {
    goog.base(this);

    this.addButton_ = new goog.ui.Control('Add Comment',
        goog.ui.ControlRenderer.getCustomRenderer(
            goog.ui.ControlRenderer, 'mkcomment'));
    this.commentPop_ = new postile.view.Sheety.AddCommentPop(this);
};
goog.inherits(postile.view.Sheety.PostCell, goog.ui.Component);

postile.view.Sheety.PostCell.prototype.getPostId = function() {
    return this.getModel()['post']['id'];
};

postile.view.Sheety.PostCell.prototype.getSheety = function() {
    return this.getParent().getParent();
};

postile.view.Sheety.PostCell.prototype.createDom = function() {
    var preProcData = {
        who: this.getModel()['post_creator']['username']
    };
    var el = goog.dom.createDom('div', {
        'className': 'sheety-post-cell', 
        'innerHTML': postile.templates.sheety.post(preProcData)
    });
    this.setElementInternal(el);

    this.addChild(this.addButton_, true);

    // XXX: add to parent? wat?
    this.getParent().addChild(this.commentPop_, true);
};

postile.view.Sheety.PostCell.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    var sheety = this.getSheety();

    // On click add-comment: start editing comment
    goog.events.listen(
        this.addButton_,
        goog.ui.Component.EventType.ACTION,
        function() {
            var e = new goog.events.Event(
                postile.view.Sheety.EventType.LOCAL_ADD_COMMENT, this);
            this.dispatchEvent(e);
            this.commentPop_.slideToShow();
        }, undefined, this);

    // On editing start: disable buttons
    goog.events.listen(
        sheety,
        postile.view.Sheety.EventType.LOCAL_ADD_COMMENT,
        goog.bind(this.addButton_.setEnabled, this.addButton_, false));

    // On cancel or submit-ok: re-enable buttons
    goog.events.listen(
        sheety,
        [ postile.view.Sheety.EventType.LOCAL_CANCEL_ADD_COMMENT
        , postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT_OK
        ], goog.bind(this.addButton_.setEnabled, this.addButton_, true));
};

/**
 * The actual view for add new comments. Usually hides behind its
 * corresponding PostCell. Will slide out when user starts editing a
 * comment.
 * @constructor
 */
postile.view.Sheety.AddCommentPop = function(postCell) {
    goog.base(this, undefined,
              goog.ui.ContainerRenderer.getCustomRenderer(
                  goog.ui.ContainerRenderer, 'sheety-new-comment-cell'));

    this.isShown_ = false;
    this.postCell_ = postCell;
    this.textarea_ = new goog.ui.Textarea();
    this.submitButton_ = new goog.ui.Button('Submit');
    this.cancelButton_ = new goog.ui.Button('Cancel');
};
goog.inherits(postile.view.Sheety.AddCommentPop, goog.ui.Container);

postile.view.Sheety.AddCommentPop.prototype.getSheety = function() {
    return this.postCell_.getSheety();
};

postile.view.Sheety.AddCommentPop.prototype.createDom = function() {
    goog.base(this, 'createDom');

    this.getElement().innerHTML = postile.templates.sheety.newCommentPop();
    this.addChild(this.textarea_, true);
    this.addChild(this.cancelButton_, true);
    this.addChild(this.submitButton_, true);
};

postile.view.Sheety.AddCommentPop.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    // Actually not really needed..
    this.setEnabled(false);

    // Closure bug walkaround: enable text selection
    this.textarea_.setAllowTextSelection(true);

    var sheety = this.getSheety();

    // On click submit: dispatch submit event and disable self
    goog.events.listen(
        this.submitButton_,
        goog.ui.Component.EventType.ACTION,
        function(_) {
            var e = new goog.events.Event(
                postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT, {
                    postId: this.postCell_.getPostId(),
                    content: this.textarea_.getValue()
                });
            this.setEnabled(false);
            this.dispatchEvent(e);
        }, undefined, this);

    // On click cancel: dispatch cancel event and hide self
    goog.events.listen(
        this.cancelButton_,
        goog.ui.Component.EventType.ACTION,
        function(_) {
            var e = new goog.events.Event(
                postile.view.Sheety.EventType.LOCAL_CANCEL_ADD_COMMENT,
                this);
            this.slideToHide();
            this.dispatchEvent(e);
        }, undefined, this);

    // On submit ok: hide self
    goog.events.listen(
        sheety,
        postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT_OK,
        function() {
            if (this.isShown_) {
                // Implies this was doing submission
                this.slideToHide();
            }
        }, undefined, this);

    // XXX: On timeout?
};

postile.view.Sheety.AddCommentPop.prototype.slideToShow = function() {
    // Prepare to be shown
    this.isShown_ = true;
    this.setEnabled(true);
    this.textarea_.setValue('');

    // Absolute positioning
    var postEl = this.postCell_.getElement();
    var el = this.getElement();
    var dx = goog.style.getSize(postEl).width;
    var dy = goog.style.getPosition(postEl).y;

    goog.style.setStyle(el, {
        'top': String(dy) + 'px',
        'left': String(dx) + 'px'
    });
};

postile.view.Sheety.AddCommentPop.prototype.slideToHide = function() {
    this.isShown_ = false;

    goog.style.setStyle(this.getElement(), {
        'left': 0
    });
};

/**
 * A row of comment cells
 * @constructor
 */
postile.view.Sheety.CommentRow = function(postId, model) {
    goog.base(this);

    /**
     * Post id of all the comments
     * @type {number}
     */
    this.postId_ = postId;
    this.setModel(model);

    /**
     * Maps comment id to the actual comment view.
     * Will be initialized in makeCommentCell, and
     * modified in delCommentById
     */
    this.commentIdToCell_ = {};
};
goog.inherits(postile.view.Sheety.CommentRow, goog.ui.Component);

postile.view.Sheety.CommentRow.prototype.createDom = function() {
    var el = goog.dom.createDom('div', 'sheety-comment-row');
    this.setElementInternal(el);

    // Reversely add comments
    var model = this.getModel();
    for (var i = model.length - 1; i >= 0; --i) {
        var commentData = model[i];
        this.addChild(this.makeCommentCell(commentData, true), true);
    }
};

postile.view.Sheety.CommentRow.prototype.findCommentById = function(cid) {
    return this.commentIdToCell_[cid];
};

postile.view.Sheety.CommentRow.prototype.delCommentById = function(cid) {
    var child = this.findCommentById(cid);
    if (!child) {
        return;
    }
    delete this.commentIdToCell_[cid];
    this.removeChild(child, true /* opt_unrender */);
};

postile.view.Sheety.CommentRow.prototype.getPostId = function() {
    return this.postId_;
};

postile.view.Sheety.CommentRow.prototype.showNewComment =
function(commentData) {
    this.addChildAt(this.makeCommentCell(commentData, true), 0, true);
};

postile.view.Sheety.CommentRow.prototype.makeCommentCell =
function(commentData, opt_recordInMap) {
    var cell = new postile.view.Sheety.CommentCell();
    cell.setModel(commentData);
    if (opt_recordInMap) {
        this.commentIdToCell_[cell.getCommentId()] = cell;
    }
    return cell;
};

/**
 * Display a certain comment. Can do like and delete here.
 * XXX: currently like_ and del_ doesn't share the same model,
 * since the model is pre-processed in createDom.
 * @constructor
 */
postile.view.Sheety.CommentCell = function() {
    goog.base(this, undefined,
              goog.ui.ContainerRenderer.getCustomRenderer(
                  goog.ui.ContainerRenderer, 'sheety-comment-cell'));

    this.like_ = new goog.ui.Control(null,
        postile.view.Sheety.LikeRenderer.getInstance());
    this.del_ = new goog.ui.Control(null,
        postile.view.Sheety.DelCommentRenderer.getInstance());
};
goog.inherits(postile.view.Sheety.CommentCell, goog.ui.Container);

postile.view.Sheety.CommentCell.prototype.createDom = function() {
    goog.base(this, 'createDom');
    var el = this.getElement();

    var model = this.getModel();
    var ctime = goog.date.DateTime.fromRfc822String(
        model['cmt_data']['created_at']);

    var preProcData = {
        author: model['cmt_creator']['username'],
        ctime: ctime.toUsTimeString(),
        likeCount: model['cmt_likeCount'],
        liked: model['cmt_liked'],
        canDelete: model['cmt_canDel'],
        content: model['cmt_data']['content']
    };

    // Comment header
    el['innerHTML'] = postile.templates.sheety.comment(preProcData);

    // Append like count and del button
    this.like_.setModel(preProcData);
    this.addChild(this.like_, true);

    this.del_.setModel(preProcData);
    this.addChild(this.del_, true);

    // Append content
    var contentFragment = soy.renderAsFragment(
        postile.templates.sheety.commentContent, preProcData);
    goog.dom.append(el, contentFragment);
};

postile.view.Sheety.CommentCell.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    // On click like/unlike, dispatch corresponding events.
    goog.events.listen(
        this.like_,
        goog.ui.Component.EventType.ACTION,
        function() {
            var target = {
                commentId: this.getCommentId(),
                commentCell: this,
                likeCount: this.like_.getModel().likeCount
            };
            var type = this.like_.getModel()['liked'] ?
                postile.view.Sheety.EventType.LOCAL_SUBMIT_UNLIKE :
                postile.view.Sheety.EventType.LOCAL_SUBMIT_LIKE;

            this.like_.setEnabled(false);
            this.dispatchEvent(
                new goog.events.Event(type, target));
        }, undefined, this);

    // On like response, re-enable like button and refresh like count.
    goog.events.listen(
        this,
        postile.view.Sheety.EventType.LOCAL_ALTER_LIKE_OK,
        function(e) {
            this.like_.getModel().liked = e.target.liked;
            this.like_.getModel().likeCount = e.target.likeCount;
            this.syncLike();
            this.like_.setEnabled(true);
        }, undefined, this);

    // On click delete
    goog.events.listen(
        this.del_,
        goog.ui.Component.EventType.ACTION,
        function() {
            var target = {
                commentCell: this,
                commentId: this.getCommentId()
            };
            this.del_.setEnabled(false);
            this.dispatchEvent(
                new goog.events.Event(
                    postile.view.Sheety.EventType.LOCAL_DEL_COMMENT,
                    target));
        }, undefined, this);
};

postile.view.Sheety.CommentCell.prototype.syncLike = function() {
    this.like_.getElement()['innerHTML'] = 
        this.like_.getRenderer().createHtml(this.like_);
};

postile.view.Sheety.CommentCell.prototype.getCommentId = function() {
    return this.getModel()['cmt_data']['id'];
};

/**
 * @constructor
 */
postile.view.Sheety.LikeRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.Sheety.LikeRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(postile.view.Sheety.LikeRenderer);

postile.view.Sheety.LikeRenderer.prototype.getCssClass = function() {
    return 'likes';
};

postile.view.Sheety.LikeRenderer.prototype.createDom = function(like) {
    var el = goog.base(this, 'createDom', like);

    el['innerHTML'] = this.createHtml(like);
    return el;
};

postile.view.Sheety.LikeRenderer.prototype.createHtml = function(like) {
    return postile.templates.sheety.commentLike(like.getModel());
};

/**
 * @constructor
 */
postile.view.Sheety.DelCommentRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.Sheety.DelCommentRenderer,
              goog.ui.ControlRenderer);
goog.addSingletonGetter(postile.view.Sheety.DelCommentRenderer);

postile.view.Sheety.DelCommentRenderer.prototype.getCssClass = function() {
    return 'del';
};

postile.view.Sheety.DelCommentRenderer.prototype.createDom = function(x) {
    var el = goog.base(this, 'createDom', x);

    el['innerHTML'] = postile.templates.sheety.commentDel(x.getModel());
    return el;
};

