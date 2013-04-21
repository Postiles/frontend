goog.provide('postile.view.post_board.Header');

goog.require('goog.events');
goog.require('postile.view.profile');
goog.require('postile.view.post_board.Account');
goog.require('goog.dom');
goog.require('postile.dom');
goog.require('postile.view.create_helper');
goog.require('postile.view.notification');
goog.require('postile.view.change_password');
goog.require('postile.view.inline_login');

postile.view.post_board.Header = function(boardData) {
    // this variable is for identifying current active icon
    this.curIcon = '';

    postile.view.NormalView.call(this);

    var instance = this;

    this.boardData = boardData;

    this.container.id = 'title_bar';

    postile.ui.load(this.container, postile.conf.staticResource(['post_board_title_bar.html']));

    this.topicInnerContainer_el = postile.dom.getDescendantById(instance.container, 'topic_inner_container');

    this.topicTitle_el = postile.dom.getDescendantById(this.topicInnerContainer_el, 'topic_title');
    instance.topicTitle_el.innerHTML = this.boardData.name;
    var feedback = goog.dom.createDom('img');
    feedback.src = postile.conf.imageResource(['feedback.png']);
    feedback.style.cssFloat = 'left';
    feedback.style.margin = '6px 0 0 10px';
    goog.events.listen(feedback, goog.events.EventType.CLICK, function() {
        new postile.feedback.FeedbackData();
    });
    goog.dom.appendChild(this.topicInnerContainer_el, feedback);

    // create a create post helper

    this.topicImgContainer_el = postile.dom.getDescendantById(instance.container, 'topic_image_container');
    this.topicImg_el = postile.dom.getDescendantByClass(this.topicImgContainer_el, 'topic_image');
    this.topicImg_el.src = postile.conf.uploadsResource( [this.boardData.image_small_url] );
    
    /**
     * @private
     */
    this.account_ = new postile.view.post_board.Account(this.boardData);
    goog.dom.appendChild(this.topicInnerContainer_el, this.account_.container);
};
goog.inherits(postile.view.post_board.Header, postile.view.NormalView);

/**
 * @overrideDoc
 */
postile.view.post_board.Header.prototype.close = function() {
    this.account_.close();
    goog.base(this, 'close');
};

postile.view.post_board.Header.prototype.dismissOthers = function() {
}
