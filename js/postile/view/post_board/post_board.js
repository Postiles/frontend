/**

Some notice for the current demo:

The minimum unit of the grid is set to 75*50px, plus a margin of 14px and padding of 8px

TODO: implement realclick event which will not be triggered if dragging is activated

**/

goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

goog.require('postile.view');
goog.require('postile.fx.effects');
goog.require('goog.dom');

postile.view.post_board.PostBoard = function() { //constructor
    postile.view.View.call();
    this.mousedownCoord = null; //record the mouse position when mousedown triggered
	this.canvasCoord = null; //current canvas position relative to the canvas viewport
	this.shadowCoord = [0, 0]; //current shadow (the boundary-out(boundout) effect)
	this.canvasAnimationCounter = null;
    this.currentArray = null; //an array containing all posts shown //TODO: is this really needed? anyway it is required at this moment
    this.newPostStartCoord = null; //hold the starting point of a new post in an array with the unit of "grid unit"
    this.canvas_viewport = goog.dom.createDom('div', {'class': 'canvas_viewport', 'unselectable': 'on', 'user-select': 'none'}); //disable text selecting
    goog.events.listen(this.canvas_viewport, goog.events.EventType.SELECTSTART, function(){ return false; }); //disable text selecting
    goog.dom.appendChild(this.canvas_viewport, goog.dom.getElement('wrapper'));
	this.canvas = goog.dom.createDom('div', {'class': 'canvas'});
    goog.dom.appendChild(this.canvas, this.canvas_viewport);
    this.mask = goog.dom.createDom('div', {'class': 'canvas_mask'});
    this.mask_notice = goog.dom.createDom('div', {'class': 'mask_notice'});
    goog.dom.appendChild(this.mask_notice, this.mask);
    this.mask_notice.innerHTML = 'Click & Drag to add a post<br />Right click again to quit';
    this.canvas_viewport.associateData = this;
    this.canvas.associateData = this;
    this.mask.associateData = this;
    this.mask.preview = goog.dom.createDom('div', {'class': 'post_preview'});
    goog.dom.createDom.appendChild(this.mask.preview, this.mask);
    this.mask.post_preview_origin_spot = goog.dom.createDom('div', {'class': 'post_preview_origin_spot'});
    goog.dom.createDom.appendChild(this.mask.post_preview_origin_spot, this.mask);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.canvas_mousedown);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.canvas_mousemove);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.canvas_mouseup);
    goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK, postile.view.post_board.handlers.canvas_dblclick);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.mask_mousedown);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.mask_mousemove);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.mask_mouseup);
    goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(){ this.mask.hide(); });
    this.resize();
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.View);

postile.view.post_board.PostBoard.prototype.unloadedStylesheets = ['post_board.css'];

postile.view.post_board.PostBoard.prototype.resize = function(){
    this.canvas_viewport.width(window.innerWidth);
	this.canvas_viewport.height(window.innerHeight);
	this.canvasCoord = [(canvas.parent().innerWidth() - canvas.outerWidth())/2, (canvas.parent().innerHeight() - canvas.outerHeight())/2]; //To be replaced
	this.canvas.css({'left': this.canvasCoord[0] + 'px', 'top': this.canvasCoord[1] + 'px'});   
}

postile.view.post_board.PostBoard.prototype.canvasOutBoundAnimation = function(){ //index 0 for x and 1 for y
    canvas.css({'box-shadow': this.shadowCoord[0]/10+'px '+this.shadowCoord[1]/10+'px '+Math.sqrt(Math.pow(this.shadowCoord[0], 2)+Math.pow(this.shadowCoord[1], 2))/10+'px 0 rgba(255, 255, 255, 0.75) inset'});
};

postile.view.post_board.PostBoard.prototype.lengthConvert = {
    //convent length from "unit length" of the grid to pixel.
    widthTo: function(u) { return (u*(75+30) - 30); },
    heightTo: function(u) { return (u*(50+30) - 30); },
    xPosTo: function(u) { return (u*(75+30) + canvas.innerWidth()/2); },
    yPosTo: function(u) { return (u*(50+30) + canvas.innerHeight()/2); },
    //convent length to "unit length" of the grid from pixel. it is from the center grid points so margins and paddings are ignored.
    xPosFrom: function(px) { return ((px + 7 - canvas.innerWidth()/2)/(75+30)); },
    yPosFrom: function(px) { return ((px + 7 - canvas.innerHeight()/2)/(50+30)); }
};

postile.view.post_board.PostBoard.prototype.renderArray = function(array) { //add post objects to the screen //NOTICE: just add, no not care the duplicate
    var i;
    this.associateData.currentArray = array;
    for (i in array) {
        array[i].x_pos_end = array[i].x_pos + array[i].width; //precalculate this two so that future intersect test will be faster
        array[i].y_pos_end = array[i].y_pos + array[i].height;
        array[i].divEl = goog.dom.createDom('div', {'class':'post'});
        goog.dom.appendChild(array[i].divEl, this.canvas);
        array[i].divEl.associateData = array[i];
        array[i].divEl.style.left = post_board.lengthConvert.xPosTo(array[i].x_pos) + 'px';
        array[i].divEl.style.top = post_board.lengthConvert.yPosTo(array[i].y_pos) + 'px';
        array[i].divEl.style.width = post_board.lengthConvert.widthTo(array[i].width) + 'px';
        array[i].divEl.style.height = post_board.lengthConvert.heightTo(array[i].height) + 'px';
        goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(event){event.stopPropagation();}); //prevent doubleclick from triggering "creating new post"
        array[i].divEl.innerHTML = array[i].content;
        postile.fx.effects.resizeIn(array[i]);
    }
};

//HUGE TODO: fix this

$(window).resize(function() { window.location.reload(); }); //prevent from resizing //later on, we still need to fix for chrome Issue 55793

postile.view.post_board.handlers.canvas_mousedown = function(e) {
    this.associateData.mousedownCoord = [e.pageX, e.pageY];
    if (this.associateData.canvasAnimationCounter) {
        this.associateData.canvasAnimationCounter.stop(); //stop current animation
    }
};

postile.view.post_board.handlers.canvas_mouseup = function(e) { 
    this.associateData.mousedownCoord = null;
   this.associateData.canvasCoord = [parseFloat(canvas.css('left')),parseFloat(canvas.css('top'))];
    if (this.associateData.shadowCoord[0] || this.associateData.shadowCoord[1]) {
        this.associateData.canvasAnimationCounter = $({'counter': 0, 'init': $.extend(true, [], this.associateData.shadowCoord)});
        this.associateData.canvasAnimationCounter.animate({'counter': Math.max(Math.abs(this.associateData.shadowCoord[0]),Math.abs(this.associateData.shadowCoord[1]))}, {'step': function(now){ //remove the white boundout effect little by little with jqery.animate
            if (this.init[0] < 0) { this.associateData.shadowCoord[0] = now > -this.init[0] ? 0 : this.init[0] + now; }
            else if (this.init[0] > 0) { this.associateData.shadowCoord[0] = now > this.init[0] ? 0 : this.init[0] - now; }
            if (this.init[1] < 0) { this.associateData.shadowCoord[1] = now > -this.init[1] ? 0 : this.init[1] + now; }
            else if (this.init[1] > 0) { this.associateData.shadowCoord[1] = now > this.init[1] ? 0 : this.init[1] - now; }
            this.associateData.canvasOutBoundAnimation();
        }});
    }
};

postile.view.post_board.handlers.canvas_mousemove = function(e) {
    if (!this.associateData.mousedownCoord) { return; } //mouse key not down yet
    var leftTarget = e.pageX - this.associateData.mousedownCoord[0] + this.associateData.canvasCoord[0];
    var topTarget = e.pageY - this.associateData.mousedownCoord[1] + this.associateData.canvasCoord[1];
    var rightTarget = leftTarget - canvas.parent().innerWidth() + canvas.outerWidth();
    var bottomTarget = topTarget - canvas.parent().innerHeight() + canvas.outerHeight();
    this.associateData.shadowCoord[0] = 0;
    this.associateData.shadowCoord[1] = 0;
    if (leftTarget > 0) { //test left boundout(attempt to drag out of the boundary)
        this.associateData.shadowCoord[0] = leftTarget;
        leftTarget = 0;
    } else if (rightTarget < 0) { //test right boundout
        this.associateData.shadowCoord[0] = rightTarget;
        leftTarget -= rightTarget;
    }
    if (topTarget > 0) { //test top boundout
        this.associateData.shadowCoord[1] = topTarget;
        topTarget = 0;
    } else if (bottomTarget < 0) { //test bottom boundout
        this.associateData.shadowCoord[1] = bottomTarget;
        topTarget -= bottomTarget;
    }
    canvas.css({'left': leftTarget + 'px', 'top': topTarget + 'px'}); //apply the shadow boundout effect
    this.associateData.canvasOutBoundAnimation();
};

//mouseevents for the mask
postile.view.post_board.handlers.mask_mousedown = function(e){ //find the closest grid point
    this.associateData.newPostStartCoord = [Math.round(post_board.lengthConvert.xPosFrom(e.pageX - this.associateData.canvasCoord[0])), Math.round(post_board.lengthConvert.yPosFrom(e.pageY - this.associateData.canvasCoord[1]))]; //record current coordinate in the unit of "grid unit" //TODO: detect if the start point is legal (if there is available space around it)
    mask.data('preview_origin_spot').css({'left': post_board.lengthConvert.xPosTo(this.associateData.newPostStartCoord[0])+this.associateData.canvasCoord[0]-17+'px', 'top':  post_board.lengthConvert.yPosTo(this.associateData.newPostStartCoord[1])+this.associateData.canvasCoord[1]-17+'px'}).show();
};

postile.view.post_board.handlers.mask_mousemove = function(e){ //mouse key not down yet
    if (!this.associateData.newPostStartCoord) { return; }
    var current = [post_board.lengthConvert.xPosFrom(e.pageX - this.associateData.canvasCoord[0]), post_board.lengthConvert.yPosFrom(e.pageY - this.associateData.canvasCoord[1])];
    var delta = [0, 0];
    var end = [0, 0];
    var i;
    for (i = 0; i < 2; i++) {
        delta[i] = current[i] - this.associateData.newPostStartCoord[i]; //calculate the expected width/height in the unit of "grid unit"
        if (delta[i] < 0) { //if in doubt, use brute force
            if (delta[i] > -1) { delta[i] = -1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.associateData.newPostStartCoord[i] + delta[i];
            end[i] = this.associateData.newPostStartCoord[i];
        } else {
            if (delta[i] < 1) { delta[i] = 1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.associateData.newPostStartCoord[i];
            end[i] = this.associateData.newPostStartCoord[i] + delta[i];
        }
    }
    //now "current" saves the smaller value and "end" saves the larger one
    //check if available
    var intersect = false;
    for (i in this.associateData.currentArray) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= this.associateData.currentArray[i].x_pos_end || end[0] <= this.associateData.currentArray[i].x_pos || current[1] >=this.associateData.currentArray[i].y_pos_end || end[1] <= this.associateData.currentArray[i].y_pos)) { 
            intersect = true;
            break;
        }
    }
    //draw on the canvas
    var preview = mask.data('preview');
    preview.css({
        'left': post_board.lengthConvert.xPosTo(current[0]) + this.associateData.canvasCoord[0] + 'px',
        'top': post_board.lengthConvert.yPosTo(current[1]) + this.associateData.canvasCoord[1] + 'px',
        'width': post_board.lengthConvert.widthTo(Math.abs(delta[0])) + 'px',
        'height': post_board.lengthConvert.heightTo(Math.abs(delta[1])) + 'px',
        'background-color': intersect ? '#F00' : '#0F0'
    });
    preview.show();
    mask.data('legal', !intersect);
};

postile.view.post_board.handlers.mask_mouseup = function(e){
    this.associateData.newPostStartCoord = null;
    if (!mask.data('legal')) {
        mask.data('preview').hide(); return;
    }
    mask.data('legal', false);
};

//activated double click event for creating new boxes
postile.view.post_board.handlers.canvas_dblclick = function(){
    canvas_viewport.data('mask').show();
};

/****
Sections below are just for testing
****/