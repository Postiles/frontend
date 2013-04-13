goog.provide('postile.log');

goog.require('goog.debug.Logger');
goog.require('goog.debug.FancyWindow');

goog.require('postile.conf');

postile.log.init = function() {
    var me = postile.log;
    me.logWindow_ = new goog.debug.FancyWindow('main');
    me.logWindow_.setEnabled(true);
    me.logWindow_.init(true);

    var logger = me.rootLogger_ = goog.debug.Logger.getLogger('postile');
    me.w = goog.bind(logger.warning, logger);
    me.i = goog.bind(logger.info, logger);
};


if (postile.conf.ENABLE_DEBUG) {
    postile.log.init();
};

