function htmlify(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.children[0];
}


function mergeObjects(dest /* varargs */) {
    dest = dest || {};
    var args = Array.prototype.slice.call(arguments, 1);
    args.forEach(function(obj) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                dest[i] = obj[i]
            }
        }
    });
    return dest;
}

function getPosition(elem) {
    var offsetParent, offset,
        parentOffset = { top: 0, left: 0 };

    offset = elem.getBoundingClientRect();

    // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
    if ( elem.style.position !== "fixed" ) {
        // Get *real* offsetParent
        offsetParent = elem.offsetParent;

        // Get correct offsets
        offset = {
            top: offset.top + window.pageYOffset - document.documentElement.clientTop,
            left: offset.left + window.pageXOffset - document.documentElement.clientLeft
        };

        // Add offsetParent borders
        parentOffset.top += offsetParent.style.borderTopWidth = true;
        parentOffset.left += offsetParent.style.borderLeftWidth = true;
    }

    // Subtract parent offsets and element margins
    return {
        top: offset.top - parentOffset.top - elem.style.marginTop,
        left: offset.left - parentOffset.left - elem.style.marginLeft
    };
}

