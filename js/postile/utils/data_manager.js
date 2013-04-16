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

goog.require('postile.ajax');
goog.require('goog.async.Deferred');

/**
 * Stores information about the users
 * @type {Object.<UserData|goog.async.Deferred>}
 */
postile.data_manager.userData = { };

/**
 * Fetch user data by the given id.
 * @param {number} user_id
 * @param {function} callback
 * @param {Object=} opt_this (Optional) This object to call callback with
 */
postile.data_manager.getUserData = function(user_id, callback, opt_this) {
    var maybeUser = postile.data_manager.userData[user_id];

    if (goog.isDef(maybeUser)) {
        if (!(maybeUser instanceof goog.async.Deferred)) {
            // Fast path & common case: user was prefetched.
            callback.call(opt_this, maybeUser);
        }
        else {
            // Is being fetching: don't send another request, just
            // reuse this one.
            maybeUser.branch().addCallback(callback, opt_this);
        }
    }
    else {
        // Not found, send the request to server.

        // Deferred is used to avoid duplicate request while
        // the data is being fetching.
        var dfd = postile.data_manager.userData[user_id]
                = new goog.async.Deferred();

        // Request
        postile.ajax([ 'user', 'get_user' ], {
            target_user_id: user_id
        }, function(data) {
            var cleanData = postile.data_manager.userData[user_id] = { };

            for (var attr in data.message.profile) {
                cleanData[attr] = data.message.profile[attr];
            }

            for (var attr in data.message.user) {
                cleanData[attr] = data.message.user[attr];
            }

            // Got it :P
            callback.call(opt_this, cleanData);

            // Resolve the deferred with data as well
            dfd.callback(cleanData);
        });
    }
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
           !(maybeUser instanceof goog.async.Deferred);
};

postile.data_manager.getCachedUser = function(user_id) {
    return postile.data_manager.userData[user_id];
};

