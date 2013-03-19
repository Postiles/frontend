goog.provide('postile.view.post_board.mask');

goog.require('goog.events');
goog.require('goog.dom');

postile.view.post_board.PostCreator = function(post_board_obj) {
    var instance = this;
    this.board = post_board_obj;
    this.ghost_board_el = goog.dom.createDom('div', 'canvas_mask');
    instance.ghost_board_el.style.display = 'none';
    this.preview = goog.dom.createDom('div', 'post_preview');
    goog.dom.appendChild(this.ghost_board_el, this.preview);
    this.post_preview_origin_spot = goog.dom.createDom('div', 'post_preview_origin_spot');
    goog.dom.appendChild(this.ghost_board_el, this.post_preview_origin_spot);
    goog.dom.appendChild(this.board.canvas, this.ghost_board_el);
    goog.events.listen(this.ghost_board_el, goog.events.EventType.MOUSEDOWN, function(e) { e.stopPropagation(); instance.mousedown(e); });
    goog.events.listen(this.ghost_board_el, goog.events.EventType.MOUSEMOVE, function(e) { e.stopPropagation(); instance.mousemove(e); });
    goog.events.listen(this.ghost_board_el, goog.events.EventType.MOUSEUP, function(e) { e.stopPropagation(); instance.mouseup(e); });
    goog.events.listen(this.ghost_board_el, goog.events.EventType.DBLCLICK, function(e){ e.stopPropagation(); instance.close(); });
}

postile.view.post_board.PostCreator.prototype.open = function(dcb, post) {
    if(this.board.disableMovingCanvas) { 
        return; 
    }
    this.board.disableMovingCanvas = true;
    this.ghost_board_el.style.display = 'block';
    this.ghost_board_el.id ='fuckll';
}

postile.view.post_board.PostCreator.prototype.close = function(dcb, post) {
    this.board.disableMovingCanvas = false;
    this.ghost_board_el.style.display = 'none';
}

//mouseevents for the mask
postile.view.post_board.PostCreator.prototype.mousedown = function(e) { //find the closest grid point
    this.start_mouse_coord = [this.board.xPosFrom(e.clientX - this.board.viewport_position.x - this.board.canvasCoord[0]), this.board.yPosFrom(e.clientY - this.board.viewport_position.y - this.board.canvasCoord[1])];
    this.new_post_start_coord_in_px = [e.clientX, e.clientY]; //used to disable warning when double clicking

    this.post_preview_origin_spot.style.left = this.board.xPosTo(this.start_mouse_coord[0])-17+'px';
    this.post_preview_origin_spot.style.top = this.board.yPosTo(this.start_mouse_coord[1])-17+'px';
    
    this.post_preview_origin_spot.style.display = 'block';
};

postile.view.post_board.PostCreator.prototype.mousemove = function(e) { 
    if (!this.start_mouse_coord) { 
        return; 
    } //mouse key not down yet

    var current = [this.board.xPosFrom(e.clientX - this.board.viewport_position.x - this.board.canvasCoord[0]), this.board.yPosFrom(e.clientY - this.board.viewport_position.y - this.board.canvasCoord[1])];

    var delta = [0, 0];
    var end = [0, 0];
    var i;

    for (i = 0; i < 2; i++) {
        delta[i] = current[i] - this.start_mouse_coord[i]; //calculate the expected width/height in the unit of "grid unit"
        if (delta[i] < 0) { //if in doubt, use brute force
            if (delta[i] > -1) { delta[i] = -1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.start_mouse_coord[i] + delta[i];
            end[i] = this.start_mouse_coord[i];
        } else {
            if (delta[i] < 1) { delta[i] = 1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.start_mouse_coord[i];
            end[i] = this.start_mouse_coord[i] + delta[i];
        }
    }

    //now "current" saves the smaller value and "end" saves the larger one
    //check if available
    var intersect = false;
    for (i in this.board.currentPosts) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= this.board.currentPosts[i].post.coord_x_end 
                    || end[0] <= this.board.currentPosts[i].post.coord_x 
                    || current[1] >=this.board.currentPosts[i].post.coord_y_end 
                    || end[1] <= this.board.currentPosts[i].post.coord_y)) { 
            intersect = true;
            break;
        }
    }

    //draw on the canvas
    this.position = { 
        coord_x: current[0], 
        coord_y: current[1], 
        span_x: Math.abs(delta[0]), 
        span_y: Math.abs(delta[1]) 
    };

    this.preview.style.left = this.board.xPosTo(this.position.coord_x) + 'px';
    this.preview.style.top = this.board.yPosTo(this.position.coord_y) + 'px';

    this.preview.style.width = this.board.widthTo(this.position.span_x) + 'px';
    this.preview.style.height = this.board.heightTo(this.position.span_y) + 'px';

    this.legal = (!intersect) && this.position.span_x > 1 && this.position.span_y > 1;

    this.preview.style.backgroundColor = this.legal ? '#e4eee4': '#f4dcdc';
    this.preview.style.display = 'block';
};

postile.view.post_board.PostCreator.prototype.mouseup = function(e){
    this.board.disableMovingCanvas = false;
    this.start_mouse_coord = null;
    this.post_preview_origin_spot.style.display = 'none';
    this.preview.style.display = 'none';
    if (!this.legal) {
        if (this.new_post_start_coord_in_px 
                && Math.abs(this.new_post_start_coord_in_px[0] - e.clientX) > 3 
                && Math.abs(this.new_post_start_coord_in_px[1] - e.clientY) > 3) { //do not show when dbl clicking
            new postile.toast.Toast(5, postile._('post_zone_illegal'), [], 'red');
        }
        this.new_post_start_coord_in_px = null;
        return;
    }
    this.legal = false;
    this.new_post_start_coord_in_px = null;
    this.board.createPost(this.position);
};

/****************************************************************
*****************************************************************
********************重***构***纪***念***碑***********************
*****************************************************************
*****************************************************************
*****************************************************************
*****************************************************************
*****************************************************************
*****************************************************************
*****************************************************************
*****************************************************************
***************************特此纪念******************************
*********************八百行的post_board.js***********************
*****************************************************************
*****************************************************************
****************************************************************/