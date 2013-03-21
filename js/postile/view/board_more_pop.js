goog.provide('postile.view.board_more_pop');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.board_more_pop.BoardMorePop = function(input_instance) {

    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_board_more_pop.html']));
    this.container.id = 'board_more';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}
postile.view.board_more_pop.BoardMorePop.prototype.addListeners = function() {
    var star_button = goog.dom.getElement('star');
    console.log(star_button);
//    var star_button = input_instance;
    goog.events.listen(star_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.star.Star(star_button)).open(star_button);
    });
}


goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.TipView);
postile.view.board_more_pop.BoardMorePop.prototype.unloaded_stylesheets = ['board_more_pop.css'];

postile.view.board_more_pop.OtherBoard = function(input_instance) {
    var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_board_more_pop_up.html']));
    this.container.id = 'other_boards';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.board_more_pop.OtherBoard, postile.view.TipView);
postile.view.board_more_pop.OtherBoard.prototype.unloaded_stylesheets = ['board_more_pop.css'];
