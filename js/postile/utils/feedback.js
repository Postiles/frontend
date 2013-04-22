goog.provide('postile.feedback');

goog.require('goog.userAgent');
goog.require('postile.conf');

postile.feedback.FeedbackData = function(img) {
    var po = {};
    po.userAgent = goog.userAgent.getUserAgentString();
    po.clientTs = Math.round(new Date().getTime() / 1000);
    po.location = window.location.href;
    po.errorList = JSON.stringify(postile.conf.error_log.slice(Math.max(0, postile.conf.error_log.length - 10), postile.conf.error_log.length));
    if (img) { po.image = img; }
    var nwin = window.open('http://feedback.postiles.com/', '_blank', 'width=480,height=280');
    var rt = function(e) {
        if (e.data == 'REQUEST_ERROR_INFO') {
            nwin.postMessage(po, "*");
        } else if (e.data == "DONE") {
            window.removeEventListener("message", rt, false);
        }
    }
    window.addEventListener("message", rt, false);
}

window.addEventListener("message", function(e) {
    if (e.data.action == 'SCREENSHOT') {
        new postile.feedback.FeedbackData(e.data.img);
    }
});
