goog.provide('postile.async');

goog.require('goog.asserts');
goog.require('goog.array');

/**
 * postile.async.Deferred provides an abstraction to do asynchronous
 * jobs. You can turn a value into a Deferred (by Deferred.unit),
 * or turn a callback function into a Deferred (by Deferred.fromCallback),
 * or turn an array of Deferreds into a Deferred (by Deferred.waitForAll).
 *
 * Deferreds are chained using d.bind(func), where `func` accepts
 * the result of d as the argument, and returns a Deferred (or undefined),
 * if we are done with this deferred chain.
 *
 * Usecase:
 *
 * 1. When previous results are not used:
 *
 *    var fetchData = goog.partial(postile.ajax([...], ...));
 *    postile.async.Deferred.fromCallback(fetchData)
 *    .bind(function(x) {
 *        // Do sth with x
 *        return postile.async.Deferred.unit(x + 1);
 *    })
 *    .bind(function(x) {
 *        // Do another async fetch
 *        var fetchMore = goog.partial(postile.ajax([...], ...));
 *        return postile.async.Deferred.fromCallback(fetchMore);
 *    })
 *    .bind(function(xs) {
 *        // Do parallel async fetchs
 *        var dfds = goog.array.map(function(x) {
 *            return postile.async.Deferred.fromCallback(
 *                goog.partial(postile.ajax(...), x));
 *        }, xs);
 *        return postile.async.Deferred.waitForAll(dfds);
 *    })
 *    .bind(function(xs) {
 *        // Do something with xs.
 *    });
 *
 * 2. When previous results are needed
 *
 *    postile.async.Deferred.fromCallback(fetchData)
 *    .bind(function(x) {
 *        return postile.async.Deferred.fromCallback(getY)
 *               .lift(function(y) {
 *                   return {x: x, y: y};
 *               });
 *    })
 *    .bind(function(xy) {
 *        return postile.async.Deferred.fromCallback(getZ)
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
 * [value] -> [onValue, value] -> [fired]
 * [] -> [onValue] -> .callback -> [fired]
 * @constructor
 */
postile.async.Deferred = function(opt_value) {
    if (goog.isDef(opt_value)) {
        this.value_ = value;
        this.hasValue_ = true;
    }
    else {
        this.value_ = null;
        this.hasValue_ = false;
    }
    this.onValue_ = null;
};

/**
 * @param {*} Called when we have the result.
 * @private
 */
postile.async.Deferred.prototype.callback_ = function(value) {
    goog.asserts.assert(!this.hasValue_);

    this.hasValue_ = true;
    if (this.onValue_) {
        this.onValue_(value);

        // Clean up
        this.value_ = null;
        this.onValue_ = null;
    }
    else {
        this.value_ = value;
    }
};

/**
 * @param {function(*): **} f The callback function for this deferred
 * @private
 */
postile.async.Deferred.prototype.setCallback_ = function(f) {
    goog.asserts.assert(!this.onValue_);

    this.onValue_ = f;
    if (this.hasValue_) {
        this.callback_(this.value_);
    }
};

/**
 * @param {function(*): postile.async.Deferred=} f A function that
 * accepts the result of this deferred, and returns a new deferred.
 * @param {Object=} opt_this (Optional) this object to use
 * @return {postile.async.Deferred}
 */
postile.async.Deferred.prototype.bind = function(f, opt_this) {
    goog.asserts.assert(f);

    var newDfd = new postile.async.Deferred();
    this.setCallback_(function(a) {
        var mb = goog.isDef(opt_this) ? f.call(opt_this, a) : f(a);
        if (goog.isDef(mb) && mb instanceof postile.async.Deferred) {
            mb.setCallback_(goog.bind(newDfd.callback_, newDfd));
        }
    });
    return newDfd;
};

/**
 * @param {function(*): **} f Transforms the result of this deferred
 * and create a new deferred.
 * @param {Object=} opt_this (Optional) this object to use
 * @return {postile.async.Deferred}
 */
postile.async.Deferred.prototype.lift = function(f, opt_this) {
    goog.asserts.assert(f);

    var newDfd = new postile.async.Deferred();
    this.setCallback_(function(a) {
        var b = goog.isDef(opt_this) ? f.call(opt_this, a) : f(a);
        newDfd.callback_(b);
    });
    return newDfd;
};

/**
 * Short hand (or actually longer?) for new Deferred.
 */
postile.async.Deferred.unit = function(x) {
    return new postile.async.Deferred(x);
};

/**
 * @param {function(function(*))} A function that accepts a callback
 * function as its first argument.
 * @return {postile.async.Deferred}
 */
postile.async.Deferred.fromCallback = function(handler) {
    var dfd = new postile.async.Deferred();
    handler(goog.bind(dfd.callback_, dfd));
    return dfd;
};

/**
 * Returns a new deferred that wait for all the given deferreds.
 * @param {Array.<postile.async.Deferred>} dfds
 * @return {postile.async.Deferred}
 */
postile.async.Deferred.waitForAll = function(dfds) {
    var newDfd = new postile.async.Deferred();
    var totalNum = dfds.length;
    var finished = 0;
    var results = new Array(totalNum);

    goog.array.forEach(dfds, function(dfd, i) {
        dfd.setCallback_(function(result) {
            finished += 1;
            results[i] = result;
            if (finished == totalNum) {
                newDfd.callback_(results);
            }
        });
    });
    return newDfd;
};


