(function (window, $, Voltron, jenga) {

    'use strict';

    // set prototype to base component and assign
    // Dialog constructor to the constructor prototype
    Dialog.prototype = new Voltron({});
    Dialog.prototype.constructor = Dialog;

    // constructor
    function Dialog (options) {
        Voltron.call(this, options);
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
        jenga.bringToFront(this.$el[0]);
    };

    // makes dialog invisible in the UI
    Dialog.prototype.hide = function () {};

    window.Dialog = window.Dialog || Dialog;

})(window, jQuery, Voltron, jenga);