/**
 * The data manager manages data by sending ajax requests and
 * caching the responses.
 *
 * Two kinds of caching are being done at the moment.
 * Firstly, fetched data will not be fetched again.
 * Secondly, a request for some data that is being fetching will not 
 * trigger additional ajax.
 */
goog.provide('postile.data_manager');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.Delay');
goog.require('goog.json');
goog.require('postile.ajax');

/**
 * Stores information about the users.
 * @type {Object.<UserData|postile.data_manager.RequestCollector>}
 */
postile.data_manager.userData = {};

/**
 * Used to combine multiple get_user request into one.
 * @type {postile.data_manager.RequestCollector}
 */
postile.data_manager.currReqCollector_ = null;

/**
 * Used to combine some request into a big request.
 * @param {number} opt_waitFor Timeout (in ms) to collect and
 *   combine requests. After this timeout, requests will be send
 *   to the server. Defaults to 10.
 */
postile.data_manager.RequestCollector = function(opt_waitFor) {
    /**
     * Maps a user id to a deferred
     * @private
     */
    this.idToDfd_ = {};

    /**
     * Used to fire the request
     * @private
     */
    this.delay_ = new goog.async.Delay(function() {
        // Clean up
        postile.data_manager.currReqCollector_ = null;

        // But store self to the userData so that subsequent
        // duplicate request can share our result.
        goog.object.forEach(this.idToDfd_, function(_, userId) {
            postile.data_manager.userData[userId] = this;
        }, this);

        // User ids
        var idArray = goog.object.getKeys(this.idToDfd_);

        // For sanity check
        var preFetchLen = idArray.length;

        postile.ajax(['user', 'get_users'], {
            'id_arr': goog.json.serialize(idArray)
        }, goog.bind(function(response) {

            /** @type {Array.<UserEx>} */
            var dataArray = response['message'];

            goog.asserts.assert(preFetchLen == dataArray.length);

            // Resolve callbacks and caches to userData.
            goog.array.forEach(dataArray, function(data) {
                var user = postile.data_manager.postProcessUserData(data);
                var userId = user['id'];
                this.idToDfd_[userId].callback(user);
                postile.data_manager.userData[userId] = user;
            }, this);
        }, this));


    }, opt_waitFor ? opt_waitFor : 10, this);

    this.delay_.start();
};

// Can be used both during request collection and request sending.
postile.data_manager.RequestCollector.prototype.addRequest =
function(userId, callback, opt_this) {
    var mbDfd = this.idToDfd_[userId];
    if (!mbDfd) {
        mbDfd = this.idToDfd_[userId] = new goog.async.Deferred();
    }
    mbDfd.branch().addCallback(callback, opt_this);
};

/**
 * Fetch user data by the given id.
 * @param {number} user_id
 * @param {function} callback
 * @param {Object=} opt_this (Optional) This object to call callback with
 */
postile.data_manager.getUserData = function(user_id, callback, opt_this) {
    goog.asserts.assert(goog.isDef(user_id));

    var maybeUser = postile.data_manager.userData[user_id];

    if (goog.isDef(maybeUser)) {
        if (!(maybeUser instanceof
                postile.data_manager.RequestCollector)) {
            // Fast path & common case: user was prefetched.
            callback.call(opt_this, maybeUser);
        }
        else {
            // Is being fetching: don't send another request, just
            // reuse this one.
            maybeUser.addRequest(user_id, callback, opt_this);
        }
    }
    else {
        // Not cached nor being fetching:
        // put the request into the request collector.
        var collector = postile.data_manager.currReqCollector_;
        if (!collector) {
            collector = postile.data_manager.currReqCollector_
                      = new postile.data_manager.RequestCollector();
        }
        collector.addRequest(user_id, callback, opt_this);
    }
};

postile.data_manager.postProcessUserData = function(data) {
    var cleanData = {};

    for (var attr in data.profile) {
        cleanData[attr] = data.profile[attr];
    }

    for (var attr in data.user) {
        cleanData[attr] = data.user[attr];
    }
    return cleanData;
};

postile.data_manager.markDataDirty = function(user_id) {
    delete postile.data_manager.userData[user_id];
};

/**
 * @return {boolean} Whether the user is already cached.
 */
postile.data_manager.userIsCached = function(user_id) {
    var maybeUser = postile.data_manager.userData[user_id];
    return goog.isDef(maybeUser) &&
           !(maybeUser instanceof postile.data_manager.RequestCollector);
};

postile.data_manager.getCachedUser = function(user_id) {
    return postile.data_manager.userData[user_id];
};

