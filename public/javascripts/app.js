define(['socket/index', 'ymap/index', 'node/index', 'route/index', 'utils/index', 'popup/index'], function (socket, ymap, node, route, utils, popup) {
    'use strict';

    /*
        TODO :
                1.      Две точки с одинаковыми координатами - придумать реализацию, не сохранять или сохранять но как тогда удалять?
                2.      При построении маршрута трассы, если последняя точка != начальная - позволять начальную точку добавить в маршрут
                3. +    _socket.routes.emitNetworkResources Обработать ресурсы
                4.      _socket.routes запрос, обновление, удаление ресурсов
                5.      удалять draggableplacemark после сохранения
                6.      _socket.routes.onNetworkResourcesUpdated();
                7.      _socket.routes.onNetworkResourcesRemoved();
        FIX :
                1.      ymaps не отображается searchControlProvider
                2. +    _ymap.showBounds(); вызывать после загрузки всех ресурсов по сокету
                3.
        NOTE :
                1.
                2.
                3.
        DEBUG :
                1.      _contextMenuHandler после реализации серверной части
                2. +    _balloonOpenHandler после реализации серверной части
                3.      _balloonCloseHandler после реализации серверной части
    */
    function App () {
        let _eventBus = null;
        let _socket = null;
        let _ymap = null;
        let _node = node;
        let _route = route;
        let _utils = utils;
        let _popup = popup;

        let _transposeDataOnMap = (() => {
            let Node = _node.Node;
            let Route = _route.Route;

            function placemark (node) {
                return _ymap.createPlacemark({
                    geometry: node.coordinates.get(),
                    properties: {
                        iconCaption: node.name.get(),
                        hintContent: node.description.get(),
                        clusterCaption: node.name.get(),
                        external: node.toPrimitive()
                    },
                    options: { balloonContentLayout: _ymap.getLayout('node') }
                });
            }

            function polyline (route) {
                return _ymap.createPolyline({
                    geometry: route.coordinatePath.get(),
                    properties: {
                        hintContent: route.routeDescription.get() || route.cableDescription.get(),
                        external: route.toPrimitive()
                    },
                    options: { balloonContentLayout: _ymap.getLayout('route') }
                });
            }

            return (networkResourceType, networkResourceObject) => {
                (networkResourceType === 'node') && (() => {
                    let clusterer = _ymap.getObjectCluster();
                    let mapObject = placemark(new Node(networkResourceObject));
                    clusterer.getGeoObjects().forEach(o => (o.properties.get('external').guid === mapObject.properties.get('external').guid) && clusterer.remove(o));
                    !mapObject.properties.get('external').isDeprecated && clusterer.add(mapObject);
                })();
                (networkResourceType === 'route') && (() => {
                    let collection = _ymap.getObjectCollection();
                    let mapObject = polyline(new Route(networkResourceObject));
                    collection.each(o => (o.properties.get('external').guid === mapObject.properties.get('external').guid) && collection.remove(o));
                    !mapObject.properties.get('external').isDeprecated && collection.add(mapObject);
                })();
            };
        })();

        let _contextMenuHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;
            let ymap = _ymap;
            let utils = _utils.utils;
            let Popup = _popup.Popup;

            function createList (prop) {
                return [
                    (prop.type === 'node' && !prop.routePoint) && { id: 'check', text: 'Трасса: добавить' },
                    (prop.type === 'node' && prop.routePoint) && { id: 'uncheck', text: 'Трасса: исключить' },
                    (prop.type === 'node' && prop.routePoint) && { id: 'complete', text: 'Трасса: завершить' },
                    ((prop.type === 'node' || prop.type === 'route') && !prop.editable) && { id: 'update', text: 'Редактировать описание' },
                    (prop.type === 'node' || prop.type === 'route') && { id: 'remove', text: 'Удалить' },
                    (prop.type === 'node blueprint') && { id: 'fix', text: 'Зафиксировать' }
                ];
            }

            return async e => {
                if (e.get('target').options.getName() === 'cluster') return;
                let target = e.get('target');
                let extProp = target.properties.get('external');
                let list = createList({ type: extProp.type, routePoint: extProp.routePoint, editable: extProp.editable });
                let clicked = await ymap.getContextMenu().setList(list).render().setPosition(e.get('pagePixels')).show().onClick('listmenu');
                const id = clicked.target.id;
                if (id === 'check') {
                    extProp.routePoint = true;
                    ymap.getEditablePolyline().point.add({ id: extProp.guid, placemark: target }).render();
                } else if (id === 'uncheck') {
                    delete extProp.routePoint;
                    ymap.getEditablePolyline().point.del({ id: extProp.guid }).render();
                } else if (id === 'complete') {
                    let ep = ymap.getEditablePolyline();
                    let coordinatePath = ep.point.all();
                    ep.point.each(p => delete p.properties.get('external').routePoint);
                    ep.reset();
                    socket.routes.emitNetworkResourcesCreate(new Route({ coordinatePath: coordinatePath }).toPrimitive());
                } else if (id === 'update') {
                    extProp.editable = true;
                    if (extProp.type === 'node') target.options.set('iconColor', '#FFE100');
                    else if (extProp.type === 'route') target.options.set('strokeColor', '#FFE100');
                    target.balloon.open();
                } else if (id === 'remove') {
                    let popup = new Popup()
                        .setTitle('Удалить соединение?')
                        .setButtons([{ title: 'Да', id: 'yes' }, { title: 'Нет', id: 'no' }])
                        .render()
                        .setEventListener('yes', () => { popup.close(); socket.routes.emitNetworkResourcesRemove({ type: extProp.type, guid: extProp.guid }); })
                        .setEventListener('no', () => popup.close())
                        .show();
                    utils.setDraggable(popup.getDOM(), '.title');
                } else if (id === 'fix') {
                    let prompt = new Promise((resolve, reject) => {
                        let popup = new Popup()
                            .setTitle('Зафиксировать как узел?')
                            .setButtons([{ title: 'Да', id: 'yes' }, { title: 'Нет', id: 'no' }])
                            .render()
                            .setEventListener('yes', () => { popup.close(); resolve(); })
                            .setEventListener('no', () => { popup.close(); reject(); })
                            .show();
                        utils.setDraggable(popup.getDOM(), '.title');
                    });
                    prompt.then(() => {
                        socket.routes.emitNetworkResourcesCreate(new Node({ coordinates: target.geometry.getCoordinates() }).toPrimitive());
                    }, () => { });
                }
            };
        };

        let _balloonOpenHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;

            async function getNetworkResources (o) {
                let extProp = o.properties.get('external');
                if (!['node', 'route'].includes(extProp.type)) return;
                socket.getSocket().emit('network resource read', { type: extProp.type, guid: extProp.guid }, r => {
                    let data = (extProp.type === 'node') ? new Node(r) : ((extProp.type === 'route') && new Route(r));
                    Object.assign(extProp, data.toPrimitive());
                });
            }

            return e => (e.get('cluster') ? e.get('cluster').getGeoObjects() : [e.get('target')]).forEach(o => getNetworkResources(o));
        };

        let _balloonCloseHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let Popup = _popup.Popup;
            let utils = _utils.utils;
            let socket = _socket.routes;

            function prompt () {
                return new Promise((resolve, reject) => {
                    let popup = new Popup()
                        .setTitle('Сохранить изменения?')
                        .setButtons([{ title: 'Да', id: 'yes' }, { title: 'Нет', id: 'no' }])
                        .render()
                        .setEventListener('yes', () => { popup.close(); resolve(); })
                        .setEventListener('no', () => { popup.close(); reject(); })
                        .show();
                    utils.setDraggable(popup.getDOM(), '.title');
                });
            }

            return async e => {
                if (e.get('cluster')) return;
                let target = e.get('target');
                let extProp = target.properties.get('external');
                if (!extProp.editable) return;
                prompt().then(() => {
                    if (extProp.type === 'node') {
                        socket.emitNetworkResourcesUpdate(new Node(extProp).toPrimitive());
                        extProp.editable = false;
                        target.options.set('iconColor', '#F4425F');
                    } else if (extProp.type === 'route') {
                        socket.emitNetworkResourcesUpdate(new Route(extProp).toPrimitive());
                        extProp.editable = false;
                        target.options.set('strokeColor', '#F4425F');
                    }
                }, () => { });
            };
        };

        this.run = async () => {
            (() => { // initialize event bus
                _eventBus = new utils.EventBus();
                _eventBus.initialize();
            })();

            (() => { // initialize socket
                _socket = new socket.Socket();
                _socket.connect();
                _socket.initializeRoutes();
                _socket.routes.onConnect(() => console.log('Established socket connection with a server'));
            })();

            await (() => { // initialize ymap
                _ymap = new ymap.Ymap();
                return new Promise(async (resolve, reject) => {
                    try { await _ymap.load(); } catch (e) { reject(e); }
                    _ymap.attachTo('map');
                    _ymap.addLayout('route', _route.view.render());
                    _ymap.addLayout('node', _node.view.render());
                    _ymap.initializeObjectCluster();
                    _ymap.initializeObjectCollection();
                    _ymap.registerDraggablePlacemark({ properties: { type: 'node blueprint' } });
                    _ymap.registerEditablePolyline({ properties: { type: 'route blueprint' } });
                    _ymap.initializeContextMenu();
                    _ymap.initializeMapGlobalEvents();
                    _ymap.getObjectCluster();
                    _ymap.setGeoObjectEventHandler('contextmenu', _contextMenuHandler());
                    _ymap.setGeoObjectEventHandler('balloonopen', _balloonOpenHandler());
                    _ymap.setGeoObjectEventHandler('balloonclose', _balloonCloseHandler());

                    resolve();
                });
            })();

            (() => { // data processing
                _socket.routes.onNetworkResources(r => {
                    r.data.forEach(d => _transposeDataOnMap(r.type, d));
                    _ymap.showBounds();
                });
                _socket.routes.emitNetworkResources({ type: 'node' });
                _socket.routes.emitNetworkResources({ type: 'route' });
            })();

            (() => { // post config
            })();
        };

        return this;
    }

    return App;
});
