goog.provide('postile.view.Sheety');

goog.require('goog.ui.Component');
goog.require('postile.view');
goog.require('postile.templates.sheety');

/**
 * FullScreenView-compatible goog.ui.Component.
 * Specifically, it has a .close method and closes postile.current_view
 * in its constructor.
 * @constructor
 */
postile.view.GoogFSV = function() {
    if (postile.current_view && postile.current_view.close) {
        // Destruct the original fullscreenview
        postile.current_view.close();
    }
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

    postile.ajax(['board', 'get_recent_post'], {
        "board_id": this.board_id_,
        "number": 10
    }, goog.bind(this.renderModel, this));
};
goog.inherits(postile.view.Sheety, postile.view.GoogFSV);

/**
 * @inheritDoc
 */
postile.view.Sheety.prototype.close = function() {
    this.exitDocument();
}

/**
 * Create a skeleton dom.
 * @inheritDoc
 */
postile.view.Sheety.prototype.createDom = function() {
    var html = postile.templates.sheety.body();
    this.decorateInternal(goog.dom.createDom('div', {'innerHTML': html}));
};

/**
 * Load data and decorate
 * @inheritDoc
 */
postile.view.Sheety.prototype.decorateInternal = function(element) {
    this.setElementInternal(element);
};


/**
 * Called when board data is received
 */
postile.view.Sheety.prototype.renderModel = function() {
    // To attach to the document
    this.render(goog.dom.getElement('wrapper'));
};

