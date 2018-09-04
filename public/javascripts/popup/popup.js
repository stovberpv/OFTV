define([], function () {
    'use strict';

    function Popup () {
        let _id = Math.floor(Math.random() * 100000);
        let _popup = null;
        let _title = '';
        let _buttons = [];

        function createView () {
            return `
            <div id='popup-${_id}' class='popup'>
                <div class='title'>${_title}</div>
                <div class='controls'>
                    <div class='button first ${_buttons[0].id}'>${_buttons[0].title}</div>
                    <div class='button last ${_buttons[1].id}'>${_buttons[1].title}</div>
                </div>
            </div>
            `.replace(/\s\s+/gmi, '');
        }

        this.getDOM = () => {
            return _popup;
        };

        this.setTitle = title => {
            _title = title;

            return this;
        };

        this.setButtons = buttons => {
            _buttons = buttons;

            return this;
        };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = createView();
            _popup = template.content.firstChild;

            return this;
        };

        this.show = () => {
            _popup && document.body.appendChild(_popup);
            _popup = document.getElementById(`popup-${_id}`);

            return this;
        };

        this.close = () => {
            _popup.parentNode.removeChild(_popup);
        };

        this.setEventListener = (target, cb, context = null, args = null) => {
            if (!_popup) return;
            _popup.querySelector(`.${target}`).addEventListener('click', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));

            return this;
        };
    }

    return Popup;
});
