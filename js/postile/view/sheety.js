goog.provide('postile.view.Sheety');

goog.require('goog.array');
goog.require('goog.object');
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
    this.postList_ = new postile.view.SheetyPostList();

    this.commentSection_ = new postile.view.SheetyCommentSection();

    // Fetchs board data, then fetchs user data, finally renders the view.
    var fetchPosts = goog.partial(
        postile.ajax,
        ['board', 'get_recent_posts'],
        { 'board_id': this.board_id_, 'number': 40 });
    postile.async.Promise.fromCallback(fetchPosts)
    .bind(this.fetchUserOfPosts_, this)
    .bind(this.fetchUserOfComments_, this)
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

    this.postList_.render(
        goog.dom.getElementByClass('sheety-posts', element));
    this.commentSection_.render(
        goog.dom.getElementByClass('sheety-comments', element));
};

/**
 * Called when board data is received.
 * @private
 */
postile.view.Sheety.prototype.fetchUserOfPosts_ = function(response) {
    var postExs = response['message'];
    var proms = goog.array.map(postExs, function(postEx) {
        var cid = postEx['post']['creator_id'];
        var fetcher = goog.partial(postile.data_manager.getUserData, cid);
        return postile.async.Promise.fromCallback(fetcher)
               .lift(function(user) {
                   return {
                       'post': postEx['post'],
                       'user': user,
                       'inline_comments': postEx['inline_comments']
                   };
               });
    });
    return postile.async.Promise.waitForAll(proms);
};

/**
 * Called when board data is received.
 * @private
 */
postile.view.Sheety.prototype.fetchUserOfComments_ = function(postExs) {
    var proms = goog.array.map(postExs, function(postEx) {
        var proms = goog.array.map(postEx['inline_comments'],
        function(wComment) {
            var comment = wComment['inline_comment'];
            var cid = comment['creator_id'];
            var fetcher = goog.partial(
                postile.data_manager.getUserData, cid);
            return postile.async.Promise.fromCallback(fetcher)
                   .lift(function(user) {
                       return {
                           'inline_comment': comment,
                           'user': user
                       }
                   });
        });
        var all = postile.async.Promise.waitForAll(proms);
        return all.lift(function(comments) {
                   var postExCopy = goog.object.clone(postEx);
                   postExCopy['inline_comments'] = comments;
                   return postExCopy;
               });
    });
    return postile.async.Promise.waitForAll(proms);
};

/**
 * Called when board data is received.
 * @private
 */
postile.view.Sheety.prototype.renderPosts_ = function(postExs) {
    this.postList_.setModel(postExs);
    this.commentSection_.setModel(postExs);
    this.render(goog.dom.getElement('wrapper'));
};

/** @constructor */
postile.view.SheetyPostList = function() {
    goog.base(this);
};
goog.inherits(postile.view.SheetyPostList, goog.ui.Component);

postile.view.SheetyPostList.prototype.createDom = function() {
    var el = goog.base(this, 'createDom');
    goog.dom.classes.add(el, 'sheety-postlist');
    this.setElementInternal(el);

    this.decorateInternal(el);
    return el;
};

postile.view.SheetyPostList.prototype.decorateInternal = function(el) {
    goog.array.forEach(this.getModel(), function(postEx) {
        var post = new postile.view.SheetyPost();
        post.setModel(postEx);
        this.addChild(post, true /* opt_render */);
    });
};

postile.view.SheetyPost = function() {
};

