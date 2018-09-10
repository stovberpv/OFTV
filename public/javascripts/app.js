define(['config/index', 'socket/index', 'ymap/index', 'node/index', 'route/index', 'utils/index', 'popup/index'], function (config, socket, ymap, node, route, utils, popup) {
    'use strict';

    /*
        TODO : Две точки с одинаковыми координатами - придумать реализацию, не сохранять или сохранять но как тогда удалять?
        FIX :
        NOTE :
        DEBUG :
    */
    function App () {
        let _config = config;
        let _socket = null;
        let _ymap = null;
        let _node = node;
        let _route = route;
        let _utils = utils;
        let _popup = popup;
        let _eventBus = null;

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
                    options: {
                        balloonContentLayout: _ymap.getLayout('node')
                    }
                });
            }

            function polyline (route) {
                return _ymap.createPolyline({
                    geometry: route.coordinatePath.get(),
                    properties: {
                        hintContent: route.routeDescription.get() || route.cableDescription.get(),
                        external: route.toPrimitive()
                    },
                    options: {
                        balloonContentLayout: _ymap.getLayout('route')
                    }
                });
            }

            return (networkResourceType, networkResourceObject) => {
                ('node' === networkResourceType) && (() => {
                    let clusterer = _ymap.getObjectCluster();
                    let mapObject = placemark(new Node(networkResourceObject));
                    clusterer.getGeoObjects().forEach(o => (o.properties.get('external').guid === mapObject.properties.get('external').guid) && clusterer.remove(o));
                    !mapObject.properties.get('external').isDeprecated && clusterer.add(mapObject);
                })();
                ('route' === networkResourceType) && (() => {
                    let collection = _ymap.getObjectCollection();
                    let mapObject = polyline(new Route(networkResourceObject));
                    collection.each(o => (o.properties.get('external').guid === mapObject.properties.get('external').guid) && collection.remove(o));
                    !mapObject.properties.get('external').isDeprecated && collection.add(mapObject);
                })();
            }
        })();

        // DEBUG _contextMenuHandler после реализации серверной части
        let _contextMenuHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;
            let ymap = _ymap;
            let utils = _utils.utils;
            let Popup = _popup.Popup;

            function createList (prop) {
                return [
                    ('node' === prop.type && !prop.routePoint) ? { id: 'check', text: 'Трасса: добавить' } : null,
                    ('node' === prop.type && prop.routePoint) ? { id: 'uncheck', text: 'Трасса: исключить' } : null,
                    ('node' === prop.type && prop.routePoint) ? { id: 'complete', text: 'Трасса: завершить' } : null,
                    (('node' === prop.type || 'route' === prop.type) && !prop.editable) ? { id: 'update', text: 'Редактировать описание' } : null,
                    ('node' === prop.type || 'route' === prop.type) ? { id: 'remove', text: 'Удалить' } : null,
                ];
            }

            return async e => {
                if ('cluster' === e.get('target').options.getName()) return;
                let target = e.get('target');
                let extProp = target.properties.get('external');
                let list = createList({ type: extProp.type, routePoint: extProp.routePoint, editable: extProp.editable });
                let clicked = await ymap.getContextMenu().setList(list).render().setPosition(e.get('pagePixels')).show().onClick('listmenu');
                const id = clicked.target.id;
                if ('check' === id) {
                    extProp.routePoint = true;
                    ymap.getEditablePolyline().addPlacemark({ id: extProp.guid, placemark: target }).render(ymap.getMap());
                } else if ('uncheck' === id) {
                    delete extProp.routePoint;
                    ymap.getEditablePolyline().delPlacemark({ id: extProp.guid }).render(ymap.getMap());
                } else if ('complete' === id) {
                    let ep = ymap.getEditablePolyline();
                    let placemarks = ep.getPlacemarkAll();
                    for (let p in placemarks) { delete placemarks[p].properties.get('external').routePoint }
                    let coordinatePath = ep.getCoordinates().reduce((p, c) => { return `${p} ${c}`; });
                    socket.getRoutes().emitNetworkResourcesUpdate(new Route({ coordinatePath: coordinatePath }).toPrimitive());
                    ep.reset();
                } else if ('update' === id) {
                    extProp.editable = true;
                    if ('node' === extProp.type) target.options.set('iconColor', '#FFE100'); else if ('route' === extProp.type) target.options.set('strokeColor', '#FFE100');
                    target.balloon.open();
                } else if ('remove' === id) {
                    let popup = new Popup()
                        .setTitle('Удалить соединение?')
                        .setButtons([{ title: 'Да', id: 'yes' }, { title: 'Нет', id: 'no' }])
                        .render()
                        .setEventListener('yes', () => { popup.close(); socket.getRoutes().emitNetworkResourcesRemove({ type: extProp.type, guid: extProp.guid }); })
                        .setEventListener('no', () => popup.close())
                        .show();
                    utils.setDraggable(popup.getDOM(), '.title');
                }
            };
        };

        // DEBUG _balloonOpenHandler после реализации серверной части
        let _balloonOpenHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;

            async function getNetworkResources (o) {
                let extProp = o.properties.get('external');
                if (!['node', 'route'].includes(extProp.type)) return;
                let fetch = new Promise(resolve => {
                    socket.getRoutes().onNetworkResources(r => resolve(r))
                    socket.getRoutes().emitNetworkResources({ type: extProp.type, guid: extProp.guid });
                });
                fetch.then(result => {
                    let data = ('node' === extProp.type) ? Node(result) : (('route' === extProp.type) && Route(result));
                    Object.assign(extProp, data.toPrimitive());
                }, () => {});
            }

            return e => (e.get('cluster') ? e.get('cluster').getGeoObjects() : [e.get('target')]).forEach(o => getNetworkResources(o));
        };

        // DEBUG _balloonCloseHandler после реализации серверной части
        let _balloonCloseHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let Popup = _popup.Popup;
            let utils = _utils.utils;
            let socket = _socket.getRoutes();

            function prompt () {
                return new Promise((resolve, reject) => {
                    let popup = new Popup()
                        .setTitle('Сохранить изменения?')
                        .setButtons([{ title: 'Сохранить', id: 'save' }, { title: 'Отменить', id: 'close' }])
                        .render()
                        .setEventListener('save', () => { popup.close(); resolve() })
                        .setEventListener('close', () => { popup.close(); reject(); })
                        .show();
                    utils.setDraggable(popup.getDOM(), '.title');
                });
            }

            return async e => {
                if (e.get('cluster')) return;
                let target = e.get('target');
                let extProp = target.properties.get('external');

                switch (extProp.type) {
                    case 'node':
                        if (extProp.editable) {
                            prompt().then(() => {
                                socket.emitNetworkResourcesUpdate(new Node(extProp).toPrimitive());
                                extProp.editable = false;
                                target.options.set('iconColor', '#F4425F');
                            }, () => {});
                        }
                        return;

                    case 'route':
                        if (extProp.editable) {
                            prompt().then(() => {
                                socket.emitNetworkResourcesUpdate(new Route(extProp).toPrimitive());
                                extProp.editable = false;
                                target.options.set('strokeColor', '#F4425F');
                            }, () => {});
                        }
                        return;

                    case 'blueprint':
                        // TODO :
                        break;

                    default:
                        break;
                }
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
                _socket.getRoutes().onConnect(() => console.log('Established socket connection with a server'));
                /* TODO _socket.getRoutes() запрос, обновление, удаление ресурсов
                _socket.getRoutes().onNetworkResources();
                _socket.getRoutes().onNetworkResourcesUpdated();
                _socket.getRoutes().onNetworkResourcesRemoved();
                */
            })();

            await (() => { // initialize ymap
                _ymap = new ymap.Ymap();
                return new Promise(async (resolve, reject) => {
                    try { await _ymap.load() } catch (e) { reject(e); }
                    _ymap.attachTo('map');
                    _ymap.addLayout('route', _route.view.render());
                    _ymap.addLayout('node', _node.view.render());
                    _ymap.initializeObjectCluster();
                    _ymap.initializeObjectCollection();
                    // FIX :
                    _ymap.initializeDraggablePlacemark({ properties: { external: { type: 'blueprint', editable: true } } });
                    _ymap.initializeEditablePolyline({ properties: { external: { type: 'blueprint' } } });

                    _ymap.initializeContextMenu();
                    _ymap.initializeMapGlobalEvents();
                    _ymap.getObjectCluster()
                    _ymap.setGeoObjectEventHandler('contextmenu', _contextMenuHandler());
                    _ymap.setGeoObjectEventHandler('balloonopen', _balloonOpenHandler());
                    _ymap.setGeoObjectEventHandler('balloonclose', _balloonCloseHandler());

                    resolve();
                });
            })();

            (() => { // data processing
                // TODO _socket.getRoutes().emitNetworkResources Обработать ресурсы
                _socket.getRoutes().emitNetworkResources();

                // test run
                let nodes = [
                    { guid: 'N10000000000000000000000000000N1', name: 'node-1', description: '', coordinates: [44.909866, 34.076351] },
                    { guid: 'N20000000000000000000000000000N2', name: 'node-2', description: '', coordinates: [44.908864, 34.074770] },
                    { guid: 'N30000000000000000000000000000N3', name: 'node-3', description: '', coordinates: [44.911213, 34.074015] },
                    { guid: 'N40000000000000000000000000000N4', name: 'node-4', description: '', coordinates: [44.909106, 34.080851] },
                    { guid: 'N50000000000000000000000000000N5', name: 'node-5', description: '', coordinates: [44.916109, 34.087795] },
                ];
                nodes.forEach(node => _transposeDataOnMap('node', node));
                let routes = [
                    { guid: 'R10000000000000000000000000000R1', coordinatePath: [[44.909866, 34.076351], [44.916109, 34.087795]], routeDescription: 'route-1', cableDescription: 'ceble-1', cablelabelA: '1', cablelabelB: '2', cablelength: '2', cableCores: '1', cableType: '' },
                    { guid: 'R20000000000000000000000000000R2', coordinatePath: [[44.908864, 34.074770], [44.911213, 34.074015]], routeDescription: 'route-2', cableDescription: 'ceble-2', cablelabelA: '2', cablelabelB: '3', cablelength: '2', cableCores: '2', cableType: '' },
                    { guid: 'R30000000000000000000000000000R3', coordinatePath: [[44.908864, 34.074770], [44.909106, 34.080851]], routeDescription: 'route-3', cableDescription: 'ceble-3', cablelabelA: '3', cablelabelB: '4', cablelength: '2', cableCores: '3', cableType: '' },
                    { guid: 'R40000000000000000000000000000R4', coordinatePath: [[44.909106, 34.080851], [44.916109, 34.087795]], routeDescription: 'route-4', cableDescription: 'ceble-4', cablelabelA: '4', cablelabelB: '5', cablelength: '2', cableCores: '4', cableType: '' },
                    { guid: 'R50000000000000000000000000000R5', coordinatePath: [[44.909106, 34.080851], [44.909866, 34.076351]], routeDescription: 'route-5', cableDescription: 'ceble-5', cablelabelA: '5', cablelabelB: '6', cablelength: '2', cableCores: '5', cableType: '' }
                ]
                routes.forEach(route => _transposeDataOnMap('route', route));

                _transposeDataOnMap('node', { guid: 'N10000000000000000000000000000N1', isDeprecated: true, name: 'node-1-1', description: '', coordinates: [44.909866, 34.076351] });
                _transposeDataOnMap('node', { guid: 'N10000000000000000000000000000N1', isDeprecated: false, name: 'node-1-2', description: '', coordinates: [44.909866, 34.076351] });
                _transposeDataOnMap('node', { guid: 'N10000000000000000000000000000N6', isDeprecated: false, name: 'node-1-3', description: '', coordinates: [44.909866, 34.076351] });
            })();

            (() => { // post config
                _ymap.showBounds();
            })();

        };

        return this;
    }

    return App;
});
