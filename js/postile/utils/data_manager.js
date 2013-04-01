/**
 * The data manager manages data by sending ajax requests and caching the responses
 */
goog.provide('postile.data_manager');

goog.require('postile.ajax');

// information about the users
postile.data_manager.userData = { };

postile.data_manager.getUserData = function(user_id, callback) {
    if (postile.data_manager.userData[user_id]) { // found in local cache
        callback(postile.data_manager.userData[user_id]);
    } else { // not found, send request to server
        postile.ajax([ 'user', 'get_user' ], { target_user_id: user_id }, function(data) {
            postile.data_manager.userData[user_id] = { };

            for (var attr in data.message.user) {
                postile.data_manager.userData[user_id][attr] = data.message.user[attr];
            }

            for (var attr in data.message.profile) {
                postile.data_manager.userData[user_id][attr] = data.message.profile[attr];
            }
            callback(postile.data_manager.userData[user_id]);
        });
    }
}
