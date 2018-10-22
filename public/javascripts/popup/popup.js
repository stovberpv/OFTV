define(['utils/index'], function (utils) {
    'use strict';

    let contextMenu = null;
    let popupDialog = null;
    let popupWithSelection = null;

    const MODE = {
        SINGLE:   'S',
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
        let _id = Math.floor(Math.random() * 100000);
        let _mode = opts.mode || MODE.SINGLE;
        let _layout = null;
        let _caller = null;
        let _list = opts.list || [];
        let _cb = opts.cb || null;
        let _xy = opts.xy || [];

        let globalClickEvent = (() => {
            function globalClickEvent (e) {
                if (!e.target.closest(`#contextmenu-${_id}`)) {
                    document.body.removeEventListener('click', globalClickEvent);
                    this.close();
                }
            }

            return globalClickEvent.bind(this);
        })();

        let globalKeyupEvent = (() => {
            let self = this;
            return function selfRemovedFunction (e) {
                try { self.close(); } catch (e) { debugger; }
                document.body.removeEventListener('keyup', selfRemovedFunction);
            };
        })();

        function layout () {
            let list = _list.reduce((p, c, i, a) => {
                // FIX c is Array
                return `
                    ${p}
                    <div id='${c.id}' class='menu-element'>
                        <button>${c.text}</button>
                        <i class='icon'></i>
                    </div>
                    ${i < a.length - 1 ? `<div class='divider'></div>` : ''}
                    `;
            }, '');
            return `<div id='contextmenu-${_id}' class='contextmenu' style='left:${_xy[0]}px; top:${_xy[1]}px;'>${list}</div>`.replace(/\s\s+/gmi, '');
        }

        function setListeners () {
            if (!_layout) return;
            let self = this;

            _layout.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                let target = e.target.closest('div.menu-element');
                self.close();
                _cb && _cb(target ? target.id : void (0));
            });

            document.body.addEventListener('click', globalClickEvent);
            document.body.addEventListener('keyup', globalKeyupEvent);
        }

        this.getDOM = () => { return _layout; };

        this.setCaller = caller => { _caller = caller; };

        this.getCaller = () => { return _caller; };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _layout = template.content.firstChild;
            setListeners.bind(this)();

            return this;
        };

        this.show = () => {
            _layout && document.body.appendChild(_layout);
            _layout = document.getElementById(`contextmenu-${_id}`);
            if (_mode === MODE.SINGLE) {
                contextMenu && contextMenu.close();
                contextMenu = this;
            }

            return this;
        };

        this.close = () => {
            if (!_layout) return;
            document.body.removeEventListener('click', globalClickEvent);
            document.body.removeEventListener('keyup', globalKeyupEvent);
            _layout.parentNode.removeChild(_layout);
            contextMenu = null;
        };

        this.awaitUserSelect = liId => {
            let self = this;
            let target = liId ? _layout.querySelector(`#${liId}`) : _layout;
            return new Promise((resolve, reject) => {
                if (!target) reject(new Error(`${liId} not found!`));
                target.addEventListener('click', e => { self.close(); resolve(e.target.closest('.menu-element').id); });
            });
        };

        return this;
    }

    /**
     * element
     * status
     * actions
     *
     * @param {*} opts
     * @returns
     */
    function SideMenu (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _menuList = opts.list || [];
        let _eventsHandlers = opts.eventsHandlers || {};
        let _sideMenu = null;
        let _prefixId = 'sidemenu';

        let overlayClickEvent = e => {
            e.stopPropagation();
            close();
        };

        let sidemenuKeyupEvent = e => {
            e.stopPropagation();
            close();
        };

        let buttonClickEvent = e => {
            let target = e.target;
            let buttonId = target.dataset.actionid;
            let listElement = target.closest('li');
            let elementId = listElement.dataset.guid;
            try {
                _eventsHandlers.buttons(buttonId, elementId);
            } catch (e) {
                console.log('No handler for event');
            } finally {
                // close();
            }
        };

        function initListeners () {
            if (_sideMenu) {
                _sideMenu.querySelector('.overlay').addEventListener('click', overlayClickEvent);

                let buttons = _sideMenu.querySelectorAll('button');
                Array.from(buttons).forEach(function (button) {
                    button.addEventListener('click', buttonClickEvent);
                });

                _sideMenu.addEventListener('keyup', sidemenuKeyupEvent);
            }
        }

        function crateLayout () {
            function getButtons (buttons) {
                let result = buttons.reduce((p, c) =>
                    `${p}<button data-actionId ='${c.id}' class='${c.id}' title='${c.title}'></button>`,
                '');

                return `<div class='${_prefixId}-inner'>${result}</div>`;
            }

            function getList () {
                let list = '';
                _menuList.forEach(element => {
                    list = `${list}<li data-guid='${element.id}'>${element.title}${getButtons(element.buttons)}</li>`;
                });

                return `
                    <div id='${_prefixId}-wrapper-${_id}' class='${_prefixId}'>
                        <div class='overlay'></div>
                        <ul class='${_prefixId}-main'>${list}</ul>
                    </div>`.replace(/\s\s+/gmi, '');
            }

            return getList();
        }

        function render () {
            let template = document.createElement('template');
            template.innerHTML = crateLayout();
            _sideMenu = template.content.firstChild;
            initListeners();

            return this;
        }
        this.render = render;

        function show () {
            _sideMenu && document.body.appendChild(_sideMenu);
            _sideMenu = document.getElementById(`${_prefixId}-wrapper-${_id}`);

            return this;
        }
        this.show = show;

        function close () {
            if (_sideMenu) {
                _sideMenu.parentNode.removeChild(_sideMenu);
                _sideMenu = null;
            }
        }
        this.close = close;

        return this;
    }

    return { PopupDialog, PopupWithSelection, ContextMenu, SideMenu };
});
