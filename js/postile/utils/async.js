goog.provide('postile.async');

goog.require('goog.asserts');
goog.require('goog.array');

/**
 * postile.async.Promise provides an abstraction to do asynchronous
 * jobs. You can turn a value into a Promise (by Promise.unit),
 * or turn a callback function into a Promise (by Promise.fromCallback),
 * or turn an array of Promises into a Promise (by Promise.waitForAll).
 *
 * Promises are chained using d.bind(func), where `func` accepts
 * the result of d as the argument, and returns a Promise (or undefined),
 * if we are done with this promise chain.
 *
 * Caveats: no error handling is being done at the moment. It would
 * be better if at least timeout could be handled.
 *
 * Usecase:
 *
 * 1. When previous results are not used:
 *
 *    var fetchData = goog.partial(postile.ajax([...], ...));
 *    postile.async.Promise.fromCallback(fetchData)
 *    .bind(function(x) {
 *        // Do sth with x
 *        return postile.async.Promise.unit(x + 1);
 *    })
 *    .bind(function(x) {
 *        // Do another async fetch
 *        var fetchMore = goog.partial(postile.ajax([...], ...));
 *        return postile.async.Promise.fromCallback(fetchMore);
 *    })
 *    .bind(function(xs) {
 *        // Do parallel async fetchs
 *        var proms = goog.array.map(function(x) {
 *            return postile.async.Promise.fromCallback(
 *                goog.partial(postile.ajax(...), x));
 *        }, xs);
 *        return postile.async.Promise.waitForAll(proms);
 *    })
 *    .bind(function(xs) {
 *        // Do something with xs.
 *    });
 *
 * 2. When previous results are needed
 *
 *    postile.async.Promise.fromCallback(fetchData)
 *    .bind(function(x) {
 *        return postile.async.Promise.fromCallback(getY)
 *               .lift(function(y) {
 *                   return {x: x, y: y};
 *               });
 *    })
 *    .bind(function(xy) {
 *        return postile.async.Promise.fromCallback(getZ)
 *               .lift(function(z) {
 *                   xy.z = z;
 *                   return xy;
 *               });
 *    })
 *    .bind(function(xyz) {
 *        // do something with x, y and z
 *    });
 */

/**
 * @constructor
 */
postile.async.Promise = function(opt_value) {
    if (goog.isDef(opt_value)) {
        this.value_ = opt_value;
        this.hasValue_ = true;
    }
    else {
        this.value_ = null;
        this.hasValue_ = false;
    }
    this.onValue_ = null;
    this.fired_ = false;
};

/**
 * @param {*} Called when we have the result.
 * @private
 */
postile.async.Promise.prototype.callback_ = function(value) {
    goog.asserts.assert(!this.hasValue_);

    this.value_ = value;
    this.hasValue_ = true;
    if (this.onValue_) {
        this.fire_();
    }
};

postile.async.Promise.prototype.fire_ = function() {
    goog.asserts.assert(!this.fired_);
    this.fired_ = true;
    this.onValue_(this.value_);

    // Clean up
    this.value_ = null;
    this.onValue_ = null;
};

/**
 * @param {function(*): **} f The callback function for this promise
 * @private
 */
postile.async.Promise.prototype.setCallback_ = function(f) {
    goog.asserts.assert(!this.onValue_);

    this.onValue_ = f;
    if (this.hasValue_) {
        this.fire_();
    }
};

/**
 * @param {function(*): postile.async.Promise=} f A function that
 * accepts the result of this promise, and returns a new promise.
 * @param {Object=} opt_this (Optional) this object to use
 * @return {postile.async.Promise}
 */
postile.async.Promise.prototype.bind = function(f, opt_this) {
    goog.asserts.assert(f);

    var newDfd = new postile.async.Promise();
    this.setCallback_(function(a) {
        var mb = goog.isDef(opt_this) ? f.call(opt_this, a) : f(a);
        if (goog.isDef(mb) && mb instanceof postile.async.Promise) {
            mb.setCallback_(goog.bind(newDfd.callback_, newDfd));
        }
    });
    return newDfd;
};

/**
 * @param {function(*): **} f Transforms the result of this promise
 * and create a new promise.
 * @param {Object=} opt_this (Optional) this object to use
 * @return {postile.async.Promise}
 */
postile.async.Promise.prototype.lift = function(f, opt_this) {
    goog.asserts.assert(f);

    var newDfd = new postile.async.Promise();
    this.setCallback_(function(a) {
        var b = goog.isDef(opt_this) ? f.call(opt_this, a) : f(a);
        newDfd.callback_(b);
    });
    return newDfd;
};

/**
 * Short hand (or actually longer?) for new Promise.
 */
postile.async.Promise.unit = function(x) {
    return new postile.async.Promise(x);
};

/**
 * @param {function(function(*))} A function that accepts a callback
 * function as its first argument.
 * @return {postile.async.Promise}
 */
postile.async.Promise.fromCallback = function(handler) {
    var prom = new postile.async.Promise();
    handler(goog.bind(prom.callback_, prom));
    return prom;
};

/**
 * Returns a new promise that wait for all the given promises.
 * @param {Array.<postile.async.Promise>} proms
 * @return {postile.async.Promise}
 */
postile.async.Promise.waitForAll = function(proms) {
    goog.asserts.assert(goog.isArray(proms));

    var newDfd = new postile.async.Promise();
    var totalNum = proms.length;

    if (totalNum == 0) {
        // Empty array case.
        newDfd.callback_([]);
        return newDfd;
    }

    var finished = 0;
    var results = new Array(totalNum);

    goog.array.forEach(proms, function(prom, i) {
        prom.setCallback_(function(result) {
            finished += 1;
            results[i] = result;
            if (finished == totalNum) {
                newDfd.callback_(results);
            }
        });
    });
    return newDfd;
};


