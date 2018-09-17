define(['utils/index'], function (utils) {
    'use strict';

    let contextMenu = null;
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
            if (!_layout) return;
            let self = this;

            _listeners.forEach(l => {
                function e (e) {
                    l.cb && l.cb(e);
                    (l.finish === undefined || l.finish === true) && self.close();
                }
                // try { _layout.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
                _layout.querySelector(`.${l.id}`).addEventListener('click', e);
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
            isDraggable && utils.utils.setDraggable(_layout, '.title');

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
            // try { _layout.parentNode.removeChild(_layout); } catch (e) { console.log(e); }
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
            if (!_layout) return;
            let self = this;

            _listeners.forEach(l => {
                function e (e) {
                    let selectedElements = _layout.querySelectorAll('.selected');
                    l.cb && l.cb(e, selectedElements);
                    (l.finish === undefined || l.finish === true) && self.close();
                }
                // try { _layout.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
                _layout.querySelector(`.${l.id}`).addEventListener('click', e);
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
            isDraggable && utils.utils.setDraggable(_layout, '.title');

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
            // try { _layout.parentNode.removeChild(_layout); } catch (e) { console.log(e); }
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
            if (!_layout) return;
            let self = this;

            (() => {
                _listeners.forEach(l => {
                    function e (e) {
                        (l.finish === undefined || l.finish === true) && self.close();
                        l.cb && l.cb(e);
                    }
                    // try { _layout.querySelector(`.${l.id}`).addEventListener('click', e); } catch (e) { console.log(e); }
                    _layout.querySelector(`.${l.id}`).addEventListener('click', e);
                });
            })();

            (() => {
                document.body.addEventListener('click', globalClickEvent);
                _layout.addEventListener('click', e => { e.stopPropagation(); });
            })();
        }

        let globalClickEvent = (() => {
            function globalClickEvent (e) {
                if (!e.target.closest(`#contextmenu-${_id}`)) {
                    document.body.removeEventListener('click', globalClickEvent);
                    this.close();
                }
            }

            return globalClickEvent.bind(this);
        })();

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
            // try { _layout.parentNode.removeChild(_layout); } catch (e) { console.log(e); }
            _layout.parentNode.removeChild(_layout);
            contextMenu = null;
        };

        this.awaitUserSelect = liId => {
            let self = this;
            let target = liId ? _layout.querySelector(`#${liId}`) : _layout;
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
