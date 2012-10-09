goog.provide('postile.fx');

postile.fx.period = 36; //in the unit of millisec

postile.fx.Animate = function(iter_func, duration, ease, callback) {
	if (!ease) { ease = postile.fx.ease.linear; }
	if (!callback) { callback = function(){} }
	var iter_status = 0;
	var iter_step = postile.fx.period/duration;
	var interval = setInterval(function() {
		iter_status += iter_step;
		if (iter_status > 1) { iter_status = 1; clearInterval(interval); callback(); return; } 
		iter_func(ease(iter_status));
	}, postile.fx.period);
};

postile.fx.Animate.prototype.stop = function() {
    clearInterval(this.interval);
}

/*
USEAGE: for elements to change smoothly after hover/mouseout. this is registeration function only
DESCRIPTION: after registration, use element.f() or element.b() to trigger
EXAMPLE: postile.fx.hover_animate(input, function(i) { input.innerHTML = i; } ,1000); input.onmouseover = postile.fx.forward; input.onmouseout = postile.fx.backward;
*/
postile.fx.hover_animate = function(dom, iter_func, duration) { //in the iter_func, user can use "this" for the dom
	dom._postile.fx_status = 0;
	dom._postile.fx_step = postile.fx.period/duration;
	dom._postile.fx_iter_func = iter_func;
};

postile.fx.forward = function(dom) { /*"this" expected to be dom, otherwise you need to specify it in "dom"*/
	if (!(dom instanceof HTMLElement)) { dom = this; }
	clearInterval(dom._postile_fx_interval);
	dom._postile_fx_interval = setInterval(function() {
		dom._postile.fx_status += dom._postile.fx_step;
		if (dom._postile.fx_status > 1) { dom._postile.fx_status = 1; clearInterval(dom._postile_fx_interval); return; } 
		dom._postile.fx_iter_func(dom._postile.fx_status);
	}, postile.fx.period);
};

postile.fx.backward = function(dom) { /*"this" expected to be dom, otherwise you need to specify it in "dom"*/
	if (!(dom instanceof HTMLElement)) { dom = this; }
	clearInterval(dom._postile_fx_interval);
	dom._postile_fx_interval = setInterval(function() {
		dom._postile.fx_status -= dom._postile.fx_step;
		if (dom._postile.fx_status < 0) { dom._postile.fx_status = 0; clearInterval(dom._postile_fx_interval); return; } 
		dom._postile.fx_iter_func(dom._postile.fx_status);
	}, postile.fx.period);
};

/*
ease libraries. should be a [0,1] to [0,1] function
*/
postile.fx.ease = {
	linear: function(i) { return i; },
	cubic_ease_in: function(i) { return Math.pow(i,3); },
	cubic_ease_out: function(i) { return 1-Math.pow(1-i,3); },
	sin_ease_in: function(i) { return 1-Math.sin((1-i)*Math.PI/2); },
	sin_ease_out: function(i) { return Math.sin(i*Math.PI/2); },
	sin_ease: function(i) { return Math.sin((i-0.5)*Math.PI)/2+0.5; }
};