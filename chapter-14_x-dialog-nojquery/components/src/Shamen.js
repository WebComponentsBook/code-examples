// i can move any mountain
var Shamen = (function (global) {

    'use strict';

    // instance default options
    var defaults = {
        dragHandle: null
    };

    // is the element part of a shadow root
    function isChildOfDocFragment(el) {
        var parentNode = el.parentNode;

        while (parentNode.tagName !== 'BODY') {
            if (parentNode.nodeName.indexOf('fragment') !== -1) {
                return true;
            }

            parentNode = parentNode.parentNode;
        }

        return false;
    }

    // used to get the margins for offset parents
    function getMargins($el) {
        var marginTop = $el && parseInt($el.style.marginTop, 10);
        var marginLeft = $el && parseInt($el.style.marginLeft, 10);

        return {
            top: isNaN(marginTop) ? 0 : marginTop,
            left: isNaN(marginLeft) ? 0 : marginLeft
        };
    }

   // get offsets
   function getOffsets(el, isChildOfDocFragment) {
        if (isChildOfDocFragment) {
            return {
                left: el.offsetLeft,
                top: el.offsetTop
            };
        }

        return $(el).offset();
    }

    // create draggable instance
    function Shamen(el, options) {
        this.options = mergeObjects({}, defaults, options);
        var css = { cursor: (this.options.cursor || 'move') };

        this.isChildOfDocFragment = isChildOfDocFragment(el);
        this.el = el;
        this.$el = el;
        this.$dragHandle = this.options.dragHandle ?
            this.$el.querySelector(this.options.dragHandle) : this.$el;
        this.bind();
        this.originalDragHandleCursor = this.$dragHandle.style.cursor;
        // apply cursor css
        mergeObjects(this.$dragHandle.style, css);
    }

    Shamen.prototype.bind = function () {
        // filter on drag handle if developer defined one
        var selector = this.options.dragHandle || null;
        var self = this;
        // account for margins if element is position absolutely; resued
        // from Duvet.js
        var parentMargins = getMargins(this.$el.parentElement);

        var mousePos = {};

        this.mouseMoveListener = function onMouseMove(e) {
            // get the differences between the mousedown position and the
            // position from the mousemove events
            var xDiff = e.pageX - mousePos.x;
            var yDiff = e.pageY - mousePos.y;
            // get the draggable el current position relative to the document
            var elPos = getOffsets(self.$el, self.isChildOfDocFragment);

            // prevent text selection
            e.preventDefault();

            // apply the mouse differences to the el position
            mergeObjects(self.$el.style, {
                top: ((elPos.top + yDiff) - parentMargins.top) + 'px',
                left: ((elPos.left + xDiff) - parentMargins.left) + 'px',
                position: 'absolute'
            });

            // store the current mouse position
            // to diff with the next mousemove positions
            mousePos = {
                x: e.pageX,
                y: e.pageY
            };

        };

        // unbind mousemove handler on mouseup
        document.body.addEventListener('mouseup', function (e) {
            window.removeEventListener('mousemove', this.mouseMoveListener);
        }.bind(this));

        this.mouseDownListener = function onMouseDown(e) {
            // get the initial mouse position
            mousePos.x = e.pageX;
            mousePos.y = e.pageY;

            // bind the mousemove handler
            window.addEventListener('mousemove', this.mouseMoveListener);
        }.bind(this);

        this.$el.querySelector(this.options.dragHandle).addEventListener('mousedown', this.mouseDownListener);
    };

    // clean up to prevent memory leaks
    Shamen.prototype.destroy = function () {
        // unbind mousedown
        this.$el.off('mousedown.shamen');
        // revert cursor for draghandle
        this.$dragHandle.css({ cursor: this.originalDragHandleCursor });

        // null out jQuery object, element references
        this.el = null;
        this.$el = null;
        this.$dragHandle = null;

        // revert options to defaults
        this.options = defaults;
    };

    return Shamen;

})(window);
