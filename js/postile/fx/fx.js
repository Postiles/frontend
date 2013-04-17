goog.provide('postile.fx');

goog.require('goog.asserts');

/**
 * Tick frequency, in the unit of ms. That is, 27.8 FPS.
 * @const
 */
postile.fx.period = 36;

/**
 * A collection of ease functions.
 * @const
 * @see {postile.fx.Animate}
 */
postile.fx.ease = {
    linear: function(i) { return i; },
    cubic_ease_in: function(i) { return Math.pow(i,3); },
    cubic_ease_out: function(i) { return 1-Math.pow(1-i,3); },
    sin_ease_in: function(i) { return 1-Math.sin((1-i)*Math.PI/2); },
    sin_ease_out: function(i) { return Math.sin(i*Math.PI/2); },
    sin_ease: function(i) { return Math.sin((i-0.5)*Math.PI)/2+0.5; }
};

/**
 * Used by Animate.Option.
 * @enum {number}
 */
postile.fx.Mode = {
    ONCE: 0,
    FOREVER_REPEAT: 1 // 将来再implement一个往返的。现在用不着就先不写。
};

/**
 * @constructor
 * @param {function(number)} iter_func Callback to be called at every `tick'.
 * Its argument, a fraction number in [0, 1], represents the
 * current animation progress.
 * @param {number} duration_or_period The animation duration, in ms.
 * @param {postile.fx.Animate.Option=} opt_option
 */
postile.fx.Animate = function(iter_func, duration_or_period, opt_option) {
    var option = goog.object.clone(postile.fx.Animate.defaultOption);
    if (goog.isDef(opt_option)) {
        goog.object.extend(option, opt_option);
    }

    var iter_status = 0;
    var iter_step = postile.fx.period / duration_or_period;

    var real_iter_func = goog.bind(function() {
        iter_status += iter_step;
        if (iter_status > 1) { iter_status = 1; }
        iter_func(option.ease(iter_status));
        if (iter_status >= 1) {
            if (option.mode == postile.fx.Mode.ONCE) {
                this.stop();
            } else if (option.mode == postile.fx.Mode.FOREVER_REPEAT) {
                iter_status = 0;
            }
            else {
                goog.asserts.assert(false, 'Not a valid fx.Mode');
            }
            option.callback();
        }
    }, this);

    /**
     * Timer id for clearInterval to use.
     * @type {number}
     * @private
     */
    this.timerId_ = setInterval(real_iter_func, postile.fx.period);
    real_iter_func(); // Starts the first iteration.
};

/**
 * Option passed to new fx.Animate()
 * {ease} should be a [0, 1] -> [0, 1] function, defaults to f(x) = x.
 * {mode} defaults to fx.Mode.ONCE.
 * {callback} is a function that will be called after finishing the animation.
 * @typedef {{ease: function(number)=: number,
 *            callback: function()=,
 *            mode: postile.fx.Mode=}}
 */
postile.fx.Animate.Option;

/**
 * @type {postile.fx.Animate.Option}
 * @const
 */
postile.fx.Animate.defaultOption = {
    ease: postile.fx.ease.linear,
    callback: goog.nullFunction,
    mode: postile.fx.Mode.ONCE
};

/**
 * Stops the underlying timer.
 */
postile.fx.Animate.prototype.stop = function() {
    clearInterval(this.timerId_);
}

/**
 * USAGE: for elements to change smoothly after hover/mouseout. this is registeration function only
 * DESCRIPTION: after registration, use element.f() or element.b() to trigger
 * EXAMPLE: postile.fx.hover_animate(input, function(i) { input.innerHTML = i; } ,1000);
 *          input.onmouseover = postile.fx.forward;
 *          input.onmouseout = postile.fx.backward;
 * @deprecated Since it's not used ATM.

postile.fx.hover_animate = function(dom, iter_func, duration) { //in the iter_func, user can use "this" for the dom
    dom._postile.fx_status = 0;
    dom._postile.fx_step = postile.fx.period/duration;
    dom._postile.fx_iter_func = iter_func;
};

// "this" expected to be dom, otherwise you need to specify it in "dom"
postile.fx.forward = function(dom) {
    if (!(dom instanceof HTMLElement)) { dom = this; }
    clearInterval(dom._postile_fx_interval);
    dom._postile_fx_interval = setInterval(function() {
        dom._postile.fx_status += dom._postile.fx_step;
        if (dom._postile.fx_status > 1) { dom._postile.fx_status = 1; clearInterval(dom._postile_fx_interval); return; }
        dom._postile.fx_iter_func(dom._postile.fx_status);
    }, postile.fx.period);
};

// "this" expected to be dom, otherwise you need to specify it in "dom"
postile.fx.backward = function(dom) {
    if (!(dom instanceof HTMLElement)) { dom = this; }
    clearInterval(dom._postile_fx_interval);
    dom._postile_fx_interval = setInterval(function() {
        dom._postile.fx_status -= dom._postile.fx_step;
        if (dom._postile.fx_status < 0) { dom._postile.fx_status = 0; clearInterval(dom._postile_fx_interval); return; }
        dom._postile.fx_iter_func(dom._postile.fx_status);
    }, postile.fx.period);
};

*/
