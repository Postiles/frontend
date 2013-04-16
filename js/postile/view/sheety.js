goog.provide('postile.view.Sheety');

goog.require('goog.debug.Logger');
goog.require('goog.asserts');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.ui.Component');
goog.require('goog.ui.Container');
goog.require('goog.ui.Control');

goog.require('postile.view');
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
postile.view.Sheety = function(opt_board_id) {
    goog.base(this);

    /**
     * @type {number}
     * @private
     */
    this.board_id_ = goog.isDef(opt_board_id) ? opt_board_id : 1;

    /**
     * Contains a list of posts. Its model is a {Array.<PostWE>}
     * @private
     */
    this.postList_ = new goog.ui.Container(
        goog.ui.Container.Orientation.VERTICAL,
        postile.view.SheetyPostListRenderer.getInstance());
    // To avoid unexpected scrolling.
    this.postList_.setFocusable(false);

    // Fetchs board data, then fetchs user data, finally renders the view.
    var fetchPosts = goog.partial(
        postile.ajax,
        ['board', 'get_recent_posts'],
        { 'board_id': this.board_id_, 'number': 40 });
    postile.async.Deferred.fromCallback(fetchPosts)
    .bind(this.fetchUserOfPosts_, this)
    .bind(this.renderPosts_, this);

    postile.view.loadCss(['sheety.css']);
};
goog.inherits(postile.view.Sheety, postile.view.GoogFSV);

/**
 * Create a skeleton dom.
 * @inheritDoc
 */
postile.view.Sheety.prototype.createDom = function() {
    var html = postile.templates.sheety.body({board_id: this.board_id_});
    var dom = goog.dom.createDom('div', {
        'innerHTML': html,
        'className': 'sheety-body'
    });
    this.decorateInternal(dom);
};

/**
 * Load data and decorate
 * @inheritDoc
 */
postile.view.Sheety.prototype.decorateInternal = function(element) {
    goog.base(this, 'decorateInternal', element);

    var root = goog.dom.getElementByClass('sheety-scroll', element);
    this.postList_.render(root);
};

/**
 * Called when board data is received.
 * @private
 */
postile.view.Sheety.prototype.fetchUserOfPosts_ = function(response) {
    var postExs = response['message'];
    var dfds = goog.array.map(postExs, function(postEx) {
        var cid = postEx['post']['creator_id'];
        var fetcher = goog.partial(postile.data_manager.getUserData, cid);
        return postile.async.Deferred.fromCallback(fetcher);
    });
    return postile.async.Deferred.waitForAll(dfds)
           .lift(function(users) {
               // Link user with post
               var postExCopy = new Array(postExs.length);
               var cpy = goog.array.clone(postExs);
               goog.array.forEach(postExs, function(postEx, i) {
                   postExCopy[i] = {
                       'post': postEx['post'],
                       'user': users[i],
                       'inline_comments': postEx['inline_comments']
                   };
               });
               return postExCopy;
           });
};

/**
 * Called when board data is received.
 * @private
 */
postile.view.Sheety.prototype.renderPosts_ = function(postExs) {
    this.postList_.setModel(postExs);
    this.render(goog.dom.getElement('wrapper'));
};

/**
 * @constructor
 */
postile.view.SheetyPostListRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.SheetyPostListRenderer,
              goog.ui.ContainerRenderer);
goog.addSingletonGetter(postile.view.SheetyPostListRenderer);

/** @inheritDoc */
postile.view.SheetyPostListRenderer.prototype.getCssClass = function() {
    return 'sheety-postlist';
};

/** @inheritDoc */
postile.view.SheetyPostListRenderer.prototype.createDom =
function(postList) {
    var el = goog.base(this, 'createDom', postList);
    // So as to be able to call addChild()
    postList.setElementInternal(el);

    goog.array.forEach(postList.getModel(),
    function(postEx) {
        // postData is a {PostWE} while userData is a {User}
        var item = new goog.ui.Control(
            null /* content */,
            postile.view.SheetyPostItemRenderer.getInstance());
        item.setModel(postEx);
        postList.addChild(item, true /* opt_render */);

    });
    return el;
};

/**
 * Since we are rendering using templates, there is no need to decorate.
 * @inheritDoc
 */
postile.view.SheetyPostListRenderer.prototype.canDecorate =
    goog.functions.FALSE;

/**
 * @constructor
 */
postile.view.SheetyPostItemRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.SheetyPostItemRenderer,
              goog.ui.ControlRenderer);
goog.addSingletonGetter(postile.view.SheetyPostItemRenderer);

postile.view.SheetyPostItemRenderer.prototype.getCssClass =
function() {
    return 'sheety-postitem';
};

/** @inheritDoc */
postile.view.SheetyPostItemRenderer.prototype.createDom =
function(item) {
    var el = goog.base(this, 'createDom', item);
    item.setElementInternal(el);

    var postEx = item.getModel();
    var renderData = {
        title: postEx['post']['title'] || '(no title)',
        author: postEx['user']['username'],
        content: postEx['post']['content']
    };
    var fragment = soy.renderAsFragment(postile.templates.sheety.postItem,
                                        renderData);
    goog.dom.append(el, fragment);

    var commentList = new goog.ui.Container(
        goog.ui.Container.Orientation.HORIZONTAL,
        postile.view.SheetyCommentListRenderer.getInstance());
    commentList.setModel(postEx['inline_comments']);

    /**
     * A list of comments.
     * @protected
     */
    item.commentList_ = commentList;
    item.addChild(commentList, true /* opt_render */);

    return el;
};

/**
 * Since we are rendering using templates, there is no need to decorate.
 * @inheritDoc
 */
postile.view.SheetyPostItemRenderer.prototype.canDecorate =
    goog.functions.FALSE;

/**
 * Renders a list of comments
 * @constructor
 */
postile.view.SheetyCommentListRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.SheetyCommentListRenderer,
              goog.ui.ContainerRenderer);
goog.addSingletonGetter(postile.view.SheetyCommentListRenderer);

postile.view.SheetyCommentListRenderer.prototype.getCssClass =
function() {
    return 'sheety-commentlist';
};

/** @inheritDoc */
postile.view.SheetyCommentListRenderer.prototype.createDom =
function(commentList) {
    var el = goog.base(this, 'createDom', commentList);
    // So as to be able to call addChild()
    commentList.setElementInternal(el);

    goog.array.forEach(commentList.getModel(), function(commentData) {
        /** Contains a comment. Its model is a {Comment} */
        var item = new goog.ui.Control(
            null /* content */,
            postile.view.SheetyCommentItemRenderer.getInstance());
        item.setModel(commentData);
        commentList.addChild(item, true /* opt_render */);
    });
    return el;
};

/**
 * Since we are rendering using templates, there is no need to decorate.
 * @inheritDoc
 */
postile.view.SheetyCommentListRenderer.prototype.canDecorate =
    goog.functions.FALSE;

/**
 * @constructor
 */
postile.view.SheetyCommentItemRenderer = function() {
    goog.base(this);
};
goog.inherits(postile.view.SheetyCommentItemRenderer,
              goog.ui.ControlRenderer);
goog.addSingletonGetter(postile.view.SheetyCommentItemRenderer);

postile.view.SheetyCommentItemRenderer.prototype.getCssClass =
function() {
    return 'sheety-commentitem';
};

/** @inheritDoc */
postile.view.SheetyCommentItemRenderer.prototype.createDom =
function(item) {
    var el = goog.base(this, 'createDom', item);
    item.setElementInternal(el);

    var commentData = item.getModel()['inline_comment'];
    var renderData = {
        cdatetime: commentData['created_at'],
        content: commentData['content']
    };
    var fragment = soy.renderAsFragment(
        postile.templates.sheety.commentItem, renderData);
    goog.dom.append(el, fragment);

    return el;
};

/**
 * Since we are rendering using templates, there is no need to decorate.
 * @inheritDoc
 */
postile.view.SheetyCommentItemRenderer.prototype.canDecorate =
    goog.functions.FALSE;

