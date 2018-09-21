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

                return _objectManager;
            })(),
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
            Collection: (function Collection () {
                let options = () => {
                    return [];
                };
                return new ymaps.Collection(options());
            })(),
            DraggablePlacemark: new function DraggablePlacemark () {
                let _mark = null;
                let _coords = null;
                let _properties = { iconCaption: 'Поиск адреса...', iconContent: '', external: {} };
                let _options = { iconColor: '#FFE100', preset: 'islands#redCircleDotIconWithCaption', draggable: true }; // blueStretchyIcon DotIconWithCaption
                let onDragged = function (e) { this.setCoords(e.originalEvent.target.geometry.getCoordinates()).move(); };

                this.setCoords = coords => {
                    _coords = coords;

                    return this;
                };

                this.create = () => {
                    if (!_mark) {
                        _mark = new ymaps.Placemark(_coords, _properties, _options);
                        _mark.events.add('dragend', onDragged.bind(this));
                        _map.geoObjects.add(_mark);
                    }

                    return this;
                };

                this.move = function () {
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
                };

                this.remove = () => {
                    if (!_mark) return;
                    _map.geoObjects.remove(_mark);
                    _mark = null;
                };

                this.setProp = prop => { _properties.external = prop; };

                return this;
            }(),
            EditablePolyline: new function EditablePolyline () {
                let _polyline = null;
                let _points = {};
                let _properties = { external: {} };
                let _options = {
                    strokeColor: ['FFF', 'FFE100'], // F4425F
                    strokeOpacity: [0.85, 1],
                    strokeStyle: ['1 0', '1 2'], // Первая цифра - длина штриха. Вторая - длина разрыва.
                    strokeWidth: [6, 4]
                };

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

                this.create = () => {
                    if (!_polyline) {
                        _polyline = new ymaps.Polyline(getCoordinates(), _properties, _options);
                        _map.geoObjects.add(_polyline);
                    }

                    return this;
                };

                this.move = () => {
                    if (Object.keys(_points).length === 0) return;
                    _polyline.geometry.setCoordinates(getCoordinates());

                    return this;
                };

                this.remove = () => {
                    if (!_polyline) return;
                    _points = {};
                    _polyline.geometry.setCoordinates([]);
                    _map.geoObjects.remove(_polyline);
                    _polyline = null;
                };

                this.setProp = prop => { _properties.external = prop; };

                return this;
            }(),
            create: {
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
            }
        };

        return this;
    }

    return Helper;
});
