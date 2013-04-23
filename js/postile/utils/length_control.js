goog.provide('postile.length_control');

postile.length_control.LengthController = function(dom_el, maxLength) {
    this.dom_el = dom_el;
    this.dom_el.style.border = '1px solid whitesmoke';
    this.dom_el.lengthOverflow = false;
    this.maxLength = maxLength;

    goog.events.listen(
        this.dom_el,
        goog.events.EventType.KEYUP,
        function(e) {
            var content = goog.string.trim(this.dom_el.innerHTML);
            var diff = postile.length_control.getLengthWithoutDoms(content) - this.maxLength;

            if (diff > 0) {
                this.dom_el.style.border = '1px solid #fe7a15';
                this.dom_el.lengthOverflow = true;
            } else {
                this.dom_el.style.border = '1px solid whitesmoke';
                this.dom_el.lengthOverflow = false;
            }
        }.bind(this));
}

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
