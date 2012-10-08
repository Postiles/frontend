goog.provide('postile.test');

goog.require('postile.view.post_board');

var post_board_demo = { //this is demo JSON demonstrating some data fetched from the server
	posts: [
		{ id: 128, x_pos: -1, y_pos: -3, width: 2, height: 2, content: '<b style="font-size: 20px">You can drag the canvas till you reach the boundary</b>' }, //each one stand for a post
		{ id: 111, x_pos: -1, y_pos: -1, width: 2, height: 1, content: '<font color="#990000">All code is in this HTML</font>' },
		{ id: 198, x_pos: -2, y_pos: -2, width: 1, height: 2, content: "dummy content for block 3" },
		{ id: 256, x_pos: 1, y_pos: -4, width: 2, height: 2, content: "dummy content for block 4" },
		{ id: 280, x_pos: 0, y_pos: 0, width: 1, height: 3, content: "dummy content for block 5" },
		{ id: 310, x_pos: -2, y_pos: 2, width: 2, height: 2, content: "dummy content for block 6" },
		{ id: 317, x_pos: 1, y_pos: 0, width: 3, height: 3, content: '<b style="font-size: 24px; color: #C00">You can try to double click on blank places</b>' },
		{ id: 319, x_pos: -5, y_pos: -3, width: 3, height: 2, content: "dummy content for block 8" }
	]
};

postile.test.init = function(){

    var pb = new postile.view.post_board.PostBoard();
    
    /*
    pb.renderArray(post_board_demo.posts);
    */

}