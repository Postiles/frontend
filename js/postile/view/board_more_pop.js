goog.provide('postile.view.board_more_pop');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.board_more_pop.BoardMorePop = function() {
    postile.view.NormalView.call(this);
    postile.ui.load(this.container, postile.staticResource(['board_more_pop.html']));
    this.container.id = 'board_more';
    var button = this.container.children[1];
    console.log(button);
    goog.events.listen(button, goog.events.EventType.CLICK, function(){
        (new postile.view.board_more_pop.OtherBoard()).open(button);
    });
    goog.dom.appendChild(document.body, this.container);
}

goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.NormalView);

postile.view.board_more_pop.BoardMorePop.prototype.unloaded_stylesheets = ['board_more_pop.css'];

postile.view.board_more_pop.OtherBoard = function() {
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['board_more_pop_up.html']));
    this.container.id = 'other_boards';
}

goog.inherits(postile.view.board_more_pop.OtherBoard, postile.view.TipView);