goog.provide('postile.view.post_board.Header');

goog.require('goog.events');
goog.require('postile.view.profile');
goog.require('postile.view.post_board.Account');
goog.require('goog.dom');
goog.require('postile.dom');
goog.require('postile.view.notification');

postile.view.post_board.Header = function(board) {
    // this variable is for identifying current active icon
    this.curIcon = '';

    postile.view.NormalView.call(this);

    var instance = this;

    this.board = board;

    this.container.id = 'title_bar';

    postile.ui.load(this.container, postile.conf.staticResource(['post_board_title_bar.html']));

    this.topicTitle_el = postile.dom.getDescendantById(instance.container, 'topic_title');
    instance.topicTitle_el.innerHTML = this.board.boardData.name;

    var feedback = goog.dom.createDom('img');
    feedback.src = postile.conf.imageResource(['feedback.png']);
    feedback.style.cssFloat = 'left';
    feedback.style.margin = '6px 0 0 10px';
    goog.events.listen(feedback, goog.events.EventType.CLICK, function() {
        new postile.feedback.FeedbackData();
    });
    goog.dom.appendChild(instance.container, feedback);

    this.topicImgContainer_el = postile.dom.getDescendantById(instance.container, 'topic_image_container');
    this.topicImg_el = postile.dom.getDescendantByClass(this.topicImgContainer_el, 'topic_image');
    this.topicImg_el.src = postile.conf.uploadsResource( [this.board.boardData.image_small_url] );
    
    goog.dom.appendChild(this.container, new postile.view.post_board.Account(board).container);
}

goog.inherits(postile.view.post_board.Header, postile.view.NormalView);

postile.view.post_board.Header.prototype.dismissOthers = function() {
}
