define(['ymaps', 'utils/index'], function (ymaps, utils) {
    'use strict';

    function Ymap () {
        let _stateConfig = { center: [44.914436, 34.085001], controls: ['zoomControl', 'typeSelector', 'rulerControl'], zoom: 15 };  //44.952116, 34.102411
        let _optionsConfig = { suppressMapOpenBlock: true, searchControlProvider: 'yandex#search' };

        let _ymap = null;
        let _draggblePlacemark = null;
        let _contextMenu = null;
        let _edittablePolyline = null;
        let _objectCollection = null;
        let _objectCluster = null;

        this.getMap = () => { return _ymap; };
        this.getContextMenu = () => { return _contextMenu; };
        this.getEditablePolyline = () => { return _edittablePolyline; };
        this.getObjectCollection = () => { return _objectCollection; }
        this.getObjectCluster = () => { return _objectCluster; }

        this.load = async () => {
            return new Promise(async (resolve, reject) => {
                try { await ymaps.ready(); resolve(); } catch (e) { reject(); }
            });
        };

        this.attachTo = target => {
            _ymap = new ymaps.Map(target, _stateConfig, _optionsConfig);
        }

        this.showBounds = () => {
            let bounds = _ymap.geoObjects.getBounds();
            bounds && _ymap.setBounds(bounds, { checkZoomRange: true });
        }

        this.addLayout = (name, layout) => {
            ymaps.layout.storage.add(`custom#${name}`, ymaps.templateLayoutFactory.createClass(layout));
        }

        this.getLayout = name => {
            return ymaps.layout.storage.get(`custom#${name}`);
        }

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
            }
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
                    balloonContentLayout: options.balloonContentLayout || null,
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
                    balloonContentLayout: options.balloonContentLayout || null,
                };

                for (let k in data) if (!data[k]) delete data[k];

                return data;
            })(opts.options);

            return new ymaps.Placemark(opts.geometry, properties, options);
        };

        this.removeGeoObject = object => {
            _ymap.geoObjects.remove(object);
        };

        this.addGeoObject = object => {
            return _ymap.geoObjects.add(object);
        };

        this.getGeoObject = index => {
            return index ? _ymap.geoObjects.get(index) : _ymap.geoObjects;
        };

        this.getGeoObjectIndex = object => {
            return _ymap.geoObjects.indexOf(object);
        };

        this.findGeoObjectIndex = object => {
            let index = null;
            let isFound = {
                status: false,
                parent: null,
                index: null
            };

            index = _ymap.geoObjects.indexOf(object);
            if (index !== -1) {
                isFound.status = true;
                isFound.parent = _ymap.geoObjects;
                isFound.index = index;
            } else {
                let objectCount = _ymap.geoObjects.getLength();
                for (let i = 0; i < objectCount; i++) {
                    let geoObject = _ymap.geoObjects.get(i);
                    if (geoObject.options.getName() === _geoObjectNamesList.CLUSTERER) {
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
            let objectCount = _ymap.geoObjects.getLength();
            for (let i = 0; i < objectCount; i++) { if (_ymap.geoObjects.get(i).options.getName() === opts.name) { return geoObject; } }
        };

        this.findGeoObjectByExternalProperty = opts => {
            let isFound = {
                status: false,
                parent: null,
                child: null
            };
            let objectValue
            let objectCount = _ymap.geoObjects.getLength();
            for (let i = 0; i < objectCount; i++) {
                let geoObject = _ymap.geoObjects.get(i);

                if (geoObject.options.getName() === _geoObjectNamesList.CLUSTERER) {
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
                        isFound.parent = _ymap.geoObjects;
                        isFound.child = geoObject;
                        break;
                    }
                }
            }

            return isFound;
        };

        this.setGeoObjectEventHandler = (event, cb, context = null, args = null) => {
            _ymap.geoObjects.events.add(event, context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
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
                    clusterIcons: [{ href: '', size: [30, 30], offset: [-15, -15] }],
                    clusterIconContentLayout: clusterIconContentLayout,
                    // clusterDisableClickZoom: true,
                    showInAlphabeticalOrder: true
                };
            };

            _objectCluster = new ymaps.Clusterer(options());

            _ymap.geoObjects.add(_objectCluster);
        };

        this.initializeObjectCollection = opts => {
            let options = () => {
                return [];
            };
            _objectCollection = new ymaps.Collection(options());

            _ymap.geoObjects.add(_objectCollection);
        };

        // FIX 
        this.initializeDraggablePlacemark = opts => {
            function Mark (o) {
                let mark = null;
                let loca = { ciry: '', street: '', house: '', latitude: null, longitude: null }; // localities
                let prop = { iconCaption: 'Поиск адреса...', iconContent: '', external: o.properties.external };
                let opts = { iconColor: '#F4425F', preset: 'islands#redCircleDotIconWithCaption', draggable: true }; //  blueStretchyIcon DotIconWithCaption

                let hint = function () { return { iconCaption: 'Зафиксировать' /* 'Новая точка', balloonContent: balloonContent() */ }; };
                let onGeocoded = function (e) { let geo = e.geoObjects.get(0); loca.city = geo.getLocalities()[0]; loca.street = geo.getThoroughfare() || geo.getPremise() || ''; this.get().properties.set(hint()); };
                let balloonContent = function () { return `<div class='draggable-placemark wrapper'><div class='name'><label>Адрес</label><input type='text' value='${loca.city}, ${loca.street}'></div><div class='coordinates hidden'><label>Координаты</label><input type='text' value='${loca.longitude},${loca.latitude}'></div></div>`; };

                this.init = function (coords) { loca.longitude = coords[0]; loca.latitude = coords[1]; return this; };
                this.create = function () { mark = new ymaps.Placemark([loca.longitude, loca.latitude], prop, opts); return this; };
                this.get = function () { return mark; };
                this.move = function () { this.get().geometry.setCoordinates([loca.longitude, loca.latitude]); this.find(); };
                this.find = function () { this.get().properties.set(prop); ymaps.geocode([loca.longitude, loca.latitude]).then(onGeocoded.bind(this)); };
                this.onDragged = function (cb) { this.get().events.add('dragend', cb.bind(this)); return this; };
                this.onClicked = function (cb) { this.get().events.add('click', cb.bind(this)); return this; };

                return this;
            };

            _draggblePlacemark = new Mark(opts);
        };

        this.initializeEditablePolyline = opts => {
            function Polyline () {
                let _polyline = null;
                let _placemarks = {};

                function getCoordinates () {
                    let coordinates = [];
                    for (let k in _placemarks) { coordinates.push(_placemarks[k].geometry.getCoordinates()); }
                    return coordinates;
                }

                this.getPolyline = () => { return _polyline; };
                this.getCoordinates = () => { return getCoordinates(); };
                this.addPlacemark = opts => { _placemarks[opts.id] = opts.placemark; return this; };
                this.delPlacemark = opts => { delete _placemarks[opts.id]; return this; };
                this.getPlacemarkAll = () => { return _placemarks };
                this.reset = () => { _placemarks = {}; _polyline.geometry.setCoordinates([]); return this; };

                this.render = ymap => {
                    if (Object.keys(_placemarks).length === 0) return;
                    if (!_polyline) {
                        _polyline = new ymaps.Polyline(getCoordinates(),
                            {
                                external: opts.properties.external
                            },
                            {
                                strokeColor: ['FFF', 'F4425F'],
                                strokeOpacity: [.85, 1],
                                strokeStyle: ['1 0', '1 2'],  // Первая цифра - длина штриха. Вторая - длина разрыва.
                                strokeWidth: [6, 4]
                            });
                        ymap.geoObjects.add(_polyline);
                    }

                    _polyline.geometry.setCoordinates(getCoordinates());

                    return this;
                };

                return this;
            }

            _edittablePolyline = new Polyline();
        };

        this.initializeCustomControls = opts => {
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

            this._ymap.controls.add(button);
        };

        this.initializeContextMenu = opts => {
            function ContextMenu () {
                let _id = null;
                let _contextMenu = null;
                let _caller = null;
                let _listMenu = null;

                function createView () {
                    let menuContent =
                        `<div id='contextmenu-${_id}' class='contextmenu'>
                            <ul id='listmenu'>
                                ${_listMenu ? _listMenu : ''}
                            </ul>
                        </div>`.replace(/\s\s+/gmi, '');
                    let template = document.createElement('template');
                    template.innerHTML = menuContent;

                    return template.content.firstChild;
                };

                this.get = () => {
                    return _contextMenu;
                };

                this.setList = listMenu => {
                    let l = '';
                    listMenu.forEach(e => e && (l += `<li id='${e.id}'>${e.text}</li>`));
                    _listMenu = l;

                    return this;
                };

                this.setCaller = target => {
                    _caller = target;

                    return this;
                };

                this.getCaller = () => {
                    return _caller;
                };

                this.setPosition = coords => {
                    _contextMenu.style.left = `${coords[0]}px`;
                    _contextMenu.style.top = `${coords[1]}px`;

                    return this;
                }

                this.render = () => {
                    if (_contextMenu) return this;

                    _id = Math.floor(Math.random() * 100000);

                    document.body.appendChild(createView());
                    _contextMenu = document.querySelector(`#contextmenu-${_id}`);

                    return this;
                };

                this.show = () => {
                    _contextMenu && _contextMenu.classList.add('visible');

                    return this;
                };

                this.hide = e => {
                    _contextMenu && _contextMenu.classList.remove('visible');

                    return this;
                };

                this.close = e => {
                    if (!_contextMenu) return;
                    try { _contextMenu.parentNode.removeChild(_contextMenu); } catch (e) { console.log(e); }
                    _contextMenu = null;
                };

                this.onClick = menuElement => {
                    if (!_contextMenu) return;
                    let self = this;

                    let target = _contextMenu.querySelector(`#${menuElement}`);
                    return new Promise((resolve, reject) => {
                        if (!target) reject(new Error(`${menuElement} not found!`));
                        target.addEventListener('click', e => { self.hide().close(); resolve(e); });
                    });
                };

                return this;
            }

            _contextMenu = new ContextMenu();
        };

        this.initializeMapGlobalEvents = opts => {
            function closeContextMenu (e) { _contextMenu.hide(e); _contextMenu.close(e); }

            function graggablePlacemark (e) {
                _draggblePlacemark.init(e.get('coords'));
                if (_draggblePlacemark.get()) {
                    _draggblePlacemark.move();
                } else {
                    _draggblePlacemark.create();
                    _draggblePlacemark.onDragged(function (e) { this.init(e.originalEvent.target.geometry.getCoordinates()).find(); });
                    _draggblePlacemark.find();
                    _ymap.geoObjects.add(_draggblePlacemark.get());
                }
            }

            _ymap.events.add('click', graggablePlacemark.bind(this));
            _ymap.events.add('click', closeContextMenu.bind(this));
            _ymap.events.add('mousedown', closeContextMenu.bind(this));
        };

        return this;
    }

    return Ymap;
});
