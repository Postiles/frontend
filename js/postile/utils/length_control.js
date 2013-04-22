goog.provide('postile.length_control');

postile.length_control.getLengthWithoutDoms = function(content) {
    var chompedLength = 0;

    var spans = content.match(/<span.*?>.*?<\/span>?/g);
    if (spans && spans.length > 0) { // has match
        for (var i in spans) {
            chompedLength += spans[i].length;
        }
    }

    var nbsps = content.match(/\&nbsp;/g);
    if (nbsps && nbsps.length > 0) { // has match
        chompedLength += 5 * nbsps.length;
    }

    var divs = content.match(/<div.*?>.*?<\/div>?/g);
    if (divs && divs.length > 0) {
        chompedLength += 11 * divs.length;
    }

    var brs = content.match(/<br>/g);
    if (brs && brs.length > 0) {
        chompedLength += 4 * brs.length;
    }

    return content.length - chompedLength;
}
