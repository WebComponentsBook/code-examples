(function (window, $, Voltron, Duvet) {

    'use strict';

    // set prototype to base component and assign
    // Dialog constructor to the constructor prototype
    Dialog.prototype = new Voltron({});
    Dialog.prototype.constructor = Dialog;

    // constructor
    function Dialog (options) {
        // optionally clone dialog $el
        options.$el = options.clone ? $(options.$el).clone() :
            $(options.$el);
        // append to body
        $('body').append(options.$el);

        Voltron.call(this, options);

        // create overlay instance
        this.overlay = new Duvet(this.$el[0]);

        return this;
    }

    Dialog.prototype.init = function (options) {
        // call super method
        Voltron.prototype.init.call(this, options);
        // position the dialog's root element absolutely
        this.$el.css({ position: 'absolute' });
    };

    // defaults, e.g., width and height
    Dialog.prototype.defaults = {};

    // event listeners; this is processed by Voltron.prototype.bind
    Dialog.prototype.events = {};

    // process template for injection into DOM
    Dialog.prototype.render = function () {};

    // makes dialog visible in the UI
    Dialog.prototype.show = function () {
        // this will adjust z-index, set the display property,
        // and position the dialog
        this.overlay.position();
    };

    // makes dialog invisible in the UI
    Dialog.prototype.hide = function () {};

    Dialog.prototype.destroy = function () {
        // clean up overlay
        this.overlay.destroy();

        // call super class
        Voltron.prototype.destroy.call(this);
    };

    window.Dialog = window.Dialog || Dialog;

})(window, jQuery, Voltron, Duvet);