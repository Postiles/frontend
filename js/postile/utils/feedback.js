goog.provide('postile.feedback');

postile.feedback.FeedbackData = function(text) {
    this.userAgent = postile.browser_compat.uas;
    this.clientTs = new Date().getTime();
    this.location = window.location.href;
    this.errorList = postile.logError.slice(Math.max(0, postile.logError.length - 10), postile.logError.length);
}