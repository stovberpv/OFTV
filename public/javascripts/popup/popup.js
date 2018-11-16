define(function (require) {
    'use strict';

    let utils = require('utils/index');
    let configIndex = require('config/index');
    // let eventBus = require('eventbus');

    // let contextMenu = null;
    let popupDialog = null;
    let popupWithSelection = null;

    const MODE = {
        SINGLE: 'S',
        MULTIPLE: 'M'
    };

    function PopupDialog (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _mode = opts.mode || MODE.SINGLE;
        let _layout = null;
        let _title = opts.title || '';
        let _content = opts.content || '';
        let _buttons = opts.buttons || [];
        let isDraggable = opts.isDraggable || true;

        function layout () {
            return `
                <div id='popup-${_id}' class='popup-wrapper popup dialog'>
                    <div class='container'>
                        <div class='title'>${_title}</div>
                        <div class='content'>${_content}</div>
                        <div class='controls'>
                            <button id='primary'>${_buttons.primary.title || 'Кнопка 1'}</button>
                            <button id='secondary'>${_buttons.secondary.title || 'Кнопка 2'}</button>
                        </div>
                    </div>
                </div>`.replace(/\s\s+/gmi, '');
        }

        function setListeners () {
            if (!_layout) return;
            let self = this;

            _layout.querySelector(`button#primary`).addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                self.close();
                _buttons.primary.cb && _buttons.primary.cb(e.target.id);
            });

            _layout.querySelector(`button#secondary`).addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                self.close();
                _buttons.secondary.cb && _buttons.secondary.cb(e.target.id);
            });
        }

        this.getDOM = () => {
            return _layout;
        };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _layout = template.content.firstChild;

            setListeners.bind(this)();
            isDraggable && utils.utils.setDraggable(_layout, '.container');

            return this;
        };

        this.show = () => {
            _layout && document.body.appendChild(_layout);
            _layout = document.getElementById(`popup-${_id}`);
            if (_mode === MODE.SINGLE) {
                popupDialog && popupDialog.close();
                popupDialog = this;
            }
            return this;
        };

        this.close = () => {
            if (!_layout) return;
            _layout.parentNode.removeChild(_layout);
            popupDialog = null;
        };
    }

    function PopupWithSelection (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _mode = opts.mode || MODE.SINGLE;
        let _layout = null;
        let _title = opts.title || '';
        let _content = opts.content || '';
        let _selectionList = opts.selectionList || {};
        let _buttons = opts.buttons || {};
        let isDraggable = opts.isDraggable || true;

        function layout () {
            return `
                <div id='popup-${_id}' class='popup-wrapper popup dialog-with-selection'>
                    <div class='container'>
                        <div class='title'><span>${_title}</span></div>
                        <div class='content'><span>${_content}</span></div>
                        <div class='selection-list'>
                            ${_selectionList.reduce((p, c) => `
                                ${p}<div class='list-element' data-id='${c.id}'>
                                    <span class='checkbox'></span>
                                    <span class='text'>${c.title}</span>
                                </div>`, '')}
                        </div>
                        <div class='controls'>
                            <button id='primary'>${_buttons.primary.title || 'Кнопка 1'}</button>
                            <button id='secondary'>${_buttons.secondary.title || 'Кнопка 2'}</button>
                        </div>
                    </div>
                </div>`.replace(/\s\s+/gmi, '');
        }

        function setListeners () {
            if (!_layout) return;
            let self = this;

            _layout.querySelector(`button#primary`).addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                let selectedElements = _layout.querySelectorAll('.selected');
                if (selectedElements.length === 0) return;
                self.close();
                _buttons.primary.cb && _buttons.primary.cb(e.target, Array.from(selectedElements).map(e => { return e.dataset.id; }));
            });
            _layout.querySelector(`button#secondary`).addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                self.close();
                _buttons.secondary.cb && _buttons.secondary.cb(e.target);
            });

            Array.from(_layout.querySelectorAll('div.list-element')).forEach(div => {
                div.addEventListener('click', e => {
                    Array.from(e.target.closest('.popup').querySelectorAll('div.list-element.selected')).forEach(selected => {
                        let target = e.target.closest('div');
                        if (selected !== target) selected.classList.remove('selected');
                    });
                    e.target.closest('div.list-element').classList.toggle('selected');
                });
            });
        }

        this.getDOM = () => {
            return _layout;
        };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _layout = template.content.firstChild;

            setListeners.bind(this)();
            isDraggable && utils.utils.setDraggable(_layout, '.container');

            return this;
        };

        this.show = () => {
            _layout && document.body.appendChild(_layout);
            _layout = document.getElementById(`popup-${_id}`);
            if (_mode === MODE.SINGLE) {
                popupWithSelection && popupWithSelection.close();
                popupWithSelection = this;
            }
            return this;
        };

        this.close = () => {
            if (!_layout) return;
            _layout.parentNode.removeChild(_layout);
            popupWithSelection = null;
        };
    }

    function ContextMenu (opts) {
        let _xy = opts.xy || [];

        let _contextMenu = null;
        let _menuList = opts.list;
        let _eventListeners = opts.eventListeners || {};
        let _buttons = [
            { statusCode: 0x10, id: 'hookup', title: configIndex.locale.ru.menu.t001 },   // '10000'
            { statusCode: 0x8, id: 'breakup', title: configIndex.locale.ru.menu.t002 },   // '01000'
            { statusCode: 0x1, id: 'new', title: configIndex.locale.ru.menu.t003 },       // '00001'
            { statusCode: 0x4, id: 'edit', title: configIndex.locale.ru.menu.t004 },      // '00100'
            { statusCode: 0x2, id: 'remove', title: configIndex.locale.ru.menu.t005 }     // '00010'
        ];
        let _events = {
            onClickButton: e => {
                let target = e.target;
                let btn = target.dataset.actionId;
                let id = target.dataset.id;
                try {
                    _eventListeners.button(btn, id);
                } catch (e) {
                    console.log('No handler for event');
                } finally {
                    _close();
                }
            }
        };

        function _crateLayout () {
            let buttons = _buttons.reduce((p, c, i, a) =>
                `${p}
                <button class='${c.id}' title='${c.title}' data-id='${_menuList[0].id}' data-action-id ='${c.id}' data-status-code='${c.statusCode}'>${c.title}</button>
                ${i < a.length - 1 ? `<div class='divider'></div>` : ''}
                `,
            '');
            return `<div id='contextmenu' class='contextmenu' style='left:${_xy[0]}px; top:${_xy[1]}px;'>${buttons}</div>`.replace(/\s\s+/gmi, '');
        }

        function _render () {
            let template = document.createElement('template');
            template.innerHTML = _crateLayout();
            _contextMenu = template.content.firstChild;

            return this;
        }

        function _init () {
            _close();
            if (_contextMenu) {
                _contextMenu.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', _events.onClickButton);
                });
            }

            return this;
        }

        function _display () {
            if (_contextMenu) {
                document.body.appendChild(_contextMenu);
                _contextMenu = document.getElementById(`contextmenu`);
            }

            return this;
        }

        function _close () {
            let contextMenu = document.getElementById(`contextmenu`);
            if (contextMenu) {
                contextMenu.parentNode.removeChild(contextMenu);
            }
        }

        this.init = _init;
        this.render = _render;
        this.display = _display;
        this.close = _close;
    }
    ContextMenu.eachButton = function (cb) {
        let menu = document.getElementById(`contextmenu`);
        if (menu) {
            menu.querySelectorAll('button').forEach(function (button) { cb(button); });
        }
    };

    /**
     *
     *
     * @param {Object} opts
     * @returns
     */
    function SideMenu (opts) {
        let _sideMenu = null;
        let _menuList = opts.list || [];
        let _eventListeners = opts.eventListeners || {};
        let _buttons = [
            { statusCode: 0x10, id: 'hookup', title: configIndex.locale.ru.menu.t001 },   // '10000'
            { statusCode: 0x8, id: 'breakup', title: configIndex.locale.ru.menu.t002 },   // '01000'
            { statusCode: 0x1, id: 'new', title: configIndex.locale.ru.menu.t003 },       // '00001'
            { statusCode: 0x4, id: 'edit', title: configIndex.locale.ru.menu.t004 },      // '00100'
            { statusCode: 0x2, id: 'remove', title: configIndex.locale.ru.menu.t005 }     // '00010'
        ];
        let _events = {
            onKeyup: e => {
                e.stopPropagation();
                _close();
            },
            onClickOverlay: e => {
                e.stopPropagation();
                _close();
            },
            onClickButton: e => {
                let target = e.target;
                let btn = target.dataset.actionId;
                let li = target.closest('li');
                let id = li.id;
                try {
                    _eventListeners.button(btn, id);
                } catch (e) {
                    console.log('No handler for event');
                } finally {
                    // close();
                }
            }
        };

        function _crateLayout () {
            function getButtons () {
                let buttons = _buttons.reduce((p, c) =>
                    `${p}
                    <button class='${c.id}' title='${c.title}' data-action-id ='${c.id}' data-status-code='${c.statusCode}'>
                    </button>`,
                '');

                return `<div class='btn-group'>${buttons}</div>`;
            }

            function getList () {
                let list = _menuList.reduce((p, c) =>
                    `${p}
                    <li id='${c.id}'>
                        ${c.title}
                        ${getButtons()}
                    </li>`,
                '');

                return `<ul>${list}</ul>`;
            }

            return `
                <div id='sidemenu'>
                    <div class='overlay'></div>
                    ${getList()}
                </div>`.replace(/\s\s+/gmi, '');
        }
        function _init () {
            if (_sideMenu) {
                _sideMenu.querySelector('.overlay').addEventListener('click', _events.onClickOverlay);

                _sideMenu.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', _events.onClickButton);
                });

                _sideMenu.addEventListener('keyup', _events.onKeyup);

                // eventBus.on('sidemenu-update', SideMenu.eachLi);
            }

            return this;
        }
        function _render () {
            let template = document.createElement('template');
            template.innerHTML = _crateLayout();
            _sideMenu = template.content.firstChild;

            return this;
        }
        function _display () {
            if (_sideMenu) {
                document.body.appendChild(_sideMenu);
                _sideMenu = document.getElementById(`sidemenu`);
            }

            return this;
        }
        function _close () {
            if (_sideMenu) {
                _sideMenu.parentNode.removeChild(_sideMenu);
                _sideMenu = null;
                // eventBus.cancel('sidemenu-update', SideMenu.eachLi);
            }
        }

        this.init = _init;
        this.render = _render;
        this.display = _display;
        this.close = _close;
    }
    SideMenu.eachLi = function (cb) {
        let menu = document.getElementById(`sidemenu`);
        if (menu) {
            menu.querySelectorAll('li').forEach(function (li) { cb(li); });
        }
    };

    return { PopupDialog, PopupWithSelection, ContextMenu, SideMenu };
});
