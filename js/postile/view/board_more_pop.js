goog.provide('postile.view.board_more_pop');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.board_more_pop.BoardMorePop = function(input_instance) {
    postile.view.NormalView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_board_more_pop.html']));
    this.container.id = 'board_more';

    goog.dom.appendChild(document.body, this.container);
}

goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.NormalView);
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
