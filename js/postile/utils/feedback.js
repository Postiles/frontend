goog.provide('postile.feedback');

postile.feedback.FeedbackData = function(img) {
    var po = {};
    po.userAgent = postile.browser_compat.uas;
    po.clientTs = Math.round(new Date().getTime() / 1000);
    po.location = window.location.href;
    po.errorList = JSON.stringify(postile.error_log.slice(Math.max(0, postile.error_log.length - 10), postile.error_log.length));
    if (img) { po.image = img; }
    var nwin = window.open('http://feedback.postiles.com/', '_blank', 'width=480,height=240');
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