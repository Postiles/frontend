/**

Some notice for the current demo:

The minimum unit of the grid is set to 75*50px, plus a margin of 14px and padding of 8px

TODO: implement realclick event which will not be triggered if dragging is activated

**/

goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

postile.view.post_board.PostBoard = function() { //constructor
    this.mousedownCoord = null; //record the mouse position when mousedown triggered
	this.canvasCoord = null; //current canvas position relative to the canvas viewport
	this.shadowCoord = [0, 0]; //current shadow (the boundary-out(boundout) effect)
	this.canvasAnimationCounter = null;
    this.currentArray = null; //an array containing all posts shown //TODO: is this really needed? anyway it is required at this moment
    this.newPostStartCoord = null; //hold the starting point of a new post in an array with the unit of "grid unit"
    this.canvas_viewport = goog.dom.DomHelper.createDom('div', {'class': 'canvas_viewport', 'unselectable': 'on', 'user-select', 'none'}); //disable text selecting
    goog.events.listen(this.canvas_viewport, goog.events.EventType.SELECTSTART, function(){ return false; }); //disable text selecting
    goog.dom.DomHelper.appendChild(this.canvas_viewport, goog.dom.DomHelper.getElement('wrapper'));
	this.canvas = goog.dom.DomHelper.createDom('div', {'class': 'canvas'});
    goog.dom.DomHelper.appendChild(this.canvas, this.canvas_viewport);
    this.mask = goog.dom.DomHelper.createDom('div', {'class': 'canvas_mask'});
	$('<div/>').appendTo(this.mask).addClass('mask_notice').html('Click & Drag to add a post<br />Right click again to quit');
	canvas_viewport.data('mask', this.mask);
	this.mask.data('preview', $('<div/>').appendTo(this.mask).addClass('post_preview'));
	this.mask.data('preview_origin_spot', $('<div/>').appendTo(this.mask).addClass('post_preview_origin_spot'));
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

postile.view.post_board.PostBoard.prototype.unloadedStylesheets = ['post_board/post_board.css'];

postile.view.post_board.PostBoard.prototype.resize = function(){
    this.canvas_viewport.width(window.innerWidth);
	this.canvas_viewport.height(window.innerHeight);
	this.canvasCoord = [(canvas.parent().innerWidth() - canvas.outerWidth())/2, (canvas.parent().innerHeight() - canvas.outerHeight())/2]; //To be replaced
	this.canvas.css({'left': this.canvasCoord[0] + 'px', 'top': this.canvasCoord[1] + 'px'});   
}

postile.view.post_board.PostBoard.prototype.canvasOutBoundAnimation = function(){ //index 0 for x and 1 for y
    canvas.css({'box-shadow': canvas_mouse_event.shadowCoord[0]/10+'px '+canvas_mouse_event.shadowCoord[1]/10+'px '+Math.sqrt(Math.pow(canvas_mouse_event.shadowCoord[0], 2)+Math.pow(canvas_mouse_event.shadowCoord[1], 2))/10+'px 0 rgba(255, 255, 255, 0.75) inset'});
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
    canvas_mouse_event.currentArray = array;
    for (i in array) {
        array[i].x_pos_end = array[i].x_pos + array[i].width; //precalculate this two so that future intersect test will be faster
        array[i].y_pos_end = array[i].y_pos + array[i].height;
        array[i].divEl = goog.dom.DomHelper.createDom('div', {'class':'post'});
        goog.dom.DomHelper.appendChild(array[i].divEl, this.canvas);
        array[i].divEl.associateData = array[i];
        array[i].divEl.style.left = post_board.lengthConvert.xPosTo(array[i].x_pos) + 'px';
        array[i].divEl.style.top = post_board.lengthConvert.yPosTo(array[i].y_pos) + 'px';
        array[i].divEl.style.width = post_board.lengthConvert.widthTo(array[i].width) + 'px';
        array[i].divEl.style.height = post_board.lengthConvert.heightTo(array[i].height) + 'px';
        goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(event){event.stopPropagation();}); //prevent doubleclick from triggering "creating new post"
        array[i].divEl.innerHTML = array[i].content;
        array[i].divEl.delay(80*i).show(200);
    }
};

//HUGE TODO: fix this

$(window).resize(function() { window.location.reload(); }); //prevent from resizing //later on, we still need to fix for chrome Issue 55793

postile.view.post_board.handlers.canvas_mousedown(function(e) {
    canvas_mouse_event.mousedownCoord = [e.pageX, e.pageY];
    if (canvas_mouse_event.canvasAnimationCounter) {
        canvas_mouse_event.canvasAnimationCounter.stop(); //stop current animation
    }
});

postile.view.post_board.handlers.canvas_mouseup(function(e) { 
    canvas_mouse_event.mousedownCoord = null;
    canvas_mouse_event.canvasCoord = [parseFloat(canvas.css('left')),parseFloat(canvas.css('top'))];
    if (canvas_mouse_event.shadowCoord[0] || canvas_mouse_event.shadowCoord[1]) {
        canvas_mouse_event.canvasAnimationCounter = $({'counter': 0, 'init': $.extend(true, [], canvas_mouse_event.shadowCoord)});
        canvas_mouse_event.canvasAnimationCounter.animate({'counter': Math.max(Math.abs(canvas_mouse_event.shadowCoord[0]),Math.abs(canvas_mouse_event.shadowCoord[1]))}, {'step': function(now){ //remove the white boundout effect little by little with jqery.animate
            if (this.init[0] < 0) { canvas_mouse_event.shadowCoord[0] = now > -this.init[0] ? 0 : this.init[0] + now; }
            else if (this.init[0] > 0) { canvas_mouse_event.shadowCoord[0] = now > this.init[0] ? 0 : this.init[0] - now; }
            if (this.init[1] < 0) { canvas_mouse_event.shadowCoord[1] = now > -this.init[1] ? 0 : this.init[1] + now; }
            else if (this.init[1] > 0) { canvas_mouse_event.shadowCoord[1] = now > this.init[1] ? 0 : this.init[1] - now; }
            canvas_mouse_event.canvasOutBoundAnimation();
        }});
    }
});

postile.view.post_board.handlers.canvas_mousemove(function(e) {
    if (!canvas_mouse_event.mousedownCoord) { return; } //mouse key not down yet
    var leftTarget = e.pageX - canvas_mouse_event.mousedownCoord[0] + canvas_mouse_event.canvasCoord[0];
    var topTarget = e.pageY - canvas_mouse_event.mousedownCoord[1] + canvas_mouse_event.canvasCoord[1];
    var rightTarget = leftTarget - canvas.parent().innerWidth() + canvas.outerWidth();
    var bottomTarget = topTarget - canvas.parent().innerHeight() + canvas.outerHeight();
    canvas_mouse_event.shadowCoord[0] = 0;
    canvas_mouse_event.shadowCoord[1] = 0;
    if (leftTarget > 0) { //test left boundout(attempt to drag out of the boundary)
        canvas_mouse_event.shadowCoord[0] = leftTarget;
        leftTarget = 0;
    } else if (rightTarget < 0) { //test right boundout
        canvas_mouse_event.shadowCoord[0] = rightTarget;
        leftTarget -= rightTarget;
    }
    if (topTarget > 0) { //test top boundout
        canvas_mouse_event.shadowCoord[1] = topTarget;
        topTarget = 0;
    } else if (bottomTarget < 0) { //test bottom boundout
        canvas_mouse_event.shadowCoord[1] = bottomTarget;
        topTarget -= bottomTarget;
    }
    canvas.css({'left': leftTarget + 'px', 'top': topTarget + 'px'}); //apply the shadow boundout effect
    canvas_mouse_event.canvasOutBoundAnimation();
});

//mouseevents for the mask
postile.view.post_board.handlers.mask_mousedown(function(e){ //find the closest grid point
    canvas_mouse_event.newPostStartCoord = [Math.round(post_board.lengthConvert.xPosFrom(e.pageX - canvas_mouse_event.canvasCoord[0])), Math.round(post_board.lengthConvert.yPosFrom(e.pageY - canvas_mouse_event.canvasCoord[1]))]; //record current coordinate in the unit of "grid unit" //TODO: detect if the start point is legal (if there is available space around it)
    mask.data('preview_origin_spot').css({'left': post_board.lengthConvert.xPosTo(canvas_mouse_event.newPostStartCoord[0])+canvas_mouse_event.canvasCoord[0]-17+'px', 'top':  post_board.lengthConvert.yPosTo(canvas_mouse_event.newPostStartCoord[1])+canvas_mouse_event.canvasCoord[1]-17+'px'}).show();
});

postile.view.post_board.handlers.mask_mousemove(function(e){ //mouse key not down yet
    if (!canvas_mouse_event.newPostStartCoord) { return; }
    var current = [post_board.lengthConvert.xPosFrom(e.pageX - canvas_mouse_event.canvasCoord[0]), post_board.lengthConvert.yPosFrom(e.pageY - canvas_mouse_event.canvasCoord[1])];
    var delta = [0, 0];
    var end = [0, 0];
    var i;
    for (i = 0; i < 2; i++) {
        delta[i] = current[i] - canvas_mouse_event.newPostStartCoord[i]; //calculate the expected width/height in the unit of "grid unit"
        if (delta[i] < 0) { //if in doubt, use brute force
            if (delta[i] > -1) { delta[i] = -1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = canvas_mouse_event.newPostStartCoord[i] + delta[i];
            end[i] = canvas_mouse_event.newPostStartCoord[i];
        } else {
            if (delta[i] < 1) { delta[i] = 1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = canvas_mouse_event.newPostStartCoord[i];
            end[i] = canvas_mouse_event.newPostStartCoord[i] + delta[i];
        }
    }
    //now "current" saves the smaller value and "end" saves the larger one
    //check if available
    var intersect = false;
    for (i in canvas_mouse_event.currentArray) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= canvas_mouse_event.currentArray[i].x_pos_end || end[0] <= canvas_mouse_event.currentArray[i].x_pos || current[1] >=canvas_mouse_event.currentArray[i].y_pos_end || end[1] <= canvas_mouse_event.currentArray[i].y_pos)) { 
            intersect = true;
            break;
        }
    }
    //draw on the canvas
    var preview = mask.data('preview');
    preview.css({
        'left': post_board.lengthConvert.xPosTo(current[0]) + canvas_mouse_event.canvasCoord[0] + 'px',
        'top': post_board.lengthConvert.yPosTo(current[1]) + canvas_mouse_event.canvasCoord[1] + 'px',
        'width': post_board.lengthConvert.widthTo(Math.abs(delta[0])) + 'px',
        'height': post_board.lengthConvert.heightTo(Math.abs(delta[1])) + 'px',
        'background-color': intersect ? '#F00' : '#0F0'
    });
    preview.show();
    mask.data('legal', !intersect);
});

postile.view.post_board.handlers.mask_mouseup(function(e){
    canvas_mouse_event.newPostStartCoord = null;
    if (!mask.data('legal')) {
        mask.data('preview').hide(); return;
    }
    mask.data('legal', false);
});

//activated double click event for creating new boxes
postile.view.post_board.handlers.canvas_dblclick(function(){
    canvas_viewport.data('mask').show();
});

/****
Sections below are just for testing
****/

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
}

$(window).load(function(){  
	setTimeout(function(){post_board.renderArray(post_board_demo.posts);},600)
});
