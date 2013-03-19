goog.provide('postile.view.post_board.MouseMoveScroll');

goog.require('goog.events');

/*
this file provides the mechanism of dragging the canvas to scroll
*/

postile.view.post_board.MouseMoveScroll = function(board) {
    this.board = board;
    this.mousedowncoord = [];
    this.originCanvasCoord = [];
    goog.events.listen(board.viewport, goog.events.EventType.MOUSEDOWN, this.viewport_mousedown.bind(this));
    goog.events.listen(board.viewport, goog.events.EventType.MOUSEMOVE, this.viewport_mousemove.bind(this));
    goog.events.listen(board.viewport, goog.events.EventType.MOUSEUP, this.viewport_mouseup.bind(this));
}

postile.view.post_board.MouseMoveScroll.prototype.viewport_mousedown = function(e) {
    if (!e.isButton(0)) { // not left mouse button
        return; 
    }

    if(this.board.disableMovingCanvas) { 
        return; 
    }
    
    var i;

    this.board.disableMovingCanvas = true;
    this.mousedownCoord = [e.clientX, e.clientY];
    this.originCanvasCoord = [this.board.canvasCoord[0], this.board.canvasCoord[1]];

    for(i in this.board.direction_controllers) { //hide all dirction control arrows
        this.board.direction_controllers[i].style.display = 'none';
    }

    if (this.board.canva_shadow_animation) {
        this.board.canva_shadow_animation.stop(); //stop current animation
    }
};

postile.view.post_board.MouseMoveScroll.prototype.viewport_mouseup = function(e) { 
    if (!e.isButton(0)) { 
        return; 
    }

    if (!this.mousedownCoord) { 
        return; 
    } //not legally mouse-downed

    var post_board = this.board;
    
    this.board.disableMovingCanvas = false;
    if (e.clientX == this.mousedownCoord[0] && e.clientY == this.mousedownCoord[1]) { 
        post_board.mousedownCoord = null; return; 
    }

    this.mousedownCoord = null;
    //post_board.canvasCoord = [- post_board.viewport.scrollLeft, - post_board.viewport.scrollTop]; //no longer needed after supporting touchpad

    //animation of outbound shadow
    var init = post_board.shadowCoord.slice();
    var total = Math.max(Math.abs(post_board.shadowCoord[0]),Math.abs(post_board.shadowCoord[1]));

    if (post_board.shadowCoord[0] || post_board.shadowCoord[1]) {
        post_board.canva_shadow_animation = new postile.fx.Animate(function(i) {
            var now = i * total;

            if (init[0] < 0) { 
                post_board.shadowCoord[0] = now > -init[0] ? 0 : init[0] + now; 
            } else if (init[0] > 0) { 
                post_board.shadowCoord[0] = now > init[0] ? 0 : init[0] - now; 
            }

            if (init[1] < 0) { 
                post_board.shadowCoord[1] = now > -init[1] ? 0 : init[1] + now; 
            }
            else if (init[1] > 0) { 
                post_board.shadowCoord[1] = now > init[1] ? 0 : init[1] - now; 
            }

            post_board.canvasOutBoundAnimation();
        }, 800, postile.fx.ease.cubic_ease_out);
    }

    //update display status of dirction control arrows
    if (post_board.shadowCoord[1] <= 0) { 
        post_board.direction_controllers['up'].style.display = 'block'; 
    }

    if (post_board.shadowCoord[0] >= 0) {
        post_board.direction_controllers['right'].style.display = 'block';
    }

    if (post_board.shadowCoord[1] >= 0) {
        post_board.direction_controllers['down'].style.display = 'block';
    }

    if (post_board.shadowCoord[0] <= 0) {
        post_board.direction_controllers['left'].style.display = 'block';
    }

    //update subscribe area
    post_board.updateSubsribeArea();
};

postile.view.post_board.MouseMoveScroll.prototype.viewport_mousemove = function(e) {
    if (!this.mousedownCoord) { //mouse key not down yet
        return;
    }

    var leftTarget = e.clientX - this.mousedownCoord[0] + this.originCanvasCoord[0];
    var topTarget = e.clientY - this.mousedownCoord[1] + this.originCanvasCoord[1];
    var rightTarget = leftTarget - this.board.viewport.offsetWidth + this.board.canvas.offsetWidth;
    var bottomTarget = topTarget - this.board.viewport.offsetHeight + this.board.canvas.offsetHeight;

    this.board.shadowCoord[0] = 0;
    this.board.shadowCoord[1] = 0;

    if (leftTarget > 0) { //test left boundout(attempt to drag out of the boundary)
        this.board.shadowCoord[0] = leftTarget;
        leftTarget = 0;
    } else if (rightTarget < 0) { //test right boundout
        this.board.shadowCoord[0] = rightTarget;
        leftTarget -= rightTarget;
    }
    if (topTarget > 0) { //test top boundout
        this.board.shadowCoord[1] = topTarget;
        topTarget = 0;
    } else if (bottomTarget < 0) { //test bottom boundout
        this.board.shadowCoord[1] = bottomTarget;
        topTarget -= bottomTarget;
    }

    this.board.viewport.scrollLeft = - leftTarget;
    this.board.viewport.scrollTop = - topTarget; //apply the shadow boundout effect

    this.board.canvasOutBoundAnimation();
};
