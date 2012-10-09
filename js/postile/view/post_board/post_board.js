/**

Some notice for the current demo:

The minimum unit of the grid is set to 75*50px, plus a margin of 14px and padding of 8px

TODO: implement realclick event which will not be triggered if dragging is activated

**/

goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

goog.require('postile.view');
goog.require('postile.fx');
goog.require('postile.fx.effects');
goog.require('goog.dom');
goog.require('goog.math.Size');
goog.require('goog.events');

postile.view.post_board.PostBoard = function() { //constructor
    postile.view.View.call(this);
    this.mousedownCoord = null; //record the mouse position when mousedown triggered
    this.canvasCoord = null; //current canvas position relative to the canvas viewport
    this.shadowCoord = [0, 0]; //current shadow (the boundary-out(boundout) effect)
    this.canva_shadow_animation = null;
    this.currentArray = null; //an array containing all posts shown //TODO: is this really needed? anyway it is required at this moment
    this.newPostStartCoord = null; //hold the starting point of a new post in an array with the unit of "grid unit"
    this.canvas_viewport = goog.dom.createDom('div', {'class': 'canvas_viewport', 'unselectable': 'on', 'user-select': 'none'}); //disable text selecting
    goog.events.listen(this.canvas_viewport, goog.events.EventType.SELECTSTART, function(){ return false; }); //disable text selecting
    goog.dom.appendChild(goog.dom.getElement('wrapper'), this.canvas_viewport);
    this.canvas = goog.dom.createDom('div', {'class': 'canvas'});
    goog.dom.appendChild(this.canvas_viewport, this.canvas);
    this.mask = goog.dom.createDom('div', {'class': 'canvas_mask'});
    goog.dom.appendChild(this.canvas_viewport, this.mask);
    this.mask_notice = goog.dom.createDom('div', {'class': 'mask_notice'});
    goog.dom.appendChild(this.mask, this.mask_notice);
    this.mask_notice.innerHTML = 'Click & Drag to add a post<br />Right click again to quit';
    this.canvas_viewport.rel_data = this;
    this.canvas.rel_data = this;
    this.mask.rel_data = this;
    this.mask.preview = goog.dom.createDom('div', {'class': 'post_preview'});
    goog.dom.appendChild(this.mask, this.mask.preview);
    this.mask.post_preview_origin_spot = goog.dom.createDom('div', {'class': 'post_preview_origin_spot'});
    goog.dom.appendChild(this.mask, this.mask.post_preview_origin_spot);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.canvas_mousedown);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.canvas_mousemove);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.canvas_mouseup);
    goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK, postile.view.post_board.handlers.canvas_dblclick);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.mask_mousedown);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.mask_mousemove);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.mask_mouseup);
    goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(){ this.style.display = 'none'; });
    this.resize();
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.View);

postile.view.post_board.PostBoard.prototype.unloadedStylesheets = ['post_board.css'];

postile.view.post_board.PostBoard.prototype.resize = function(){
    this.canvas_viewport.style.width = window.innerWidth + 'px';
    this.canvas_viewport.style.height = window.innerHeight + 'px';
    this.canvasCoord = [(this.canvas_viewport.offsetWidth - this.canvas.offsetWidth)/2, (this.canvas_viewport.offsetHeight - this.canvas.offsetHeight)/2]; //To be replaced
    this.canvas.style.left = this.canvasCoord[0] + 'px'; this.canvas.style.top = this.canvasCoord[1] + 'px';   
}

postile.view.post_board.PostBoard.prototype.canvasOutBoundAnimation = function(){ //index 0 for x and 1 for y
    this.canvas.style.boxShadow = this.shadowCoord[0]/10+'px '+this.shadowCoord[1]/10+'px '+Math.sqrt(Math.pow(this.shadowCoord[0], 2)+Math.pow(this.shadowCoord[1], 2))/10+'px 0 rgba(255, 255, 255, 0.75) inset';
};

//convent length from "unit length" of the grid to pixel.
postile.view.post_board.PostBoard.prototype.widthTo = function(u) { return (u*(75+30) - 30); };
postile.view.post_board.PostBoard.prototype.heightTo = function(u) { return (u*(50+30) - 30); };
postile.view.post_board.PostBoard.prototype.xPosTo = function(u) { return (u*(75+30) + this.canvas.offsetWidth/2); };
postile.view.post_board.PostBoard.prototype.yPosTo = function(u) { return (u*(50+30) + this.canvas.offsetHeight/2); };
//convent length to "unit length" of the grid from pixel. it is from the center grid points so margins and paddings are ignored.
postile.view.post_board.PostBoard.prototype.xPosFrom = function(px) { return ((px + 7 - this.canvas.offsetWidth/2)/(75+30)); };
postile.view.post_board.PostBoard.prototype.yPosFrom = function(px) { return ((px + 7 - this.canvas.offsetHeight/2)/(50+30)); };

postile.view.post_board.PostBoard.prototype.renderArray = function(array) { //add post objects to the screen //NOTICE: just add, no not care the duplicate
    var i;
    this.currentArray = array;
    for (i in array) {
        array[i].x_pos_end = array[i].x_pos + array[i].width; //precalculate this two so that future intersect test will be faster
        array[i].y_pos_end = array[i].y_pos + array[i].height;
        array[i].divEl = goog.dom.createDom('div', {'class':'post'});
        goog.dom.appendChild(this.canvas, array[i].divEl);
        array[i].divEl.rel_data = array[i];
        array[i].divEl.style.left = this.xPosTo(array[i].x_pos) + 'px';
        array[i].divEl.style.top = this.yPosTo(array[i].y_pos) + 'px';
        array[i].divEl.style.width = this.widthTo(array[i].width) + 'px';
        array[i].divEl.style.height = this.heightTo(array[i].height) + 'px';
        goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(event){event.stopPropagation();}); //prevent doubleclick from triggering "creating new post"
        array[i].divEl.innerHTML = array[i].content;
        postile.fx.effects.resizeIn(array[i].divEl);
    }
};

postile.view.post_board.handlers.canvas_mousedown = function(e) {
    this.rel_data.mousedownCoord = [e.offsetX, e.offsetY];
    if (this.rel_data.canva_shadow_animation) {
        this.rel_data.canva_shadow_animation.stop(); //stop current animation
    }
};

postile.view.post_board.handlers.canvas_mouseup = function(e) { 
    var post_board = this.rel_data;
    post_board.mousedownCoord = null;
    post_board.canvasCoord = [parseFloat(this.style.left),parseFloat(this.style.top)];
    var init = post_board.shadowCoord.slice();
    var total = Math.max(Math.abs(this.rel_data.shadowCoord[0]),Math.abs(this.rel_data.shadowCoord[1]));
    if (post_board.shadowCoord[0] || post_board.shadowCoord[1]) {
        post_board.canva_shadow_animation = new postile.fx.Animate(function(i){
            var now = i * total;
            if (init[0] < 0) { post_board.shadowCoord[0] = now > -init[0] ? 0 : init[0] + now; }
            else if (init[0] > 0) { post_board.shadowCoord[0] = now > init[0] ? 0 : init[0] - now; }
            if (init[1] < 0) { post_board.shadowCoord[1] = now > -init[1] ? 0 : init[1] + now; }
            else if (init[1] > 0) { post_board.shadowCoord[1] = now > init[1] ? 0 : init[1] - now; }
            post_board.canvasOutBoundAnimation();
        }, 800, postile.fx.ease.cubic_ease_out);
    }
};

postile.view.post_board.handlers.canvas_mousemove = function(e) {
    if (!this.rel_data.mousedownCoord) { return; } //mouse key not down yet
    var leftTarget = e.offsetX - this.rel_data.mousedownCoord[0] + this.rel_data.canvasCoord[0];
    var topTarget = e.offsetY - this.rel_data.mousedownCoord[1] + this.rel_data.canvasCoord[1];
    var rightTarget = leftTarget - this.parentNode.offsetWidth + this.offsetWidth;
    var bottomTarget = topTarget - this.parentNode.offsetHeight + this.offsetHeight;
    this.rel_data.shadowCoord[0] = 0;
    this.rel_data.shadowCoord[1] = 0;
    if (leftTarget > 0) { //test left boundout(attempt to drag out of the boundary)
        this.rel_data.shadowCoord[0] = leftTarget;
        leftTarget = 0;
    } else if (rightTarget < 0) { //test right boundout
        this.rel_data.shadowCoord[0] = rightTarget;
        leftTarget -= rightTarget;
    }
    if (topTarget > 0) { //test top boundout
        this.rel_data.shadowCoord[1] = topTarget;
        topTarget = 0;
    } else if (bottomTarget < 0) { //test bottom boundout
        this.rel_data.shadowCoord[1] = bottomTarget;
        topTarget -= bottomTarget;
    }
    console.log(leftTarget);
    this.style.left = leftTarget + 'px';
    this.style.top = topTarget + 'px'; //apply the shadow boundout effect
    this.rel_data.canvasOutBoundAnimation();
};

//mouseevents for the mask
postile.view.post_board.handlers.mask_mousedown = function(e){ //find the closest grid point
    this.rel_data.newPostStartCoord = [Math.round(this.rel_data.xPosFrom(e.offsetX - this.rel_data.canvasCoord[0])), Math.round(this.rel_data.yPosFrom(e.offsetY - this.rel_data.canvasCoord[1]))]; //record current coordinate in the unit of "grid unit" //TODO: detect if the start point is legal (if there is available space around it)
    this.post_preview_origin_spot.style.left = this.rel_data.xPosTo(this.rel_data.newPostStartCoord[0])+this.rel_data.canvasCoord[0]-17+'px';
    this.post_preview_origin_spot.style.top = this.rel_data.yPosTo(this.rel_data.newPostStartCoord[1])+this.rel_data.canvasCoord[1]-17+'px';
    this.post_preview_origin_spot.style.display = 'block';
};

postile.view.post_board.handlers.mask_mousemove = function(e){ //mouse key not down yet
    if (!this.rel_data.newPostStartCoord) { return; }
    var current = [this.rel_data.xPosFrom(e.offsetX - this.rel_data.canvasCoord[0]), this.rel_data.yPosFrom(e.offsetY - this.rel_data.canvasCoord[1])];
    var delta = [0, 0];
    var end = [0, 0];
    var i;
    for (i = 0; i < 2; i++) {
        delta[i] = current[i] - this.rel_data.newPostStartCoord[i]; //calculate the expected width/height in the unit of "grid unit"
        if (delta[i] < 0) { //if in doubt, use brute force
            if (delta[i] > -1) { delta[i] = -1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.rel_data.newPostStartCoord[i] + delta[i];
            end[i] = this.rel_data.newPostStartCoord[i];
        } else {
            if (delta[i] < 1) { delta[i] = 1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.rel_data.newPostStartCoord[i];
            end[i] = this.rel_data.newPostStartCoord[i] + delta[i];
        }
    }
    //now "current" saves the smaller value and "end" saves the larger one
    //check if available
    var intersect = false;
    for (i in this.rel_data.currentArray) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= this.rel_data.currentArray[i].x_pos_end || end[0] <= this.rel_data.currentArray[i].x_pos || current[1] >=this.rel_data.currentArray[i].y_pos_end || end[1] <= this.rel_data.currentArray[i].y_pos)) { 
            intersect = true;
            break;
        }
    }
    //draw on the canvas
    this.preview.style.left = this.rel_data.xPosTo(current[0]) + this.rel_data.canvasCoord[0] + 'px';
    this.preview.style.top = this.rel_data.yPosTo(current[1]) + this.rel_data.canvasCoord[1] + 'px';
    this.preview.style.width = this.rel_data.widthTo(Math.abs(delta[0])) + 'px';
    this.preview.style.height = this.rel_data.heightTo(Math.abs(delta[1])) + 'px';
    this.preview.style.backgroundColor = intersect ? '#F00' : '#0F0';
    this.preview.style.display = 'block';
    this.legal = !intersect;
};

postile.view.post_board.handlers.mask_mouseup = function(e){
    this.rel_data.newPostStartCoord = null;
    if (!this.legal) {
        this.preview.style.display = 'none'; return;
    }
    this.legal = false;
};

//activated double click event for creating new boxes
postile.view.post_board.handlers.canvas_dblclick = function(){
    this.rel_data.mask.style.display = 'block';
};

/****
Sections below are just for testing
****/