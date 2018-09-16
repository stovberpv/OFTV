define(['ymaps'], function (ymaps) {
    'use strict';

    function Ymap () {
        let _stateConfig = { center: [44.914436, 34.085001], controls: ['zoomControl', 'typeSelector', 'rulerControl', 'searchControl'], zoom: 15 };
        let _optionsConfig = { suppressMapOpenBlock: true, searchControlProvider: 'yandex#search' };

        let _maps = ymaps;
        let _map = null;
        let _draggblePlacemark = null;
        let _edittablePolyline = null;
        let _objectCollection = null;
        let _objectCluster = null;

        this.getMap = () => { return _map; };
        this.getEditablePolyline = () => { return _edittablePolyline; };
        this.getObjectCollection = () => { return _objectCollection; };
        this.getObjectCluster = () => { return _objectCluster; };

        this.load = async () => {
            return new Promise(async (resolve, reject) => {
                try { await ymaps.ready(); resolve(); } catch (e) { reject(); }
            });
        };

        this.attachTo = target => {
            _map = new ymaps.Map(target, _stateConfig, _optionsConfig);
        };

        this.showBounds = () => {
            let bounds = _map.geoObjects.getBounds();
            bounds && _map.setBounds(bounds, { checkZoomRange: true });
        };

        this.addLayout = (name, layout) => {
            ymaps.layout.storage.add(`custom#${name}`,
                ymaps.templateLayoutFactory.createClass(layout,
                    {
                        build: function () {
                            this.constructor.superclass.build.call(this);
                            let extProp = this.getData().properties.get('external');
                            Array.from(this.getElement().querySelectorAll('input')).forEach(i => {
                                i.addEventListener('keyup', e => { extProp[e.target.name] = e.target.value; });
                                extProp.editable
                                    ? i.removeAttribute('readonly')
                                    : i.setAttributeNode(document.createAttribute('readonly'));
                            });
                        }
                    }
                ));
        };

        this.getLayout = name => {
            return ymaps.layout.storage.get(`custom#${name}`);
        };

        this.createObject = opts => {
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
        };

        this.createObjectManager = opts => {
            function ObjectManager () {
                let _objectManager = null;

                this.getManager = () => { return _objectManager; };

                this.initialize = () => {
                    let objectManager = new ymaps.ObjectManager({
                        clusterize: true,
                        clusterHasBalloon: false,
                        geoObjectOpenBalloonOnClick: false
                    });
                    objectManager.clusters.options.set({
                        iconColor: '#F4425F',
                        preset: 'islands#glyphCircleIcon',
                        hintContentLayout: ymaps.templateLayoutFactory.createClass('Группа объектов')
                    });
                    objectManager.objects.options.set('preset', 'islands#grayIcon');

                    _objectManager = objectManager;

                    return this;
                };

                this.addObject = object => _objectManager.add(object);

                this.setEvent = (event, cb) => _objectManager.objects.events.add(event, cb);

                return this;
            }

            return new ObjectManager();
        };

        this.createPolyline = opts => {
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
        };

        this.createPlacemark = opts => {
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
        };

        this.removeGeoObject = object => {
            _map.geoObjects.remove(object);
        };

        this.addGeoObject = object => {
            return _map.geoObjects.add(object);
        };

        this.getGeoObject = index => {
            return index ? _map.geoObjects.get(index) : _map.geoObjects;
        };

        this.getGeoObjectIndex = object => {
            return _map.geoObjects.indexOf(object);
        };

        this.findGeoObjectIndex = object => {
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
        };

        this.findGeoObjectByName = opts => {
            let objectCount = _map.geoObjects.getLength();
            for (let i = 0; i < objectCount; i++) {
                let geoObject = _map.geoObjects.get(i);
                if (geoObject.options.getName() === opts.name) { return geoObject; }
            }
        };

        this.findGeoObjectByExternalProperty = opts => {
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
        };

        this.setGeoObjectEventHandler = (event, cb, context = null, args = null) => {
            _map.geoObjects.events.add(event, context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        };

        this.initializeObjectCluster = opts => {
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
                    // hasBalloon: false
                };
            };

            _objectCluster = new ymaps.Clusterer(options());

            _map.geoObjects.add(_objectCluster);
        };

        this.initializeObjectCollection = opts => {
            let options = () => {
                return [];
            };
            _objectCollection = new ymaps.Collection(options());

            _map.geoObjects.add(_objectCollection);
        };

        this.registerDraggablePlacemark = opts => {
            let map = _map;
            let ymaps = _maps;

            function Placemark (o) {
                let _mark = null;
                let _properties = { iconCaption: 'Поиск адреса...', iconContent: '', external: o.properties };
                let _options = { iconColor: '#FFE100', preset: 'islands#redCircleDotIconWithCaption', draggable: true }; // blueStretchyIcon DotIconWithCaption
                let onDragged = function (e) { this.move(e.originalEvent.target.geometry.getCoordinates()); };

                function initialize () {
                    if (_mark) return;
                    _mark = new ymaps.Placemark([], _properties, _options);
                    _mark.events.add('dragend', onDragged.bind(this));
                    o.onClicked && _mark.events.add('click', o.onClicked.bind(this));
                    map.geoObjects.add(_mark);
                };

                this.move = function (coords) {
                    initialize.bind(this)();
                    _mark.properties.set(_properties);
                    _mark.geometry.setCoordinates([coords[0], coords[1]]);
                    ymaps.geocode([coords[0], coords[1]]).then(r => {
                        let geo = r.geoObjects.get(0);
                        let city = geo.getLocalities()[0];
                        let street = geo.getThoroughfare() || geo.getPremise() || '';
                        let hintContent = street ? `${city}, ${street}` : geo.geometry.getCoordinates();
                        _mark.properties.set({ hintContent: hintContent, iconCaption: '' });
                    }, () => { });
                };

                return this;
            };
            _draggblePlacemark = new Placemark(opts);
        };

        this.registerEditablePolyline = opts => {
            let map = _map;
            let ymaps = _maps;

            function Polyline (o) {
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
                        _polyline = new ymaps.Polyline(getCoordinates(),
                            {
                                external: o.properties
                            }, {
                                strokeColor: ['FFF', 'FFE100'], // F4425F
                                strokeOpacity: [0.85, 1],
                                strokeStyle: ['1 0', '1 2'], // Первая цифра - длина штриха. Вторая - длина разрыва.
                                strokeWidth: [6, 4]
                            });
                        map.geoObjects.add(_polyline);
                    }

                    _polyline.geometry.setCoordinates(getCoordinates());

                    return this;
                };

                return this;
            }

            _edittablePolyline = new Polyline(opts);
        };

        this.registerCustomControls = opts => {
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

            this._map.controls.add(button);
        };

        this.registerMapGlobalEvents = opts => {
            function graggablePlacemark (e) { _draggblePlacemark.move(e.get('coords')); }

            _map.events.add('click', graggablePlacemark.bind(this));
        };

        return this;
    }

    return Ymap;
});
