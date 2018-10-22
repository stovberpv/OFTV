define([], function () {
    'use strict';

    function helper (bundle) {
        bundle.layout = (function () {
            return {
                set: (name, layout) => {
                    this.ymaps.layout.storage.add(`custom#${name}`,
                        this.ymaps.templateLayoutFactory.createClass(layout,
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
                get: name => this.ymaps.layout.storage.get(`custom#${name}`)
            };
        }).bind(bundle)();

        bundle.geoObjectsFactory = (function () {
            let self = this;
            return {
                Manager: (() => {
                    let _objectManager = new self.ymaps.ObjectManager({
                        clusterize:                  true,
                        clusterHasBalloon:           false,
                        geoObjectOpenBalloonOnClick: false
                    });
                    _objectManager.clusters.options.set({
                        iconColor: '#F4425F',
                        preset:    'islands#glyphCircleIcon'
                    });
                    _objectManager.objects.options.set('preset', 'islands#grayIcon');

                    return _objectManager;
                })(),
                Clusterer: (() => {
                    let options = () => {
                        let clusterIconContentLayout = self.ymaps.templateLayoutFactory.createClass(
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
                            clusterIcons:             [{ href: '', size: [30, 30], offset: [-15, -15] }],
                            clusterIconContentLayout: clusterIconContentLayout,
                            showInAlphabeticalOrder:  true,
                            hasBalloon:               false
                        };
                    };

                    return new self.ymaps.Clusterer(options());
                })(),
                Collection: (() => {
                    let options = () => {
                        return [];
                    };
                    return new self.ymaps.Collection(options());
                })(),
                DraggablePlacemark: (() => {
                    let _mark = null;
                    let _coords = null;
                    let _properties = {
                        iconCaption: 'Поиск адреса...',
                        iconContent: '',
                        external:    {}
                    };
                    let _options = {
                        iconColor: '#FFE100',
                        preset:    'islands#redCircleDotIconWithCaption', // blueStretchyIcon DotIconWithCaption
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
                        _mark = new self.ymaps.Placemark(_coords, _properties, _options);
                        _mark.events.add('dragend', _onDragged); // FIX :
                        self.map.geoObjects.add(_mark);
                    }
                    function move () {
                        if (!_mark) return;
                        _mark.properties.set('iconCaption', '');
                        _mark.geometry.setCoordinates([_coords[0], _coords[1]]);
                        self.ymaps.geocode([_coords[0], _coords[1]]).then(r => {
                            let geo = r.geoObjects.get(0);
                            let city = geo.getLocalities()[0];
                            let street = geo.getThoroughfare() || geo.getPremise() || '';
                            let hintContent = street ? `${city}, ${street}` : geo.geometry.getCoordinates();
                            _mark.properties.set({ hintContent: hintContent, iconCaption: '' });
                        }).catch(e => { });
                    }
                    function remove () {
                        if (!_mark) return;
                        self.map.geoObjects.remove(_mark);
                        _mark = null;
                    }
                    function setProp (prop) {
                        _properties.external = prop;

                        return this;
                    }

                    function init () {
                        self.map.events.add('click', e => {
                            let coords = e.get('coords');
                            setCoords(coords);
                            create();
                            move();
                        });
                    }

                    return { init, /* create, move, */ remove, /* setCoords, */ setProp };
                })(),
                EditablePolyline: (() => {
                    let _polyline = null;
                    let _points = {};
                    let _properties = { external: {} };
                    let _options = {
                        strokeColor:   ['FFF', 'FFE100'], // F4425F
                        strokeOpacity: [0.85, 1],
                        strokeStyle:   ['1 0', '1 2'], // Первая цифра - длина штриха. Вторая - длина разрыва.
                        strokeWidth:   [6, 4]
                    };

                    let points = {
                        each: cb => { for (let p in _points) { cb(_points[p]); } },
                        add:  p => { _points[p.id] = p.placemark; },
                        del:  p => { delete _points[p.id]; },
                        all:  () => getCoordinates()
                    };

                    function getCoordinates () {
                        let coordinates = [];
                        for (let p in _points) { coordinates.push(_points[p].geometry.getCoordinates()); }
                        return coordinates;
                    }

                    function create () {
                        if (_polyline) return;
                        _polyline = new self.ymaps.Polyline(getCoordinates(), _properties, _options);
                        self.map.geoObjects.add(_polyline);
                    }

                    function move () {
                        if (Object.keys(_points).length === 0) return;
                        _polyline.geometry.setCoordinates(getCoordinates());
                    }

                    function remove () {
                        if (!_polyline) return;
                        _points = {};
                        _polyline.geometry.setCoordinates([]);
                        self.map.geoObjects.remove(_polyline);
                        _polyline = null;
                    }

                    function setProp (prop) {
                        _properties.external = prop;
                    }

                    return { create, move, remove, setProp, points };
                })(),

                Polyline: opts => {
                    let properties = (properties => {
                        let data = {
                            hintContent:    properties.hintContent || null,
                            balloonContent: properties.balloonContent || null,
                            external:       properties.external || {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new self.ymaps.data.Manager(data);
                    })(opts.properties);

                    let options = (options => {
                        let data = {
                            /*
                            strokeColor: ['F4425F', 'FFFFFF'],
                            strokeOpacity: [1, 0.5],
                            strokeStyle: '5 2',  // Первая цифра - длина штриха. Вторая - длина разрыва.
                            strokeWidth: [5, 4]
                            */
                            strokeColor:          'F4425F',
                            strokeOpacity:        1,
                            strokeWidth:          4,
                            balloonContentLayout: options.balloonContentLayout || null
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return data;
                    })(opts.options);

                    return new self.ymaps.Polyline(opts.geometry, properties, options);
                },
                Placemark: opts => {
                    let properties = (properties => {
                        let data = {
                            iconCaption:          properties.iconCaption || null,
                            hintContent:          properties.hintContent || null,
                            balloonContent:       properties.balloonContent || null,
                            balloonContentHeader: properties.balloonContentHeader || null,
                            balloonContentBody:   properties.balloonContentBody || null,
                            balloonContentFooter: properties.balloonContentFooter || null,
                            clusterCaption:       properties.clusterCaption || null,
                            external:             properties.external || {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new self.ymaps.data.Manager(data);
                    })(opts.properties);

                    let options = (options => {
                        let data = {
                            iconColor:            '#F4425F',
                            preset:               'islands#glyphCircleIcon',
                            iconCaptionMaxWidth:  '150',
                            balloonContentLayout: options.balloonContentLayout || null
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return data;
                    })(opts.options);

                    return new self.ymaps.Placemark(opts.geometry, properties, options);
                }
            };
        }).bind(bundle)();

        return bundle;
    }

    return helper;
});
