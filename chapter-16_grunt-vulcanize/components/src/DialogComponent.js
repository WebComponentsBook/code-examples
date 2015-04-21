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
