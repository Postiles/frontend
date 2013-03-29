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
            var user = { };
            for (var attr in data.message.profile) {
                data.message.user[attr] = data.message.profile[attr];
            }
            postile.data_manager.userData[user_id] = data.message.user;
            callback(postile.data_manager.userData[user_id]);
        });
    }
}
