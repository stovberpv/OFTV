define([], function () {
    'use strict';

    function Helper (ymaps) {
        let _map = null;

        this.map = {
            get: () => _map,
            attach: function (target) {
                let _stateConfig = { center: [44.914436, 34.085001], controls: ['zoomControl', 'typeSelector', 'rulerControl', 'searchControl'], zoom: 15 };
                let _optionsConfig = { suppressMapOpenBlock: true, searchControlProvider: 'yandex#search' };
                _map = new ymaps.Map(target, _stateConfig, _optionsConfig);
            },
            setBounds: function () {
                let bounds = _map.geoObjects.getBounds();
                bounds && _map.setBounds(bounds, { checkZoomRange: true });
            },
            events: {
                click: function (cb) { // TODO : graggablePlacemark.bind(this)
                    // function graggablePlacemark (e) { _draggblePlacemark.move(e.get('coords')); }
                    _map.events.add('click', cb);
                }
            },
            registerCustomControls: function (opts) {
                let button = new ymaps.control.Button({
                    data: {
                        content: opts.data.content || '',
                        image: opts.data.image || '',
                        title: opts.data.title || ''
                    },
                    options: {
                        maxWidth: opts.options.maxWidth || 150,
                        float: opts.options.float || 'left',
                        visible: opts.options.visible || true
                    },
                    state: {
                        enabled: opts.state.enabled || true
                    }
                });

                button.events.add('press', opts.cb);

                _map.controls.add(button);
            }
        };

        this.layout = {
            set: function (name, layout) {
                ymaps.layout.storage.add(`custom#${name}`,
                    ymaps.templateLayoutFactory.createClass(layout,
                        {
                            build: function () {
                                this.constructor.superclass.build.call(this);
                                let extProp = this.getData().properties;
                                try { extProp = extProp.get('external'); } catch (e) { extProp = extProp.external; }
                                Array.from(this.getElement().querySelectorAll('input')).forEach(i => {
                                    i.addEventListener('keyup', e => { extProp[e.target.name] = e.target.value; });
                                    extProp.editable
                                        ? i.removeAttribute('readonly')
                                        : i.setAttributeNode(document.createAttribute('readonly'));
                                });
                            }
                        }
                    ));
            },
            get: function (name) {
                return ymaps.layout.storage.get(`custom#${name}`);
            }
        };

        this.geoObjects = {
            Clusterer: (function Clusterer () {
                let options = () => {
                    let clusterIconContentLayout = ymaps.templateLayoutFactory.createClass(
                        `<div
                            style="
                                width: 30px;
                                height: 30px;
                                background-color: #F4425F;
                                border-radius: 100%;
                                border: 6px double #FFF;
                                color: #FFF;
                                font-weight: bold;
                                line-height: 30px;
                            ">
                            {{ properties.geoObjects.length }}
                        </div>`);

                    return {
                        // gridSize: 32,
                        clusterIcons: [{ href: '', size: [30, 30], offset: [-15, -15] }],
                        clusterIconContentLayout: clusterIconContentLayout,
                        showInAlphabeticalOrder: true,
                        hasBalloon: false
                    };
                };

                return new ymaps.Clusterer(options());
            })(),
            Manager: (function Manager () {
                let _objectManager = new ymaps.ObjectManager({
                    clusterize: true,
                    clusterHasBalloon: false,
                    geoObjectOpenBalloonOnClick: false
                });
                _objectManager.clusters.options.set({
                    iconColor: '#F4425F',
                    preset: 'islands#glyphCircleIcon'
                });
                _objectManager.objects.options.set('preset', 'islands#grayIcon');

                let getManager = () => { return _objectManager; };
                let addObject = object => { _objectManager.add(object); };
                let setEvent = (event, cb) => { _objectManager.objects.events.add(event, cb); };

                return {
                    getManager: getManager,
                    addObject: addObject,
                    setEvent: setEvent
                };
            })(),
            Collection: (function Collection () {
                let options = () => {
                    return [];
                };
                return new ymaps.Collection(options());
            })(),
            DraggablePlacemark: new function DraggablePlacemark () {
                let _mark = null;
                let _properties = { iconCaption: 'Поиск адреса...', iconContent: '', external: {} };
                let _options = { iconColor: '#FFE100', preset: 'islands#redCircleDotIconWithCaption', draggable: true }; // blueStretchyIcon DotIconWithCaption
                let onDragged = function (e) { this.move(e.originalEvent.target.geometry.getCoordinates()); };

                this.create = () => {
                    if (_mark) return;
                    _mark = new ymaps.Placemark([], _properties, _options);
                    _mark.events.add('dragend', onDragged.bind(this));
                    // _map.geoObjects.add(_mark); // TODO :
                    return _mark;
                };
                this.remove = () => {
                    if (!_mark) return;
                    // _map.geoObjects.remove(_mark); //  TODO :
                    _mark = null;
                };
                this.move = function (coords) {
                    if (!_mark) return;
                    _mark.properties.set('iconCaption', '');
                    _mark.geometry.setCoordinates([coords[0], coords[1]]);
                    ymaps.geocode([coords[0], coords[1]]).then(r => {
                        let geo = r.geoObjects.get(0);
                        let city = geo.getLocalities()[0];
                        let street = geo.getThoroughfare() || geo.getPremise() || '';
                        let hintContent = street ? `${city}, ${street}` : geo.geometry.getCoordinates();
                        _mark.properties.set({ hintContent: hintContent, iconCaption: '' });
                    }).catch(e => { });
                };
                this.setProp = prop => { _properties.external = prop; };

                return this;
            }(),
            EditablePolyline: (function EditablePolyline () { // TODO :
                /*
                let _polyline = null;
                let _points = {};

                function getCoordinates () {
                    let coordinates = [];
                    for (let p in _points) { coordinates.push(_points[p].geometry.getCoordinates()); }
                    return coordinates;
                }

                this.point = {
                    each: cb => { for (let p in _points) { cb(_points[p]); } },
                    add: p => { _points[p.id] = p.placemark; return this; },
                    del: p => { delete _points[p.id]; return this; },
                    all: () => getCoordinates()
                };

                this.reset = () => { _points = {}; _polyline.geometry.setCoordinates([]); return this; };

                this.render = () => {
                    if (Object.keys(_points).length === 0) return;
                    if (!_polyline) {
                        _polyline = new ym.Polyline(getCoordinates(),
                            {
                                external: {}
                            }, {
                                strokeColor: ['FFF', 'FFE100'], // F4425F
                                strokeOpacity: [0.85, 1],
                                strokeStyle: ['1 0', '1 2'], // Первая цифра - длина штриха. Вторая - длина разрыва.
                                strokeWidth: [6, 4]
                            });
                        // map.geoObjects.add(_polyline);
                    }

                    _polyline.geometry.setCoordinates(getCoordinates());

                    return this;
                };

                return this;
                */
            })(),
            create: {
                object: function (opts) {
                    let properties = content => {
                        let data = {
                            iconCaption: content.iconCaption ? content.iconCaption : null,
                            hintContent: content.hintContent ? content.hintContent : null,
                            balloonContent: content.balloonContent ? content.balloonContent : null,
                            balloonContentHeader: content.balloonContentHeader ? content.balloonContentHeader : null,
                            balloonContentBody: content.balloonContentBody ? content.balloonContentBody : null,
                            balloonContentFooter: content.balloonContentFooter ? content.balloonContentFooter : null,
                            balloonContentLayout: content.balloonContentLayout ? ymaps.templateLayoutFactory.createClass(content.balloonContentLayout) : null,
                            clusterCaption: content.clusterCaption ? content.clusterCaption : null,
                            external: content.external ? content.external : {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new ymaps.data.Manager(data);
                    };

                    let options = () => {
                        return {
                            iconColor: '#F4425F',
                            preset: 'islands#glyphCircleIcon',
                            iconCaptionMaxWidth: '150'
                        };
                    };

                    return {
                        type: 'Feature',
                        id: opts.id,
                        geometry: {
                            type: opts.type,
                            coordinates: opts.geometry
                        },
                        properties: properties(opts.content),
                        options: options()
                    };
                },
                Polyline: function (opts) {
                    let properties = (properties => {
                        let data = {
                            hintContent: properties.hintContent || null,
                            balloonContent: properties.balloonContent || null,
                            external: properties.external || {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new ymaps.data.Manager(data);
                    })(opts.properties);

                    let options = (options => {
                        let data = {
                            /*
                            strokeColor: ['F4425F', 'FFFFFF'],
                            strokeOpacity: [1, 0.5],
                            strokeStyle: '5 2',  // Первая цифра - длина штриха. Вторая - длина разрыва.
                            strokeWidth: [5, 4]
                            */
                            strokeColor: 'F4425F',
                            strokeOpacity: 1,
                            strokeWidth: 4,
                            balloonContentLayout: options.balloonContentLayout || null
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return data;
                    })(opts.options);

                    return new ymaps.Polyline(opts.geometry, properties, options);
                },
                Placemark: function (opts) {
                    let properties = (properties => {
                        let data = {
                            iconCaption: properties.iconCaption || null,
                            hintContent: properties.hintContent || null,
                            balloonContent: properties.balloonContent || null,
                            balloonContentHeader: properties.balloonContentHeader || null,
                            balloonContentBody: properties.balloonContentBody || null,
                            balloonContentFooter: properties.balloonContentFooter || null,
                            clusterCaption: properties.clusterCaption || null,
                            external: properties.external || {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new ymaps.data.Manager(data);
                    })(opts.properties);

                    let options = (options => {
                        let data = {
                            iconColor: '#F4425F',
                            preset: 'islands#glyphCircleIcon',
                            iconCaptionMaxWidth: '150',
                            balloonContentLayout: options.balloonContentLayout || null
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return data;
                    })(opts.options);

                    return new ymaps.Placemark(opts.geometry, properties, options);
                }
            },
            del: function (object) {
                _map.geoObjects.remove(object);
            },
            add: function (object) {
                _map.geoObjects.add(object);
            },
            get: function (index) {
                return index ? _map.geoObjects.get(index) : _map.geoObjects;
            },
            find: function (object) {
                let index = null;
                let isFound = {
                    status: false,
                    parent: null,
                    index: null
                };

                index = _map.geoObjects.indexOf(object);
                if (index !== -1) {
                    isFound.status = true;
                    isFound.parent = _map.geoObjects;
                    isFound.index = index;
                } else {
                    let objectCount = _map.geoObjects.getLength();
                    for (let i = 0; i < objectCount; i++) {
                        let geoObject = _map.geoObjects.get(i);
                        if (geoObject.options.getName() === 'clusterer') {
                            index = geoObject.getGeoObjects().indexOf(object);
                            if (index !== -1) {
                                isFound.status = true;
                                isFound.parent = geoObject;
                                isFound.index = index;
                                break;
                            }
                        }
                    }
                }

                return isFound;
            },
            getIndex: function (object) {
                return _map.geoObjects.indexOf(object);
            },
            getByName: function (opts) {
                let objectCount = _map.geoObjects.getLength();
                for (let i = 0; i < objectCount; i++) {
                    let geoObject = _map.geoObjects.get(i);
                    if (geoObject.options.getName() === opts.name) { return geoObject; }
                }
            },
            getByExternalProperty: function (opts) {
                let isFound = {
                    status: false,
                    parent: null,
                    child: null
                };
                let objectValue;
                let objectCount = _map.geoObjects.getLength();
                for (let i = 0; i < objectCount; i++) {
                    let geoObject = _map.geoObjects.get(i);

                    if (geoObject.options.getName() === 'clusterer') {
                        let objectCount = geoObject.getGeoObjects().length;
                        for (let i = 0; i < objectCount; i++) {
                            let clusteredGeoObject = geoObject.getGeoObjects()[i];
                            try { objectValue = clusteredGeoObject.properties.get('external')[opts.property]; } catch (e) { continue; }
                            if (objectValue === opts.value) {
                                isFound.status = true;
                                isFound.parent = geoObject;
                                isFound.child = clusteredGeoObject;
                                break;
                            }
                        }
                    } else if (geoObject.options.getName() === 'geoObject') {
                        try { objectValue = geoObject.properties.get('external')[opts.property]; } catch (e) { continue; }
                        if (objectValue === opts.value) {
                            isFound.status = true;
                            isFound.parent = _map.geoObjects;
                            isFound.child = geoObject;
                            break;
                        }
                    }
                }

                return isFound;
            },
            events: {
                set: function (event, cb) {
                    _map.geoObjects.events.add(event, cb);
                }
            }
        };

        return this;
    }

    return Helper;
});
