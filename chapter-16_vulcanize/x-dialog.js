var Duvet = (function (window, $, jenga) {

    'use strict';

    function getScrollbarWidth(parentEl) {
        var innerCss = {
            width: '100%',
            height: '200px'
        };
        var outerCss = {
            width: '200px',
            // outer element height is smaller than inner element height
            // this will cause a scrollbar
            height: '150px',
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: 'hidden',
            overflow: 'hidden'
        };
        var $inner = $('<div>test</div>').css(innerCss);
        var $outer = $('<div></div>').css(outerCss).append($inner);
        var innerEl = $inner[0];
        var outerEl = $outer[0];

        $(parentEl || 'body').append(outerEl);
        // get the layout width of the the inner element inlcuding the scrollbar
        var innerWidth = innerEl.offsetWidth;
        $outer.css('overflow', 'scroll');
        // get the inner width of the outer element, but do not include the scrollbar
        var outerWidth = $outer[0].clientWidth;
        // remove the elements from the DOM
        $outer.remove();

        // subtract the outer element width from the inner element width
        // this difference is the width of the scrollbar
        return (innerWidth - outerWidth);
    }

    // cache value for cases where scrollbar widths are consistent
    var scrollbarWidth = getScrollbarWidth();

    // scrollWidth, scrollHeight will be a larger value than the actual
    // width or height of the element itself if the content exceeds the
    // width or height; if it is a larger value then the scrollbar width
    // needs to be accounted for when positioning the overlay element
    function getScrollbarOffset(el) {
        var $el = $(el);
        var $body = $('body');
        var scrollWidth = el.scrollWidth === undefined ? $body[0].scrollWidth : el.scrollWidth;
        var scrollHeight = el.scrollHeight === undefined ? $body[0].scrollHeight : el.scrollHeight;
        var scrollbarWidth = getScrollbarWidth();

        return {
            x: scrollWidth > $el.outerWidth() ? scrollbarWidth : 0,
            y: scrollHeight > $el.outerHeight() ? scrollbarWidth : 0
        };
    }

    function getDimensions(el) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Element.getBoundingClientRect
        // relative to the viewport
        var rect;
        // https://api.jquery.com/position/
        // relative to the offset parent
        var offset = el === window ? { top: 0, left: 0 } : $(el).position();

        // if containing element is the window object
        // then use $ methods for getting the width and height
        if (el === window) {
            var width = $(window).width();
            var height = $(window).height();

            rect = {
                right: width,
                left: 0,
                top: 0,
                bottom: height
            };
        } else {
            rect = el.getBoundingClientRect();
        }

        return {
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
            // top relative to the element's offset parent
            top: offset.top,
            // bottom relative to the element's offset parent
            bottom: offset.top + (rect.bottom - rect.top),
            // left relative to the element's offset parent
            left: offset.left,
            right: rect.right
        };
    }

    function bindListeners($offsetParent, callback) {
        // unbind event to ensure that event listener is never bound more than once
        $offsetParent.off('scroll.duvet').on('scroll.duvet', function (e) {
            callback();
        });
        $offsetParent.off('resize.duvet').on('resize.duvet', function (e) {
            callback();
        });
    }

    function position(el, options) {
        var pos = {};
        var $parent = el.parentNode.tagName === 'BODY' ? $(window) : $(el.parentNode);
        var $el = $(el);
        // get the scrollbar offset
        var scrollbarOffset = getScrollbarOffset(el.parentNode.tagName === 'BODY' ? window : el.parentNode);

        //  parent el is the offset parent
        if (el.parentNode !== el.offsetParent) {
            el.parentNode.style.position = 'relative';
        }

        switch (options.align) {
            case 'TL':
                pos.top = 0;
                pos.left = 0;
                break;
            case 'TR':
                pos.top = 0;
                pos.right = 0;
                break;
            case 'BL':
                pos.bottom = 0;
                pos.left = 0;
                break;
            case 'BR':
                pos.bottom = 0;
                pos.right = 0;
                break;
            case 'BC':
                pos.bottom = 0;
                pos.left = ((($parent.outerWidth() -
                    scrollbarOffset.y - $el.outerWidth()) / 2) +
                    $parent.scrollLeft());
                break;
            case 'TC':
                pos.top = 0;
                break;
            case 'M':
                pos.left = ((($parent.outerWidth() -
                    scrollbarOffset.y - $el.outerWidth()) / 2) +
                    $parent.scrollLeft());
                pos.top = ((($parent.outerHeight() -
                    scrollbarOffset.x - $el.outerHeight()) / 2) +
                    $parent.scrollTop());
                break;
        }

        // if the positions are less than 0 then
        // element being positioned is larger than
        // its container
        pos.left = pos.left > 0 ? pos.left : 0;
        pos.top = pos.top > 0 ? pos.top : 0;

        // position the element absolutely and
        // set the top and left properties
        $el.css($.extend({
            position: 'absolute',
            display: 'block'
        }, pos));

        // if the element should not move when the containing
        // element is resized or scrolled then bind event listeners
        // and call the position function
        if (options.fixed && options.align === 'M' && !options.bound) {
            options.bound = true;
            bindListeners($parent, function () {
                position(el, options);
            });
        }
    }

    // used to get the margins for offset parents
    function getMargins(el) {
        var $el = $(el);
        var marginTop = parseInt($el.css('margin-top'), 10);
        var marginLeft = parseInt($el.css('margin-left'), 10);

        return {
            top: isNaN(marginTop) ? 0 : marginTop,
            left: isNaN(marginLeft) ? 0 : marginLeft
        };
    }

    // align the overlay el to another element in the DOM
    function align(el, options) {
        var alignToElDim = getDimensions(options.alignToEl);
        var css = { display: 'block', visibility: 'visible', position: 'absolute' };
        var $el = $(el);
        var parentAlignToElMargins = getMargins(options.alignToEl.parentNode);

        // hide element, but keep dimensions by setting the visibility to hidden
        $el.css({
            visibility: 'hidden',
            display: 'block',
            'z-index': -1000
        });

        // get element's dimensions
        var elDim = getDimensions(el);

        // ensure that alignToEl parent el is the offset parent
        if (options.alignToEl.parentNode !== options.alignToEl.offsetParent) {
            options.alignToEl.parentNode.style.position = 'relative';
        }

        // use the alignToEl and el dimensions and position to calculate
        // the el's position
        switch (options.align) {
            case 'TL':
                css.top = (alignToElDim.top - elDim.height) - parentAlignToElMargins.top;
                css.left = alignToElDim.left - parentAlignToElMargins.left;
                break;
            case 'TR':
                css.top = (alignToElDim.top - elDim.height) - parentAlignToElMargins.top;
                css.left = (alignToElDim.right - elDim.width)  - parentAlignToElMargins.left;
                break;
            case 'BL':
                css.top = alignToElDim.bottom  - parentAlignToElMargins.top;
                css.left = alignToElDim.left - parentAlignToElMargins.left;
                break;
            case 'BR':
                css.top = alignToElDim.bottom - parentAlignToElMargins.top;
                css.left = (alignToElDim.right - elDim.width) - parentAlignToElMargins.left;
                break;
            case 'BC':
                css.top = alignToElDim.bottom - parentAlignToElMargins.top;
                css.left = (((alignToElDim.width - elDim.width) / 2) +
                    alignToElDim.left) - parentAlignToElMargins.left;
                break;
            case 'TC':
                css.top = (alignToElDim.top - elDim.height) - parentAlignToElMargins.top;
                css.left = (((alignToElDim.width - elDim.width) / 2) +
                    alignToElDim.left) - parentAlignToElMargins.left;
                break;
            case 'M':
                css.top = (((alignToElDim.height - elDim.height) / 2) +
                    alignToElDim.top) - parentAlignToElMargins.top;
                css.left = (((alignToElDim.width - elDim.width) / 2) +
                    alignToElDim.left) - parentAlignToElMargins.left;
                break;
        }

        jenga.bringToFront(el, true);
        $el.css(css);
    }

    // default options
    var defaults = {
        alignToEl: null,
        align: 'M',
        fixed: true,
        offsets: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    };

    // creates an overlay instance
    function Duvet(el, options) {
        // create references to overlay element
        this.el = el;
        this.$el = $(el);

        // extend default options with developer defined options
        this.setOptions($.extend({}, defaults, options));

        // return instance reference
        return this;
    }

    // positions the overlay element
    Duvet.prototype.position = function (options) {
        // allow for modification of options before positioning
        this.setOptions(options);

        // call private functions (will defined later)
        if (this.options.alignToEl) {
            // if alignToEl is bod then reassign to window since body height
            // is equal to content height
            this.options.alignToEl = this.options.alignToEl.tagName === 'BODY' ?
                $(window)[0] : this.options.alignToEl;
            align(this.el, this.options);
        } else {
            position(this.el, this.options);
        }
    };

    // sets instance options
    Duvet.prototype.setOptions = function (options) {
        this.options = options ? $.extend(this.options, options) : this.options;
    };

    // clears out any developer defined references to ensure
    // that no element references remain, i.e., helps prevent
    // memory leaks!
    Duvet.prototype.destroy = function () {
        var $parent = $(this.el.parentNode);

        // unbind an event handlers
        $parent.off('scroll.duvet');
        $parent.off('resize.duvet');

        // null out references
        this.el = null;
        this.$el = null;

        // clear out any developer defined options
        this.options = defaults;
    };

    return Duvet;

})(window, jQuery, jenga);
;
// i can move any mountain
var Shamen = (function (global, $) {

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
    function getMargins(el) {
        var $el = $(el);
        var marginTop = parseInt($el.css('margin-top'), 10);
        var marginLeft = parseInt($el.css('margin-left'), 10);
        console.log(marginLeft, marginTop);


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
        this.options = $.extend({}, defaults, options);
        var css = { cursor: (this.options.cursor || 'move') };

        this.isChildOfDocFragment = isChildOfDocFragment(el);
        this.el = el;
        this.$el = $(el);
        this.$dragHandle = this.options.dragHandle ?
            this.$el.find(this.options.dragHandle) : this.$el;
        this.bind();
        this.originalDragHandleCursor = this.$dragHandle.css('cursor');
        // apply cursor css
        this.$dragHandle.css(css);
    }

    // bind mouse down event handler
    Shamen.prototype.bind = function () {
        // filter on drag handle if developer defined one
        var selector = this.options.dragHandle || null;
        var self = this;
        // account for margins if element is position absolutely; resued
        // from Duvet.js
        var parentMargins = getMargins(this.$el.parent()[0]);

        // unbind mousemove handler on mouseup
        $('body').on('mouseup.shamen', function (e) {

            $(window).off('mousemove.shamen');
        });

        this.$el.on('mousedown.shamen', selector, function (e) {
            // get the initial mouse position
            var mousePos = {
                x: e.pageX,
                y: e.pageY
            };

            // bind the mousemove handler
            $(window).on('mousemove.shamen', function (e) {
                // get the differences between the mousedown position and the
                // position from the mousemove events
                var xDiff = e.pageX - mousePos.x;
                var yDiff = e.pageY - mousePos.y;
                // get the draggable el current position relative to the document
                var elPos = getOffsets(self.$el[0], self.isChildOfDocFragment);
                console.log(elPos);

                // prevent text selection
                e.preventDefault();

                // apply the mouse differences to the el position
                self.$el.css({
                    top: (elPos.top + yDiff) - parentMargins.top,
                    left: (elPos.left + xDiff) - parentMargins.left,
                    position: 'absolute'
                });

                // store the current mouse position
                // to diff with the next mousemove positions
                mousePos = {
                    x: e.pageX,
                    y: e.pageY
                };
                console.log((elPos.top + yDiff))

                console.log(mousePos, {
                    top: (elPos.top + yDiff) - parentMargins.top,
                    left: (elPos.left + xDiff) - parentMargins.left,
                    position: 'absolute'
                })
            });
        });
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

})(window, jQuery);
;
// Eh-neeek-chock
var ApacheChief = (function (global, $) {

    'use strict';

    // default resize handle css
    var handlesCss = {
        width: '10px',
        height: '10px',
        cursor: 'se-resize',
        position: 'absolute',
        display: 'none',
        'background-color': '#000'
    };

    // options defaults
    var defaults = {
        handles: ['BR'],
        handlesCss: {
            TM: $.extend({}, handlesCss, { cursor: 'n-resize', top: 0, left: '50%' }),
            TR: $.extend({}, handlesCss, { cursor: 'ne-resize', top: 0, right: 0 }),
            MR: $.extend({}, handlesCss, { cursor: 'e-resize', bottom: '50%', right: 0 }),
            BR: $.extend({}, handlesCss, { bottom: 0, right: 0 }),
            BM: $.extend({}, handlesCss, { cursor: 's-resize', bottom: 0, left: '50%' }),
            ML: $.extend({}, handlesCss, { cursor: 'w-resize', bottom: '50%', left: 0 }),
            BL: $.extend({}, handlesCss, { cursor: 'sw-resize', bottom: 0, left: 0 }),
            TL: $.extend({}, handlesCss, { cursor: 'nw-resize' }),
        }
    };

    // merge default CSS and developer defined CSS
    // this is necessary because $.extend is shallow
    function mergeResizeHandleCss(defaultCss, instanceCss) {
        var retVal = {};

        // iterate over default css properties
        for (var k in defaultCss) {
            // set return value poperty equal to the instance property defined
            // by the developer or the default css property value; it is also possible
            // to go down one more layer, but this assumes wholesale property
            // replacement
            retVal[k] = instanceCss[k] || defaultCss[k];
        }

        return retVal;
    }

    // create resizable instance
    function ApacheChief(el, options) {
        this.el = el;
        this.$el = $(el);
        // extend options with developer defined options
        this.options = $.extend({}, defaults, options);

        // extend isn't deep, so ensure that handle css is merged properly
        mergeResizeHandleCss(this.options, options || {});

        // create resize handles
        this.createResizeHandles();

        // bind event handlers
        this.bind();
    }

    // create resize handles
    ApacheChief.prototype.createResizeHandles = function () {
        var handlesCss = this.options.handlesCss;
        var handles = this.options.handles;
        var $handles;

        // loop the resize handles CSS hash, create elements,
        // and append them to this.$el
        // data-handle attribute is used to help determine what element
        // properties should be adjusted when resizing
        for (var i = 0; i < handles.length; i++) {
            if (handlesCss[handles[i]]) {
                this.$el
                    .append($('<div class="apache-chief-resize" data-handle="' + handles[i] + '">')
                    .css(handlesCss[handles[i]]));
            }
        }

        $handles = this.$el.find('.apache-chief-resize');
        // ensure that container is an offset parent for positioning handles
        if (this.$el !== $handles.offsetParent()) {
            this.$el.css('position', 'relative');
        }
        $handles.css('display', 'block');
    };

    // bind event handlers
    ApacheChief.prototype.bind = function () {
        var self = this;

        $('body').on('mouseup.apache-chief', function (e) {
            $(window).off('mousemove.apache-chief');
        });

        this.$el.find('.apache-chief-resize').on('mousedown.apache-chief', function (e) {
            var $handle = $(this);
            var direction = $handle.attr('data-handle');
            // if true then the handle moves in a position that only affects width and height
            var adjustPosition = direction !== 'BM' &&
                direction !== 'MR' && direction !== 'BR';
            // get the initial mouse position
             var mousePos = {
                x: e.pageX,
                y: e.pageY
            };

            // get coordinates for resizing
            function getPositionDiffs(adjustPosition, e, mousePos, direction) {
                var diffs = {
                    xDim: direction === 'BM' ? 0 : e.pageX - mousePos.x,
                    yDim: direction === 'MR' ? 0 : e.pageY - mousePos.y,
                    xPos: 0,
                    yPos: 0
                };

                if (!adjustPosition) {
                    return diffs;
                }

                switch (direction) {
                    case 'TR':
                        diffs.yPos = diffs.yDim;
                        diffs.yDim = -diffs.yDim;
                        break;
                    case 'TL':
                        diffs.xPos = diffs.xDim;
                        diffs.xDim = -diffs.xDim;
                        diffs.yPos = diffs.yDim;
                        diffs.yDim = -diffs.yDim;
                        break;
                    case 'BL':
                        diffs.xPos = diffs.xDim;
                        diffs.xDim = -diffs.xDim;
                        break;
                    case 'ML':
                        diffs.xPos = diffs.xDim;
                        diffs.xDim = -diffs.xDim;
                        diffs.yDim = 0;
                        break;
                    case 'TM':
                        diffs.yPos = diffs.yDim;
                        diffs.yDim = -diffs.yDim;
                        diffs.xDim = 0;
                        break;
                }

                return diffs;
            }

            $(window).on('mousemove.apache-chief', function (e) {
                // get the differences between the mousedown position and the
                // position from the mousemove events
                var diffs = getPositionDiffs(adjustPosition, e, mousePos, direction);
                // get the draggable el current position relative to the document
                var elPos;

                // prevent text selection
                e.preventDefault();

                // adjust the width and height
                self.$el.css({
                    width: self.$el.width() + diffs.xDim,
                    height: self.$el.height() + diffs.yDim
                });

                // adjust the top and bottom
                if (adjustPosition) {
                    elPos = self.$el.offset();
                    self.$el.css({
                        top: elPos.top + diffs.yPos,
                        left: elPos.left + diffs.xPos,
                        position: 'absolute'
                    });
                }

                // store the current mouse position
                // to diff with the next mousemove positions
                mousePos = {
                    x: e.pageX,
                    y: e.pageY
                };
            });
        });
    };

    // clean up instance
    ApacheChief.prototype.destroy = function () {
        this.$el.off('mousedown.apache-chief');
        // remove the resize handles
        this.$el.find('.apache-chief-resize').remove();

        this.el = null;
        this.$el = null;
        this.options = defaults;
    };

    return ApacheChief;

})(window, jQuery);;
(function (root, $) {

    'use strict';

    // https://github.com/jashkenas/backbone/blob/master/backbone.js#L1027
    // Cached regex to split keys for `delegate`.
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;

    // constructor; creates instance
    function Component(options) {
        this.init(options);
        return this;
    }

    // default options
    Component.prototype.defaults = {};

    // events hash
    Component.prototype.events = {};

    // initialization code
    Component.prototype.init = function (options) {
        this.options = $.extend({}, this.defaults, options);
        this.$el = $(options.$el);
        this.bind();
        return this;
    };

    // heavily based on Backbone.View.delegateEvents
    // https://github.com/jashkenas/backbone/blob/master/backbone.js#L1088
    // bind using event delegation
    Component.prototype.bind = function () {
        var events = this.options.events ? Component.result(this.options.events) : null;

        if (!events) {
            return this;
        }

        // prevent double binding of events
        this.unbind(); // prevent double binding of events

        // iterate over events hash
        for (var key in events) {
            var method = events[key];
            // if value is not a funciton then
            // find corresponding instance method
            if (!$.isFunction(method)) {
                method = this[events[key]];
            }
            // if a method does not exist move
            // to next item in the events hash
            if (!method) {
                continue;
            }

            // extract event name and selector from
            // property
            var match = key.match(delegateEventSplitter);
            var eventName = match[1];
            var selector = match[2];

            // bind event callback to component instance
            method = $.proxy(method, this);

            if (selector.length) {
                this.$el.on(eventName, selector, method);
            } else {
                this.$el.on(eventName, method);
            }
        }
    };

    // used to unbind event handlers
    Component.prototype.unbind = function () {
        this.$el.off();
        return this;
    };

    // destroy instance
    Component.prototype.destroy = function () {
        this.unbind();
        this.$el.remove();
    };

    // static util method for determining for returning a value
    // of an uknown type. if value is a function then execute
    // and return value of function
    Component.result = function (val) {
        return $.isFunction(val) ? val() : val;
    };

    window.Component = window.Component || Component;

})(window, jQuery);;
(function (window, $, Component, jenga, Shamen, ApacheChief) {

    'use strict';

    // set prototype to base component and assign
    // Dialog constructor to the constructor prototype
    Dialog.prototype = new Component({});
    Dialog.prototype.constructor = Dialog;

    // constructor
    function Dialog (options) {
        // optionally clone dialog $el
        options.$el = options.clone ? $(options.$el).clone() :
            $(options.$el);
        // append to body
        if (options.appendToEl) {
            $(options.appendToEl).append(options.$el);
        }

        Component.call(this, options);

        // create a draggable instance
        if (options.draggable) {
            this.shamen = new Shamen(this.$el[0], {
                // dialog header is the draghandle
                dragHandle: '#title'
            });
        }

        // create a resizable instance
        if (options.resizable) {
            this.apacheChief = new ApacheChief(this.$el[0], {
                handles: ['BR']
            });
        }

        // create overlay instance
        this.overlay = new Duvet(this.$el[0], {
            fixed: options.draggable ? false : true,
            alignToEl: options.alignToEl
        });

        return this;
    }

    Dialog.prototype.init = function (options) {
        // call super method
        Component.prototype.init.call(this, options);
        // position the dialog's root element absolutely
        this.$el.css({ position: 'absolute' });
    };

    // defaults, e.g., width and height
    Dialog.prototype.defaults = {};

    // event listeners; this is processed by Component.prototype.bind
    Dialog.prototype.events = {};

    // process template for injection into DOM
    Dialog.prototype.render = function () {};

    // makes dialog visible in the UI
    Dialog.prototype.show = function () {
        // this will adjust z-index, set the display property,
        // and position the dialog
        this.overlay.position();
    };

    Dialog.prototype.destroy = function () {
        // clean up overlay
        this.overlay.destroy();

        // clean up draggable
        if (this.shamen) {
            this.shamen.destroy();
        }

        // clean up resizable
        if (this.apacheChief) {
            this.apacheChief.destroy();
        }

        // call super class
        Component.prototype.destroy.call(this);
    };

    // makes dialog invisible in the UI
    Dialog.prototype.hide = function () {};

    window.Dialog = window.Dialog || Dialog;

})(window, jQuery, Component, jenga, Shamen, ApacheChief);
;

        Polymer('x-dialog', {
            attached: function() {
                this.dialog = new Dialog({
                    $el: this.$.dialog,
                    draggable: this.attributes.hasOwnProperty('draggable'),
                    resizable: this.attributes.hasOwnProperty('resizable'),
                    alignToEl: window,
                    align: 'M',
                    hostQrySelector: this
                });
            },
            show: function() {
                this.dialog.show();
            }
        });
    