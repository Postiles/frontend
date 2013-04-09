goog.provide('postile.view.board_more_pop');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.view.star');
goog.require('postile.fx.effects');

postile.view.board_more_pop.BoardMorePop = function(input_instance) {

    postile.view.TipView.call(this);

    postile.ui.load(this.container, postile.conf.staticResource(['_board_more_pop.html']));
    this.container.id = 'board_more';
    this.container.style.top = '0px';
    this.container.style.left = '0px';

    var star_bt = postile.dom.getDescendantById(this.container, 'star');
    var more_photo_button = postile.dom.getDescendantById(this.container, 'more_photo_button');
    var more_video_button = postile.dom.getDescendantById(this.container, 'more_video_button');

    this.imageUploadPop = new postile.view.image_upload.ImageUploadBlock(this);
    goog.events.listen(more_photo_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation(); 
        this.imageUploadPop.open(this);
        postile.uploader.upload_path = 'post_image';
    }.bind(this));  


    this.VideoUploadPop = new postile.view.video_upload.VideoUpload(this);
    goog.events.listen(more_video_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation(); 
        this.VideoUploadPop.open(this);
    }.bind(this));  

    goog.events.listen(star_bt, goog.events.EventType.CLICK, function(e) {
        (new postile.view.star.Star(this)).open(star_bt);
    });  

}

goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.TipView);
postile.view.board_more_pop.BoardMorePop.prototype.unloaded_stylesheets = ['board_more_pop.css'];

postile.view.board_more_pop.OtherBoard = function(in_board_instance) {
    var board_instance = in_board_instance;
    this.curId = board_instance.boardData.topic_id;

    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_board_more_pop_up.html']));

    this.boardList = postile.dom.getDescendantById(this.container, 'board_list');

    postile.ajax([ 'board', 'get_boards_in_topic' ], { topic_id: board_instance.boardData.topic_id }, function(data) {
        /* handle the data return after getting the boards information back */
        var boardArray = data.message.boards;
        for(i in boardArray) {
            this.renderBoardListItem(boardArray[i]);
        }
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
        window.location="/test/" + nextBoardId + "/" + postile.conf.dport;
    });

    this.listedTitle = goog.dom.createDom('h3', 'board_title', boardName);
    goog.dom.appendChild(this.listedBoard, this.listedTitle);

    this.listedDiscription = goog.dom.createDom('p', 'board_discription', boardDiscription);
    goog.dom.appendChild(this.listedBoard, this.listedDiscription);

    goog.dom.appendChild(this.listedBoard, goog.dom.createDom('div', 'selected_icon'));
}
