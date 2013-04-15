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

postile.view.GoogFSV.prototype.close = goog.nullFunction;

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
     * Contains a list of posts
     * @private
     */
    this.postList_ = new goog.ui.Container(goog.ui.Container.VERTICAL,
        postile.view.SheetyPostListRenderer.getInstance());

    postile.ajax(['board', 'get_recent_posts'], {
        "board_id": this.board_id_,
        "number": 10
    }, goog.bind(this.renderPosts, this));

    postile.view.loadCss(['sheety.css']);
};
goog.inherits(postile.view.Sheety, postile.view.GoogFSV);

/**
 * @inheritDoc
 */
postile.view.Sheety.prototype.close = function() {
    this.element_.remove();
    this.exitDocument();
}

/**
 * Create a skeleton dom.
 * @inheritDoc
 */
postile.view.Sheety.prototype.createDom = function() {
    var html = postile.templates.sheety.body({board_id: this.board_id_});
    var dom = goog.dom.createDom('div', {'innerHTML': html});
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
 * Called when board data is received
 */
postile.view.Sheety.prototype.renderPosts = function(data) {
    // To attach to the document
    this.postList_.setModel(data['message']);
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
    return 'sheety-post-list';
};

/** @inheritDoc */
postile.view.SheetyPostListRenderer.prototype.createDom =
function(postList) {
    var el = goog.base(this, 'createDom', postList);
    // So as to be able to call addChild()
    postList.setElementInternal(el);

    goog.array.forEach(postList.getModel(), function(postData) {
        var item = new goog.ui.Control(
            null /* content */,
            postile.view.SheetyPostListItemRenderer.getInstance());
        item.setModel(postData);
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
postile.view.SheetyPostListItemRenderer = function() {
};
goog.inherits(postile.view.SheetyPostListItemRenderer,
              goog.ui.ControlRenderer);
goog.addSingletonGetter(postile.view.SheetyPostListItemRenderer);

postile.view.SheetyPostListItemRenderer.prototype.getCssClass =
function() {
    return 'sheety-post-listitem';
};

/** @inheritDoc */
postile.view.SheetyPostListItemRenderer.prototype.createDom =
function(item) {
    var el = goog.base(this, 'createDom', item);
    item.setElementInternal(el);

    var postData = item.getModel()['post'];
    var renderData = {
        title: postData['title'],
        content: postData['content']
    };
    var fragment = soy.renderAsFragment(postile.templates.sheety.postItem,
                                        renderData);
    goog.dom.append(el, fragment);
    return el;
};

/**
 * Since we are rendering using templates, there is no need to decorate.
 * @inheritDoc
 */
postile.view.SheetyPostListItemRenderer.prototype.canDecorate =
    goog.functions.FALSE;

