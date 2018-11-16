define(function (require) {
    'use strict';

    let ymaps = require('ymaps');
    let popup = require('popup/index');
    // let eventBus = require('eventbus');
    let Database = require('database/index').Database;

    let mapInstance = null;

    let contextMenu = {
        open: function (event) {
            let eventTarget = event.get('target');
            let targets = eventTarget.getGeoObjects ? eventTarget.getGeoObjects() : [eventTarget];

            let menuOptions = {
                xy: event.get('pagePixels'),
                list: targets.map(target => {
                    let extProp = target.properties.get('external');
                    return {
                        id: extProp.guid,
                        title: extProp.name || extProp.description || 'No name'
                    };
                }),
                eventListeners: {
                    button: (action, guid) => {
                        switch (action) {
                            case 'hookup': mapInstance.geoObjects.events.fire('hookup', { guid }); break;
                            case 'breakup': mapInstance.geoObjects.events.fire('breakup', { guid }); break;
                            case 'edit': mapInstance.geoObjects.events.fire('edit', { guid }); break;
                            case 'remove': mapInstance.geoObjects.events.fire('remove', { guid }); break;
                            case 'new': mapInstance.geoObjects.events.fire('new', { guid }); break;
                            default: break;
                        }
                    }
                }
            };

            if (targets.length > 1) {
                let menu = new popup.SideMenu(menuOptions);
                menu.render().init().display();
                targets.forEach(geoObj => {
                    let extProp = geoObj.properties.get('external');
                    popup.SideMenu.eachLi(li => {
                        if (li.id === extProp.guid) {
                            li.querySelectorAll('button').forEach(btn => {
                                let geoObjState = extProp.getState();
                                let btnState = parseInt(btn.dataset.statusCode, 10);
                                // eslint-disable-next-line no-extra-boolean-cast
                                !!(btnState & geoObjState) ? btn.removeAttribute('disabled') : btn.setAttribute('disabled', '');
                            });
                        }
                    });
                });
            } else if (targets.length) {
                let menu = new popup.ContextMenu(menuOptions);
                menu.render().init().display();
                targets.forEach(geoObj => {
                    let extProp = geoObj.properties.get('external');
                    popup.ContextMenu.eachButton(btn => {
                        let geoObjState = extProp.getState();
                        let btnState = parseInt(btn.dataset.statusCode, 10);
                        // eslint-disable-next-line no-extra-boolean-cast
                        !!(btnState & geoObjState) ? btn.removeAttribute('disabled') : btn.setAttribute('disabled', '');
                    });
                });
            }
        }
    };

    // FIX  TODO :
    let balloon = {
        open: e => {
            let target = e.get('target');
            let extProp = target.properties.get('external');

            extProp.colorize(target.options);
            extProp.fetch();

            target.balloon.open();
        },
        close: e => {
            // if (e.get('cluster')) return;
            let target = e.get('target');
            let extProp = target.properties.get('external');
            // let data;
            let optsName;
            if (extProp.isChanged) {
                // iterate inputs & copy to extProp
                extProp.isEdited = false;
                if (extProp.type === 'node') {
                    // data = new this.Node(extProp).toPrimitive();
                    optsName = 'iconColor';
                } else if (extProp.type === 'route') {
                    // data = new this.Route(extProp).toPrimitive();
                    optsName = 'strokeColor';
                }
                target.options.set(optsName, '#F4425F');
                // EventBus.emit('update', { type: extProp.type, data }); // FIX :
            }
        }
    };

    // FIX  TODO :
    let events = {
        handlers: {
            onMapKeyup: e => {
                let contextMenu = document.getElementById('contextmenu');
                if (contextMenu) {
                    contextMenu.parentNode.removeChild(contextMenu);
                }
            },
            onMapClick: e => {
                let coords = e.get('coords');
                DraggablePlacemark.setCoords(coords);
                DraggablePlacemark.create();
                DraggablePlacemark.move();

                let contextMenu = document.getElementById('contextmenu');
                if (contextMenu) {
                    contextMenu.parentNode.removeChild(contextMenu);
                }
            },
            onHookup: e => {
                let guid = e.get('guid');

                Clusterer.instance.getGeoObjects().some(o => {
                    let extProp = o.properties.get('external');
                    if (extProp.guid === guid) {
                        extProp.isHooked = true;
                        EditablePolyline.points.add({ id: guid, placemark: o });

                        popup.SideMenu.eachLi(li => {
                            if (li.id === extProp.guid) {
                                li.querySelectorAll('button').forEach(btn => {
                                    let geoObjState = extProp.getState();
                                    let btnState = parseInt(btn.dataset.statusCode, 10);
                                    // eslint-disable-next-line no-extra-boolean-cast
                                    !!(btnState & geoObjState) ? btn.removeAttribute('disabled') : btn.setAttribute('disabled', '');
                                });
                            }
                        });

                        return true;
                    }
                });
            },
            onBreakup: e => {
                let guid = e.get('guid');

                Clusterer.instance.getGeoObjects().some(o => {
                    let extProp = o.properties.get('external');
                    if (extProp.guid === guid) {
                        delete extProp.isHooked;
                        // o.properties.set('external', extProp);
                        EditablePolyline.points.del({ id: guid });

                        popup.SideMenu.eachLi(li => {
                            if (li.id === extProp.guid) {
                                li.querySelectorAll('button').forEach(btn => {
                                    let geoObjState = extProp.getState();
                                    let btnState = parseInt(btn.dataset.statusCode, 10);
                                    // eslint-disable-next-line no-extra-boolean-cast
                                    !!(btnState & geoObjState) ? btn.removeAttribute('disabled') : btn.setAttribute('disabled', '');
                                });
                            }
                        });

                        return true;
                    }
                });
            },
            onEdit: e => {
                // меню - изменить
                //      объект - установка префикса редактируемый
                //      запросить данные из БД
                let target = e.get('target');
                let extProp = target.properties.get('external');
                extProp.isEdited = true;
                // target.properties.set('external', extProp);
                mapInstance.geoObjects.events.fire('balloonopen', e);
            },
            onRemove: e => {
                // меню - удалить
                //      отправить данные в БД
            },
            onNew: e => {
                // меню - трасса сохранить
                //      трасса - убрать все узлы из массива
                //          все узлы - убрать префикс трассы
                //      трасса - убрать
                //      отправить информацию в БД
                // меню - узел сохранить
                //      узел - убрать
                //      отправить информацию в БД
            }
        },
        registerAll: function () {
            mapInstance.events.add('keyup', this.handlers.onMapKeyup);
            mapInstance.events.add('click', this.handlers.onMapClick);
            mapInstance.geoObjects.events.add('balloonopen', balloon.open);
            mapInstance.geoObjects.events.add('balloonclose', balloon.close);
            mapInstance.geoObjects.events.add('contextmenu', contextMenu.open.bind(contextMenu));
            mapInstance.geoObjects.events.add('hookup', this.handlers.onHookup);
            mapInstance.geoObjects.events.add('breakup', this.handlers.onBreakup);
            mapInstance.geoObjects.events.add('edit', this.handlers.onEdit);
            mapInstance.geoObjects.events.add('remove', this.handlers.onRemove);
            mapInstance.geoObjects.events.add('new', this.handlers.onNew);
        }
    };

    let layout = {
        set: (name, layout) => {
            ymaps.layout.storage.add(`${name}`,
                ymaps.templateLayoutFactory.createClass(layout,
                    {
                        build: function () {
                            this.constructor.superclass.build.call(this);
                            let properties = this.getData().properties;
                            let extProp = properties.external || properties.get('external');
                            this.getElement().querySelectorAll('input').forEach(input => {
                                if (extProp.isEditable) {
                                    input.removeAttribute('readonly');
                                    input.addEventListener('keyup', e => {
                                        // extProp[e.target.name] = e.target.value; // FIX : move to nalloonClose
                                        !extProp.isChanged && (extProp.isChanged = true);
                                    });
                                } else {
                                    input.setAttributeNode(document.createAttribute('readonly'));
                                }
                            });
                        }
                    }
                ));
        },
        get: name => ymaps.layout.storage.get(`${name}`)
    };

    // TODO  FIX :
    let Clusterer = {
        instance: null,
        init: function () {
            let options = () => {
                let clusterIconContentLayout = ymaps.templateLayoutFactory.createClass(
                    `<div
                            style='
                                width: 30px;
                                height: 30px;
                                background-color: #F4425F;
                                border-radius: 100%;
                                border: 6px double #FFF;
                                color: #FFF;
                                font-weight: bold;
                                line-height: 30px;
                            '>
                            {{ properties.geoObjects.length }}
                        </div>`);

                return {
                    clusterIcons: [{ href: '', size: [30, 30], offset: [-15, -15] }],
                    clusterIconContentLayout: clusterIconContentLayout,
                    showInAlphabeticalOrder: true,
                    hasBalloon: false
                };
            };

            this.instance = new ymaps.Clusterer(options());
            delete this.init;

            return this.instance;
        },
        balloon: {
            open: e => {
                let target = e.get('target');
                var geoObjectState = Clusterer.instance.getObjectState(target);
                let balloonContructor = {
                    position: target.geometry.getCoordinates(),
                    properties: {
                        properties: {
                            external: extProp
                        }
                    },
                    options: {
                        closeButton: true,
                        contentLayout: layout.get('node')
                    }
                };
                if (geoObjectState.cluster) {
                    if (geoObjectState.isShown) {
                        if (geoObjectState.isClustered) {
                            mapInstance.balloon.open(balloonContructor.position, balloonContructor.properties, balloonContructor.options);
                        } else {
                            target.balloon.open();
                        }
                    }
                } else {
                    target.balloon.open();
                }
            }
        }
    };
    let Collection = {
        instance: null,
        init: function () {
            let options = () => { return []; };
            this.instance = new ymaps.Collection(options());
            delete this.init;

            return this.instance;
        }
    };

    let DraggablePlacemark = (() => {
        let _mark = null;
        let _coords = null;
        let _properties = {
            iconCaption: 'Поиск адреса...',
            iconContent: '',
            external: {
                isNew: true
            }
        };
        let _options = {
            iconColor: '#FFE100',
            preset: 'islands#redCircleDotIconWithCaption', // blueStretchyIcon DotIconWithCaption
            draggable: true
        };

        function _onDragged (e) {
            setCoords(e.originalEvent.target.geometry.getCoordinates());
            move();
        }
        function setCoords (coords) {
            _coords = coords;
        }
        function create () {
            if (_mark) return;
            _mark = new ymaps.Placemark(_coords, _properties, _options);
            _mark.events.add('dragend', _onDragged);
            Clusterer.instance.add(_mark);
        }
        function move () {
            if (!_mark) return;
            _mark.properties.set('iconCaption', '');
            _mark.geometry.setCoordinates([_coords[0], _coords[1]]);
            ymaps.geocode([_coords[0], _coords[1]]).then(r => {
                let geo = r.geoObjects.get(0);
                let city = geo.getLocalities()[0];
                let street = geo.getThoroughfare() || geo.getPremise() || '';
                let hintContent = street ? `${city}, ${street}` : geo.geometry.getCoordinates();
                _mark.properties.set({ hintContent: hintContent, iconCaption: '' });
            }).catch(e => { });
        }
        function remove () {
            if (!_mark) return;
            Clusterer.instance.remove(_mark);
            _mark = null;
        }
        function setProp (prop) {
            _properties.external = prop;

            return this;
        }

        return { create, move, remove, setCoords, setProp };
    })();
    let EditablePolyline = (() => {
        let _polyline = null;
        let _points = {};
        let _properties = {
            external: {
                isNew: true
            }
        };
        let _options = {
            strokeColor: ['FFF', 'FFE100'], // F4425F
            strokeOpacity: [0.85, 1],
            strokeStyle: ['1 0', '1 2'], // Первая цифра - длина штриха. Вторая - длина разрыва.
            strokeWidth: [6, 4]
        };

        let points = {
            each: cb => { for (let p in _points) { cb(_points[p]); } },
            add: p => { _points[p.id] = p.placemark; },
            del: p => { delete _points[p.id]; },
            all: () => getCoordinates()
        };

        function getCoordinates () {
            let coordinates = [];
            for (let p in _points) { coordinates.push(_points[p].geometry.getCoordinates()); }
            return coordinates;
        }

        function create () {
            if (_polyline) return;
            _polyline = new ymaps.Polyline(getCoordinates(), _properties, _options);
            Collection.instance.add(_polyline);
        }

        function move () {
            if (Object.keys(_points).length === 0) return;
            _polyline.geometry.setCoordinates(getCoordinates());
        }

        function remove () {
            if (!_polyline) return;
            _points = {};
            _polyline.geometry.setCoordinates([]);
            Collection.instance.remove(_polyline);
            _polyline = null;
        }

        function setProp (prop) {
            _properties.external = prop;
        }

        return { create, move, remove, setProp, points };
    })();

    let node = {
        create: data => {
            let extProp = {
                type: 'node',
                isNew: false,
                isHooked: false,
                isChanged: false,
                isEditable: false,
                isRemovable: true,
                getState: function () {
                    let isNew = (this.isNew) ? 0x1 : 0x0;                       // 1 '00001' :  0 '00000';
                    let isHooked = (this.isHooked) ? 0x8 : 0x10;                // 8 '01000' : 16 '10000';
                    let isEditable = (this.isEditable) ? 0x0 : 0x4;             // 0 '00000' :  4 '00100';
                    let isRemovable = (this.isRemovable || 1) ? 0x2 : 0x0;      // 2 '00010' :  0 '00000';
                    let state = (isHooked | isEditable | isRemovable | isNew);
                    return state;
                },
                colorize: function (options) {
                    let color = this.isEdited ? '#FFE100' : '#F4425F';
                    options.set('iconColor', color);
                },
                fetch: function () {
                    let fetchProp = {
                        requestType: 'S',
                        type: this.type,
                        guid: this.guid
                    };
                    Database.getInstance().fetch(fetchProp, r => {
                        Object.assign(this, r);
                    });
                }
            };

            Object.assign(extProp, data.toPrimitive());

            let properties = new ymaps.data.Manager({
                iconCaption: data.name.get(),
                hintContent: data.description.get(),
                clusterCaption: data.name.get(),
                external: extProp
            });

            let options = {
                preset: 'islands#glyphCircleIcon',
                iconColor: '#F4425F',
                iconCaptionMaxWidth: '150',
                balloonContentLayout: ymaps.layout.storage.get(`node`)
            };

            if (data.isDeprecated.get()) {
                return void (0);
            } else {
                let placemark = new ymaps.Placemark(data.coordinates.get(), properties, options);
                Clusterer.instance.add(placemark);

                return placemark;
            }
        },
        // TODO :
        update: function () {
        },
        remove: guid => {
            Clusterer.instance.getGeoObjects().forEach(o => {
                (o.properties.get('external').guid === guid) && Clusterer.instance.remove(o);
            });
        }
    };
    let route = {
        create: function Route (route) {
            let extProp = route.toPrimitive();
            extProp.colorize = function (options, editMode) {
                let color = this.isEdited ? '#FFE100' : '#F4425F';
                options.set('strokeColor', color);
            };
            extProp.fetch = function () {
                let fetchProp = {
                    requestType: 'S',
                    type: this.type,
                    guid: this.guid
                };
                Database.getInstance().fetch(fetchProp, r => {
                    Object.assign(extProp, r);
                });
            };

            let properties = new ymaps.data.Manager({
                hintContent: route.routeDescription.get() || route.cableDescription.get(),
                external: extProp
            });

            let options = {
                /*
                strokeColor: ['F4425F', 'FFFFFF'],
                strokeOpacity: [1, 0.5],
                strokeStyle: '5 2',  // Первая цифра - длина штриха. Вторая - длина разрыва.
                strokeWidth: [5, 4]
                */
                strokeColor: 'F4425F',
                strokeOpacity: 1,
                strokeWidth: 4,
                balloonContentLayout: ymaps.layout.storage.get(`route`)
            };

            if (route.isDeprecated.get()) {
                return void (0);
            } else {
                let polyline = new ymaps.Polyline(route.coordinatePath.get(), properties, options);
                Collection.instance.add(polyline);

                return polyline;
            }
        },
        // TODO :
        update: function () {
        },
        remove: function (guid) {
            Collection.instance.each(o => {
                (o.properties.get('external').guid === guid) && Collection.instance.remove(o);
            });
        }
    };

    let map = {
        init: (target) => {
            return ymaps.ready().then(loadedMap => {
                let _stateConfig = { center: [44.914436, 34.085001], controls: ['zoomControl', 'typeSelector', 'rulerControl', 'searchControl'], zoom: 15 };
                let _optionsConfig = { suppressMapOpenBlock: true, searchControlProvider: 'yandex#search' };
                mapInstance = new loadedMap.Map(target, _stateConfig, _optionsConfig);
                mapInstance.geoObjects.add(Clusterer.init());
                mapInstance.geoObjects.add(Collection.init());
                events.registerAll();
            });
        },
        setBounds: () => {
            let bounds = mapInstance.geoObjects.getBounds();
            bounds && mapInstance.setBounds(bounds, { checkZoomRange: true });
        }
    };

    return {
        init: map.init,
        setBounds: map.setBounds,
        layout,
        node,
        route
    };
});
