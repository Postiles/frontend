goog.provide('postile.view.board_more_pop');

goog.require('postile.view');
goog.require('postile.view.star');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.board_more_pop.BoardMorePop = function(input_instance) {

    postile.view.TipView.call(this);

    postile.ui.load(this.container, postile.staticResource(['_board_more_pop.html']));
    this.container.id = 'board_more';
    this.container.style.top = '0px';
    this.container.style.left = '0px';

    var place = postile.dom.getDescendantById(this.container, 'place');
    var star_bt = this.container.lastChild.previousSibling;

    console.log(star_bt);
    star_bt.style.background = "#fff";

    goog.events.listen(place, goog.events.EventType.CLICK, function(e) {
        console.log("star button called");
        (new postile.view.star.Star(this)).open(this.star_bt);
    });  
    goog.events.listen(star_bt, goog.events.EventType.CLICK, function(e) {
        console.log("star button called");
        (new postile.view.star.Star(this)).open(this.star_bt);
    });  

}

goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.TipView);
postile.view.board_more_pop.BoardMorePop.prototype.unloaded_stylesheets = ['board_more_pop.css'];

postile.view.board_more_pop.OtherBoard = function(in_board_instance) {
    var board_instance = in_board_instance;
    this.curId = board_instance.boardData.topic_id;

    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_board_more_pop_up.html']));

    this.boardList = postile.dom.getDescendantById(this.container, 'board_list');

    postile.ajax([ 'board', 'get_boards_in_topic' ], { topic_id: board_instance.boardData.topic_id }, function(data) {
        /* handle the data return after getting the boards information back */
        var boardArray = data.message.boards;
        for(i in boardArray) {
            this.renderBoardListItem(boardArray[i]);
        }
        console.log(data);
    }.bind(this));
    this.container.id = 'other_boards';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.board_more_pop.OtherBoard, postile.view.TipView);
postile.view.board_more_pop.OtherBoard.prototype.unloaded_stylesheets = ['board_more_pop.css'];


postile.view.board_more_pop.OtherBoard.prototype.renderBoardListItem = function(data) {
    var boardInfor = data.board;
    var nextBoardId = boardInfor.id;
    var boardName = boardInfor.name;
    var boardDiscription = boardInfor.description;

    this.listedBoard = goog.dom.createDom('div', 'listed_board');
    goog.dom.appendChild(this.boardList, this.listedBoard);

    goog.events.listen(this.listedBoard, goog.events.EventType.CLICK, function(){
        console.log("try to redirect");
        window.location="/test/" + nextBoardId + "/" + postile.dport;
    });

    this.listedTitile = goog.dom.createDom('h3', 'board_title', boardName);
    goog.dom.appendChild(this.listedBoard, this.listedTitile);

    this.listedDiscription = goog.dom.createDom('p', 'board_discription', boardDiscription);
    goog.dom.appendChild(this.listedBoard, this.listedDiscription);

    goog.dom.appendChild(this.listedBoard, goog.dom.createDom('div', 'selected_icon'));
}
