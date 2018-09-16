define(['utils/index'], function (utils) {
    'use strict';

    function PopupDialog (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _popup = null;
        let _title = opts.title || '';
        let _content = opts.content || '';
        let _buttons = opts.buttons || [];
        let _listeners = opts.listeners || [];
        let isDraggable = opts.isDraggable || true;

        function layout () {
            return `
            <div id='popup-${_id}' class='popup popup-dialog'>
                <div class='title'>${_title}</div>
                <div class='content'>${_content}</div>
                <div class='controls'>
                    ${_buttons.reduce((p, c) => `${p}<div class='button ${c.id}'>${c.title}</div>`, '')}
                </div>
            </div>`.replace(/\s\s+/gmi, '');
        }

        function setListeners () {
            let popup = _popup;
            _listeners.forEach(l => {
                function e (e) {
                    l.cb && l.cb(e);
                    (l.finish === undefined || l.finish === true) && popup.parentNode.removeChild(popup);
                }
                try { popup.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
            });
        }

        this.getDOM = () => {
            return _popup;
        };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _popup = template.content.firstChild;

            setListeners();
            isDraggable && utils.utils.setDraggable(_popup, '.title');

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
    }

    function PopupWithSelection (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _popup = null;
        let _title = opts.title || '';
        let _content = opts.content || '';
        let _selectionList = opts.selectionList || {};
        let _buttons = opts.buttons || [];
        let _listeners = opts.listeners || [];
        let isDraggable = opts.isDraggable || true;

        function layout () {
            return `
            <div id='popup-${_id}' class='popup popup-with-selection'>
                <div class='title'>${_title}</div>
                <div class='content'>${_content}</div>
                <div class='selection-list'>
                    <ul>
                        ${_selectionList.reduce((p, c) => `${p}<div class='list-element' id='${c.id}'><span></span><li>${c.title}</li></div>`, '')}
                    </ul>
                </div>
                <div class='controls'>
                    ${_buttons.reduce((p, c) => `${p}<div class='button ${c.id}'>${c.title}</div>`, '')}
                </div>
            </div>`.replace(/\s\s+/gmi, '');
        }

        function setListeners () {
            let popup = _popup;
            _listeners.forEach(l => {
                function e (e) {
                    let selectedElements = popup.querySelectorAll('.selected');
                    l.cb && l.cb(e, selectedElements);
                    (l.finish === undefined || l.finish === true) && popup.parentNode.removeChild(popup);
                }
                try { popup.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
            });
            Array.from(popup.querySelectorAll('div.list-element')).forEach(div => {
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
            return _popup;
        };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _popup = template.content.firstChild;

            setListeners();
            isDraggable && utils.utils.setDraggable(_popup, '.title');

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
    }

    function ContextMenu (opts) {
        let _id = Math.floor(Math.random() * 100000);
        let _contextMenu = null;
        let _caller = null;
        let _list = opts.list || [];
        let _listeners = opts.listeners || [];
        let _xy = opts.xy || [];

        function layout () {
            let list = _list.reduce((p, c, i, a) => {
                return `
                    ${p}
                    <div id='${c.id}' class='list-element'>
                        <span class='text'>${c.text}</span>
                        <i class='icon'></i>
                    </div>
                    ${i < a.length - 1 ? `<div class='divider'></div>` : ''}
                    `;
            }, '');
            return `<div id='contextmenu-${_id}' class='contextmenu' style='left:${_xy[0]}px; top:${_xy[1]}px;'>${list}</div>`.replace(/\s\s+/gmi, '');
        };

        function setListeners () {
            if (!_contextMenu) return;
            let self = this;

            (() => {
                _listeners.forEach(l => {
                    function e (e) {
                        (l.finish === undefined || l.finish === true) && self.close();
                        l.cb && l.cb(e);
                    }
                    try { _contextMenu.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
                });
            })();

            (() => {
                document.body.addEventListener('click', function selfRemovedFunction (e) {
                    if (!e.target.closest(`#contextmenu-${_id}`)) {
                        self.close();
                        document.body.removeEventListener('click', selfRemovedFunction);
                    }
                });
                _contextMenu.addEventListener('click', e => { e.stopPropagation(); });
            })();
        }

        this.getDOM = () => { return _contextMenu; };

        this.setCaller = caller => { _caller = caller; };

        this.getCaller = () => { return _caller; };

        this.render = () => {
            let template = document.createElement('template');
            template.innerHTML = layout();
            _contextMenu = template.content.firstChild;

            setListeners.bind(this)();

            return this;
        };

        this.show = () => {
            _contextMenu && document.body.appendChild(_contextMenu);
            _contextMenu = document.getElementById(`contextmenu-${_id}`);

            return this;
        };

        this.close = () => {
            if (!_contextMenu) return;
            try { _contextMenu.parentNode.removeChild(_contextMenu); } catch (e) { console.log(e); }
            _contextMenu = null;
        };

        this.awaitUserSelect = liId => {
            let self = this;
            let target = liId ? _contextMenu.querySelector(`#${liId}`) : _contextMenu;
            return new Promise((resolve, reject) => {
                if (!target) reject(new Error(`${liId} not found!`));
                target.addEventListener('click', e => { self.close(); resolve(e.target.closest('.list-element').id); });
            });
        };

        return this;
    }

    return {
        PopupDialog: PopupDialog,
        PopupWithSelection: PopupWithSelection,
        ContextMenu: ContextMenu
    };
});
