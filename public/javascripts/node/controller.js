define([], function () {
    'use strict';

    function Controller () {
        let _view = null;

        this.attachTo = view => _view = view;
        this.addListener = (element, event, cb) => _view.querySelector(element).addEventListener(event, cb);

        return this;
    }

    return Controller;
});
