goog.provide('postile.view.Sheety');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
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
goog.require('goog.math.Size');
goog.require('goog.math.Coordinate');

goog.require('postile.conf');
goog.require('postile.faye');
goog.require('postile.view');
goog.require('postile.view.At');
goog.require('postile.debbcode');
goog.require('postile.view.post_board.handlers');
goog.require('postile.view.post_board.Header');
goog.require('postile.templates.sheety');
goog.require('postile.data_manager');
goog.require('postile.async');
goog.require('postile.view.onlinepeople');
/**
 * FullScreenView-compatible goog.ui.Component.
 * Specifically, it has a .close method and closes postile.current_view
 * in its constructor.
 * @constructor
 */
postile.view.GoogFSV = function() {
    postile.view.switchCurrentFullScreenViewTo(this);
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
 * By full-screen-view's convention.
 * @see docs/FullScreenView.md
 */
postile.view.GoogFSV.prototype.getRootEl_ = function() {
    return document.body;
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
     * The post to scroll to once the board is rendered.
     * XXX: need a better way to handle location hash if
     *   some more complex encoding scheme is used in the future.
     * @type {number?}
     * @private
     */
    this.initPostId_ = window.location.hash ?
        parseInt(window.location.hash.substring(1)) : null;

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
     * Contains buttons that when clicked, skip to somewhere
     * in the postlist.
     */
    this.skipList_ = new postile.view.Sheety.SkipList();

    /**
     * Maps post-id to row in sheet. Initialized after fetching data.
     * @type {Object.<postile.view.Sheety.CommentRow>}
     * @private
     */
    this.postIdToRow_ = {};

    /**
     * Maps first character of a post to its comment row in sheet.
     * Initialized after fetching data.
     * @type {Object.<postile.view.Sheety.CommentRow>}
     * @private
     */
    this.alphabetToRow_ = {};

    /**
     * Initialized after fetching board data.
     * @type {boolean=}
     * @private
     */
    this.isAnonymous_ = false;

    /**
     * The header of this full screen view.
     * Initialized in renderPosts.
     * @type {postile.view.post_board.Header}
     * @private
     */
    this.header_ = null;

    /**
     * To be kept in sync with post_board.css:#title_bar.
     * XXX: shall we dynamically calculate it?
     */
    this.headerHeight_ = 45;

    /**
     * Faye channel, to be cancelled on destroy.
     * Initialized in this.enterDocument.
     * @type {Faye.Subscription}
     * @private
     */
    this.fayeSubscr_ = null;

    // Firstly fetches boardData to check for anonymity and renders
    //   the header.
    // Secondly fetches recent-posts
    // Thirdly fetches creators of posts and (optionally)
    //   creators of comments.
    // Finally renders posts and comments
    var fetchBoardData = goog.partial(postile.ajax,
        ['board', 'enter_board'], {
            'board_id': this.boardId_
        });
    // Fetches posts
    var fetchRecentPosts = goog.partial(
        postile.ajax,
        ['board', 'get_recent_posts'],
        { 'board_id': this.boardId_, 'number': 0 });

    // Parallelly fetch boardData and recentPosts
    postile.async.Promise.waitForAll(
        [postile.async.Promise.fromCallback(fetchBoardData),
         postile.async.Promise.fromCallback(fetchRecentPosts)])
    .bind(function(xs) {
        // Got board data: renders the header
        var boardData = xs[0]['message']['board'];

        this.header_ = new postile.view.post_board.Header(boardData);
        goog.dom.append(this.getRootEl_(), this.header_.container);
  //prepare for onlinepeople
        this.onlinepeople = new Object();
        this.onlinepeople.view = new postile.view.onlinepeople.OnlinePeople(this.header_);
        this.onlinepeople.count = 0;
        this.onlinepeople.view.render();
        this.onlinepeople.is_expended = false;
        var anony = this.isAnonymous_ = boardData['anonymous'];
        if (!this.isAnonymous_) { // display online people list only when not anonymous
            goog.events.listen(this.onlinepeople.view.container, goog.events.EventType.CLICK, function() {
                if(!instance.onlinepeople.is_expended){
                    instance.onlinepeople.is_expended = true;
                    instance.updateOnlinePeople();
                }else {
                    instance.onlinepeople.is_expended = false;
                    instance.onlinepeople.view.online_list.innerHTML = " ";
                }
            });
        }
        // and fetches users
        return postile.view.Sheety.fetchUserOfBoardData_(anony, xs[1])
            .bind(/* And render the posts */ this.renderPosts_, this);
    }, this);

    postile.view.loadCss(['sheety-gen.css']);
};
goog.inherits(postile.view.Sheety, postile.view.GoogFSV);

postile.view.Sheety.prototype.CELL_ACTUAL_SIZE =
    new goog.math.Size(200, 100);

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

    // Adjust margin-top for the header.
    goog.style.setStyle(el, {
        'top': this.headerHeight_ + 'px'
    });

    // Render comments
    goog.array.forEach(this.getModel(), function(postEx) {
        var postId = postEx['post']['id'];

        var row = new postile.view.Sheety.CommentRow(
            this.isAnonymous_,
            postId,
            postEx['comments'] /* model */);

        // Add mapping from postId to row view.
        // XXX: move this out of createDom?
        this.postIdToRow_[postId] = row;

        // Add mapping from first character of post-title to row.
        // XXX: this assumes that rows are sorted alphabetically
        // in the backend. Shall we move this out of createDom?
        var mbTitle = postEx['post']['title'];
        if (mbTitle) {
            // Since some of the old sheety-boards does not have
            // their post-title set, we need to check it.
            var ch = mbTitle.charAt(0);
            if (!this.alphabetToRow_[ch]) {
                this.alphabetToRow_[ch] = row;
            }
        }

        this.commentRows_.addChild(row, true);
    }, this);


    this.skipList_.setEnabledChars(
        goog.object.getKeys(this.alphabetToRow_));

    // Really attach children
    this.addChild(this.skipList_, true);
    this.addChild(this.postList_, true);
    this.addChild(this.commentRows_, true);

    // Hide some of the unused characters.
    // XXX: this couples with the code above and assumes
    // post never changes.

    goog.dom.classes.add(this.commentRows_.getElement(),
        'sheety-comment-rows');
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

    goog.events.listen(this.skipList_,
        postile.view.Sheety.SkipList.EventType.GOTO,
        goog.bind(this.moveViewportByAlphabet, this));

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

postile.view.Sheety.prototype.updateOnlinePeople = function() {
    this.updateOnlineCount();
    var online_list = this.onlinepeople.view.online_list;
    online_list.innerHTML="";
    for(var i = 0; i < this.onlinepeople.id.users.length; i++) {
        var item = new postile.view.onlinepeople.Item();
        item.renderItem(this.onlinepeople.view, this.onlinepeople.id.users[i]);
    }
}
postile.view.Sheety.prototype.updateOnlineCount = function() {
    var thecount = this.onlinepeople.count;
    var count_container = postile.dom.getDescendantById(this.onlinepeople.view.container
        ,'count');
    count_container.innerHTML = thecount;
}

postile.view.Sheety.prototype.exitDocument = function() {
    this.fayeSubscr_.addCallback(function(subscr) {
        subscr.cancel();
    });

    this.header_.container.remove();

    goog.base(this, 'exitDocument');
};

/**
 * Find the corresponding CommentRow by the given postId, or null
 * if not found.
 */
postile.view.Sheety.prototype.findRowByPostId = function(postId) {
    return goog.object.get(this.postIdToRow_, postId, null);
};

/**
 * Find the corresponding CommentRow whose title starts with
 * this character.
 */
postile.view.Sheety.prototype.findRowByAlphabet = function(ch) {
    return this.alphabetToRow_[ch];
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
    var postId = comment['post_id'];
    var row = this.findRowByPostId(postId);
    if (!row) {
        // No such post id
        return;
    }
    var postCell = this.postList_.findCellByPostId(postId);
    postile.view.Sheety.fetchUserOfComment_(e.target,
                                            postCell.getAuthorId(),
                                            this.isAnonymous_)
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
postile.view.Sheety.fetchUserOfBoardData_ = function(anony, response) {
    var postExs = response['message'];
    var postProms = goog.array.map(postExs, function(postEx) {
        return postile.view.Sheety.fetchUserOfPost_(postEx['post']);
    });
    var commentProms = goog.array.map(postExs, function(postEx) {
        var innerProms = goog.array.map(postEx['inline_comments'],
            function(comment) {
                return postile.view.Sheety.fetchUserOfComment_(
                    comment, postEx['post']['creator_id'], anony);
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
 *         comment' = <cmt-like> <cmt-liked> <cmt-data> <cmt-creator>?
 *                    (cmt-creator is not present for anonymous board)
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

/**
 * @param {number} postCid The creator_id of the parent post
 * of this comment
 * @param {boolean=} anony
 * @return {postile.async.Promise}
 */
postile.view.Sheety.fetchUserOfComment_ = function(commentWe,
                                                   postCid, anony) {
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
        // Either (even if when the board is anonymous)
        //   the comment is created by this user
        // Or the post is created by this user
        'cmt_canDel': cid == selfId || postCid == selfId
    };

    if (anony) {
        // Just don't fetch user.
        // XXX: hack indeed
        return postile.async.Promise.unit(skeleton);
    }
    else {
        return postile.async.Promise.fromCallback(fetcher)
               .lift(function(user) {
                   // Merge with comment
                   skeleton['cmt_creator'] = user;
                   return skeleton;
               });
    }
};

postile.view.Sheety.prototype.moveViewportByAlphabet = function(e) {
    var ch = /** @type {string} */ (e.target);
    var row = this.findRowByAlphabet(ch);
    this.moveViewportToRow(row);
}

/**
 * Ease-scroll to that row.
 */
postile.view.Sheety.prototype.moveViewportToRow = function(row) {
    var rowEl = row.getElement();
    var contEl = this.getRootEl_();
    var coordSrc = new goog.math.Coordinate(
        contEl.scrollLeft, contEl.scrollTop);
    var coordDst =
        goog.style.getContainerOffsetToScrollInto(rowEl, contEl, true);
    // XXX I actually don't quite get what's going on here
    // but it seems that this is right.
    var coordDiff = new goog.math.Coordinate(
        coordDst.x - contEl.scrollLeft,
        coordDst.y - contEl.scrollTop);

    new postile.fx.Animate(function(iter) {
        contEl.scrollLeft = (coordDiff.x - coordSrc.x) * iter +
          coordSrc.x;
        contEl.scrollTop = (coordDiff.y - coordSrc.y) * iter +
          coordSrc.y;
    }, 300, {
        ease: postile.fx.ease.sin_ease,
        callback: function() {
            contEl.scrollLeft = coordDiff.x;
            contEl.scrollTop = coordDiff.y;
        }
    });
};

/**
 * Adjust the screen to the given post, if that post is in the sheet.
 * Otherwise, display a toast to ask the user to go to that board.
 */
postile.view.Sheety.prototype.switchToPost = function(postId) {
    var row = this.findRowByPostId(postId);
    if (row) {
        // Is in board -- move the viewport to there
        this.moveViewportToRow(row);
    }
    else {
        // Nope. Display a toast instead.
        postile.ajax(['post', 'get_post'], {
            'post_id': postId
        }, function(response) {
            var postData = response['message'];
            var boardId = postData['post']['board_id'];
            if (boardId == this.boardId_) {
                // Should never happen, since sheety doesn't really
                // updates its post.
            }
            new postile.toast.Toast(10, "The comment is not in the " +
                "current board. [Click to go] to another board and " +
                "view.", [function() {
                    postile.router.dispatch('board/' +
                        String(boardId) + '#' + String(postId));
                }]);
        });
    }
};

postile.view.switchToPost.registry.push(function(postId) {
    var currView = postile.router.current_view;
    if (currView instanceof postile.view.Sheety) {
        // first check if the post is in current board
        currView.switchToPost(postId);
        return true;
    }
});

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
    this.render(this.getRootEl_());

    if (!goog.isNull(this.initPostId_)) {
        var row = this.findRowByPostId(this.initPostId_);
        if (row) {
            this.moveViewportToRow(row);
        }
    }
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

    /**
     * Maps post-id to post-cell in post-list.
     * Initialized in createDom.
     * @type {Object.<postile.view.Sheety.PostCell>}
     * @private
     */
    this.postIdToCell_ = {};
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

        // Store this id->cell mapping
        this.postIdToCell_[cell.getPostId()] = cell;
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
    var initScrollTop = this.getParent().headerHeight_;
    this.floatHandlerKey_ = goog.events.listen(
        document,
        goog.events.EventType.SCROLL,
        goog.bind(this.syncScroll, this, initScrollTop));

    // Floating on the current parent.
    // to be able to set z-index difference on post-list and sheety-body.
    this.startFloating(this.getParent().getElement());
    this.syncScroll(initScrollTop);
};

postile.view.Sheety.PostList.prototype.syncScroll =
function(initScrollTop) {
    var el = this.getElement();
    el.style.top =
        String(initScrollTop - window.scrollY) + 'px';
};

/**
 * Find the corresponding PostCell by the given postId, or null
 * if not found.
 */
postile.view.Sheety.PostList.prototype.findCellByPostId =
function(postId) {
    return goog.object.get(this.postIdToCell_, postId, null);
};

/**
 * Make self a fix-positioned element, and attach event handlers
 * to sync it with y-scrolling.
 */
postile.view.Sheety.PostList.prototype.startFloating = function(parentEl) {
    var elem = this.getElement();
    var STORED_STYLE_PROPS_ = [
        'position', 'top', 'left', 'width', 'cssFloat'];

    var PLACEHOLDER_STYLE_PROPS_ = [
        'position', 'top', 'left', 'display', 'cssFloat',
        'marginTop', 'marginLeft', 'marginRight', 'marginBottom'];

    // Read properties of element before modifying it.
    var originalLeft_ = goog.style.getPageOffsetLeft(elem);
    var originalWidth_ = goog.style.getContentBoxSize(elem).width;
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
    parentEl.appendChild(elem);

    elem.style.position = 'fixed';
    elem.style.top = '0';
};

/**
 * Displays a post and a button for editing new comments.
 * @constructor
 */
postile.view.Sheety.PostCell = function() {
    goog.base(this);

    this.whoButton_ = new goog.ui.Control(null,
        goog.ui.ControlRenderer.getCustomRenderer(
            goog.ui.ControlRenderer, 'who'));

    this.addButton_ = new goog.ui.Control('对TA说',
        goog.ui.ControlRenderer.getCustomRenderer(
            goog.ui.ControlRenderer, 'mkcomment'));
    this.commentPop_ = new postile.view.Sheety.AddCommentPop(this);
};
goog.inherits(postile.view.Sheety.PostCell, goog.ui.Component);

postile.view.Sheety.PostCell.prototype.getPostId = function() {
    return this.getModel()['post']['id'];
};

postile.view.Sheety.PostCell.prototype.getAuthorId = function() {
    return this.getModel()['post']['creator_id'];
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

    this.addChild(this.whoButton_);
    this.whoButton_.decorate(
        goog.dom.getElementByClass('who', el));

    this.addChild(this.addButton_, true);

    // XXX: add to parent? wat?
    this.getParent().addChild(this.commentPop_, true);
};

postile.view.Sheety.PostCell.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    var sheety = this.getSheety();

    // On click who: show profile
    var profileView = new postile.view.profile.ProfileView(
        this.getAuthorId());
    goog.events.listen(
        this.whoButton_,
        goog.ui.Component.EventType.ACTION,
        goog.bind(profileView.open, profileView, 710));

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
    this.textarea_ = new postile.view.Sheety.CETextarea(null,
        goog.ui.ControlRenderer.getCustomRenderer(
            goog.ui.ControlRenderer, 'textarea'));
    this.submitButton_ = new goog.ui.Button('Submit');
    this.submitButton_.addClassName('comment-button');
    this.cancelButton_ = new goog.ui.Button('Cancel');
    this.cancelButton_.addClassName('comment-button');
    this.atAddOn_ = null;
};
goog.inherits(postile.view.Sheety.AddCommentPop, goog.ui.Container);

postile.view.Sheety.AddCommentPop.prototype.getSheety = function() {
    return this.postCell_.getSheety();
};

postile.view.Sheety.AddCommentPop.prototype.createDom = function() {
    goog.base(this, 'createDom');

    this.getElement().innerHTML = postile.templates.sheety.newCommentPop();
    this.addChild(this.textarea_, true);
    this.addChild(this.submitButton_, true);
    this.addChild(this.cancelButton_, true);

    if (!this.textarea_._lc_) {
        this.textarea_._lc_ =
            new postile.length_control.LengthController(this.textarea_.getElement(), 1000);
    }
};

postile.view.Sheety.AddCommentPop.prototype.submit = function() {
    // Preprocess the value of the textarea.
    // XXX: check for emptiness.
    var content = postile.view.At.asBBCode(
        this.textarea_.getValue());
    if (content && !this.textarea_.getElement().lengthOverflow) {
        var e = new goog.events.Event(
            postile.view.Sheety.EventType.LOCAL_SUBMIT_COMMENT, {
                postId: this.postCell_.getPostId(),
                content: content
            });
        this.setEnabled(false);
        this.dispatchEvent(e);
    }
}

postile.view.Sheety.AddCommentPop.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    // Actually not really needed..
    this.setEnabled(false);

    var sheety = this.getSheety();

    // On click submit: dispatch submit event and disable self
    goog.events.listen(
        this.submitButton_,
        goog.ui.Component.EventType.ACTION,
        function(_) {
            this.submit();
        }, undefined, this);

    goog.events.listen(
        this.getElement(),
        goog.events.EventType.KEYDOWN,
        function(e) {
            if (e.keyCode == 13 && this.isEnabled()) {
                this.submit();
            }
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

    // Attach an `At` view to be able to @someone.
    this.atAddOn_ = new postile.view.At(this.textarea_.getElement());
};

postile.view.Sheety.AddCommentPop.prototype.exitDocument = function() {
    this.atAddOn_.close();

    goog.base(this, 'exitDocument');
};

postile.view.Sheety.AddCommentPop.prototype.slideToShow = function() {
    // Prepare to be shown
    this.isShown_ = true;
    this.setEnabled(true);
    this.textarea_.setValue('');
    this.textarea_.getElement().focus();

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
 * Content-editable textarea. Normally used with postile.view.At.
 * @constructor
 */
postile.view.Sheety.CETextarea = function(opt_content, opt_renderer) {
    goog.base(this, opt_content, opt_renderer);
};
goog.inherits(postile.view.Sheety.CETextarea, goog.ui.Control);

postile.view.Sheety.CETextarea.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

};

postile.view.Sheety.CETextarea.prototype.getValue = function() {
    return this.getElement()['innerHTML'];
};

postile.view.Sheety.CETextarea.prototype.enableEditing = function(enable) {
    this.setAllowTextSelection(enable);

    var el = this.getElement();
    el.contentEditable = enable;
    if (enable) {
        goog.style.setStyle(el, {
            'user-select': 'text'
        });
    }
    else {
        goog.style.setStyle(el, {
            'user-select': 'none'
        });
    }
};

postile.view.Sheety.CETextarea.prototype.setEnabled = function(enable) {
    goog.base(this, 'setEnabled', enable);
    this.enableEditing(enable);
};

postile.view.Sheety.CETextarea.prototype.setValue = function(x) {
    this.getElement()['innerHTML'] = x;
};

/**
 * A list of upper alphabets. Dispatches event with character when
 * clicked.
 * @constructor
 */
postile.view.Sheety.SkipList = function() {
    goog.base(this, undefined,
              goog.ui.ContainerRenderer.getCustomRenderer(
                  goog.ui.ContainerRenderer, 'sheety-skiplist'));

    this.enabledChars_ = [];
    this.buttons_ = {};
};
goog.inherits(postile.view.Sheety.SkipList, goog.ui.Container);

postile.view.Sheety.SkipList.prototype.createDom = function() {
    goog.base(this, 'createDom');

    goog.array.forEach(this.enabledChars_, function(ch) {
        var btn = new goog.ui.Control(ch,
              goog.ui.ControlRenderer.getCustomRenderer(
                  goog.ui.ControlRenderer, 'sheety-skiplist-button'));
        this.buttons_[ch] = btn;
        this.addChild(btn, true);
    }, this);
};

postile.view.Sheety.SkipList.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    var el = this.getElement();
    goog.style.setStyle(el, {
        'opacity': 0.5
    });

    goog.events.listen(
        this,
        [ goog.ui.Component.EventType.ENTER
        , goog.ui.Component.EventType.LEAVE
        ], function(e) {
            if (e.type == goog.ui.Component.EventType.ENTER) {
                goog.style.setStyle(el, {
                    'opacity': 1
                });
            }
            else {
                goog.style.setStyle(el, {
                    'opacity': 0.5
                });
            }
        }, undefined, this);


    goog.object.forEach(this.buttons_, function(btn, ch) {
        goog.events.listen(
            btn,
            goog.ui.Component.EventType.ACTION,
            function(_) {
                var e = new goog.events.Event(
                    postile.view.Sheety.SkipList.EventType.GOTO,
                    ch);
                this.dispatchEvent(e);
            }, undefined, this);
    }, this);
};

postile.view.Sheety.SkipList.prototype.setEnabledChars = function(chs) {
    this.enabledChars_ = chs;
};

postile.view.Sheety.SkipList.prototype.hideChar = function(ch) {
    this.buttons_[ch].setVisible(false);
};

postile.view.Sheety.SkipList.EventType = {
    GOTO: goog.events.getUniqueId('goto')
};

/**
 * A row of comment cells
 * @constructor
 */
postile.view.Sheety.CommentRow = function(anony, postId, model) {
    goog.base(this);

    /**
     * @type {boolean=}
     */
    this.isAnonymous_ = anony;

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
    var cell = new postile.view.Sheety.CommentCell(this.isAnonymous_);
    cell.setModel(commentData);
    if (opt_recordInMap) {
        this.commentIdToCell_[cell.getCommentId()] = cell;
    }
    return cell;
};

/**
 * Display a certain comment. Can do like and delete here.
 * XXX: currently like_ and del_ doesn't share the same model as self
 * does, since the model is pre-processed in createDom.
 * @constructor
 * @param {boolean=} anony
 */
postile.view.Sheety.CommentCell = function(anony) {
    goog.base(this, undefined,
              goog.ui.ContainerRenderer.getCustomRenderer(
                  goog.ui.ContainerRenderer, 'sheety-comment-cell'));

    this.isAnonymous_ = anony;
    if (!anony) {
        this.author_ = new postile.view.Sheety.CommentAuthor();
    }
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
        author: this.isAnonymous_ ? ''
                                  : model['cmt_creator']['username'],
        ctime: ctime.toUsTimeString(),
        likeCount: model['cmt_likeCount'],
        liked: model['cmt_liked'],
        canDelete: model['cmt_canDel'],
        content: postile.parseBBcode(model['cmt_data']['content']),
        isAnonymous: this.isAnonymous_
    };

    // Comment header
    el['innerHTML'] = postile.templates.sheety.comment(preProcData);

    if (!this.isAnonymous_) {
        // first addChild and then decorate. Otherwise closure will barf
        this.addChild(this.author_);
        this.author_.decorate(goog.dom.getElementByClass('author', el));
    }

    // Append like count and del button
    this.like_.setModel(preProcData);
    this.addChild(this.like_, true);

    this.del_.setModel(preProcData);
    this.addChild(this.del_, true);

    // Append content
    var contentFragment = soy.renderAsFragment(
        postile.templates.sheety.commentContent, preProcData);
    goog.dom.append(el, contentFragment);

    //console.log(preProcData.content);

    this.wrapper = goog.dom.getElement('title_bar');
    this.content_el = goog.dom.getElementByClass('content', el);
    // create a span to get the length
    var dummy_span = goog.dom.createDom('div', 'dummy_span');
    dummy_span.style.display = 'table-cell';
    dummy_span.innerHTML = preProcData.content;
    goog.dom.appendChild(this.wrapper, dummy_span);

    //console.log(dummy_span);

    // get length
    var width = dummy_span.offsetWidth;
    var height = dummy_span.offsetHeight;

    //console.log(width);

    // TODO get the height and length
    // Currently we hard code it.
    var wrapper_width = 200;
    var wrapper_height = 60;

    goog.dom.removeNode(dummy_span);

    var marginTop = 0;

    if(wrapper_width > 1.7 * width){
        // check the height:

        //console.log('entering expand');
        if(height > wrapper_height){
            marginTop = 0;
        }
        else{
            marginTop = wrapper_height / 2 - height / 2 -10; // number get by seeing the board....
        }
        this.content_el.style.textAlign = 'center';
        this.content_el.style.marginTop = marginTop + 'px';
        this.content_el.style.fontSize = '20px';
    }
    else {
        marginTop = 0;
        this.content_el.style.textAlign = '';
        this.content_el.style.marginTop = marginTop + 'px';
        this.content_el.style.fontSize = '10pt';
    }


    // dirty code ends here

    // Post-process bbcode
    postile.bbcodePostProcess(el);
};

postile.view.Sheety.CommentCell.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    var el = this.getElement();
    this.maxHeight = Math.max(this.content_el.offsetHeight + 35, 88);

    // To allow text selection
    goog.style.setUnselectable(this.getElement(), false);

    goog.events.listen(
        el,
        goog.events.EventType.MOUSEOVER,
        function() {
            el.style.height = this.maxHeight + 'px';
            el.style.zIndex = '1000';
        }, undefined, this);

    goog.events.listen(
        el,
        goog.events.EventType.MOUSEOUT,
        function() {
            el.style.height = '88px';
            el.style.zIndex = '1';
            goog.dom.classes.remove(el, 'sheety-comment-cell-hover');
        }, undefined, this);

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

postile.view.Sheety.CommentCell.prototype.getAuthorId = function() {
    return this.getModel()['cmt_creator']['id'];
};

/** @constructor */
postile.view.Sheety.CommentAuthor = function(authorId) {
    goog.base(this, null,
        goog.ui.ControlRenderer.getCustomRenderer(
            goog.ui.ControlRenderer, 'author'));
};
goog.inherits(postile.view.Sheety.CommentAuthor, goog.ui.Control);

postile.view.Sheety.CommentAuthor.prototype.enterDocument =
function() {
    goog.base(this, 'enterDocument');

    // On click name: show profile
    var authorId = this.getParent().getAuthorId();
    var profileView = new postile.view.profile.ProfileView(authorId);
    goog.events.listen(
        this,
        goog.ui.Component.EventType.ACTION,
        goog.bind(profileView.open, profileView, 710));
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

