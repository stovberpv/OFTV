define(['config/index', 'socket/index', 'ymap/index', 'node/index', 'route/index', 'utils/index', 'popup/index'], function (config, socket, ymap, node, route, utils, popup) {
    'use strict';

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
                    geometry: node.getPropertу('coordinates'),
                    properties: {
                        iconCaption: node.getPropertу('name'),
                        hintContent: node.getPropertу('description'),
                        balloonContent: node.getView().render('html'),
                        clusterCaption: node.getPropertу('name'),
                        external: { type: 'node', guid: node.getGuid(), isDeprecated: node.getIsDeprecated() }
                    }
                });
            }

            function polyline (route) {
                return _ymap.createPolyline({
                    geometry: route.getPropertу('coordinatePath'),
                    properties: {
                        hintContent: route.getPropertу('routeDescription') || route.getPropertу('cableDescription'),
                        balloonContent: route.getView().render('html'),
                        external: { type: 'route', guid: route.getGuid(), isDeprecated: route.getIsDeprecated() }
                    }
                });
            }

            return (networkResourceType, networkResourceObject) => {
                (networkResourceType === 'node') && (() => {
                    let clusterer = _ymap.getObjectCluster();
                    let mapObject = placemark(new Node().create(networkResourceObject));
                    clusterer.getGeoObjects().forEach(o => (o.properties.get('external').guid === mapObject.properties.get('external').guid) && clusterer.remove(o));
                    !mapObject.properties.get('external').isDeprecated && clusterer.add(mapObject);
                })();
                (networkResourceType === 'route') && (() => {
                    let collection = _ymap.getObjectCollection();
                    let mapObject = polyline(new Route().create(networkResourceObject));
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
                    (prop.type === 'node' && !prop.routePoint) ? { id: 'check', text: 'Трасса: добавить' } : null,
                    (prop.type === 'node' && prop.routePoint) ? { id: 'uncheck', text: 'Трасса: исключить' } : null,
                    (prop.type === 'node' && prop.routePoint) ? { id: 'complete', text: 'Трасса: завершить' } : null,
                    (prop.type === 'node' || prop.type === 'route') && { id: 'update', text: 'Редактировать описание' },
                    (prop.type === 'node' || prop.type === 'route') && { id: 'remove', text: 'Удалить' },
                ];
            }

            return async e => {
                if (e.get('target').options.getName() === 'cluster') return;
                let target = e.get('target');
                let extProp = target.properties.get('external');
                let list = createList({ type: extProp.type, routePoint: extProp.routePoint });
                let clicked = await ymap.getContextMenu().setList(list).render().setPosition(e.get('pagePixels')).show().onClick('listmenu');
                if (clicked.target.id === 'check') {
                    extProp.routePoint = true;
                    ymap.getEditablePolyline().addPlacemark({ id: extProp.guid, placemark: target }).render(ymap.getMap());
                } else if (clicked.target.id === 'uncheck') {
                    delete extProp.routePoint;
                    ymap.getEditablePolyline().delPlacemark({ id: extProp.guid }).render(ymap.getMap());
                } else if (clicked.target.id === 'complete') {
                    let ep = ymap.getEditablePolyline();
                    let placemarks = ep.getPlacemarkAll();
                    for (let p in placemarks) { delete placemarks[p].properties.get('external').routePoint }
                    let coordinatePath = ep.getCoordinates().reduce((p, c) => { return `${p} ${c}`; });
                    socket.getRoutes().emitNetworkResourcesUpdate({ type: 'route', data: new Route().create({ coordinatePath: coordinatePath }).toObject() });
                    ep.reset();
                } else if (clicked.target.id === 'update') {
                    extProp.editable = true;
                    target.options.set('iconColor', '#FFE100');
                    target.balloon.open();
                } else if (clicked.target.id === 'remove') {
                    let popup = new Popup()
                        .setTitle('Удалить соединение?')
                        .setButtons([{ title: 'Да', id: 'yes' }, { title: 'Нет', id: 'no' }])
                        .create()
                        .setEventListener('yes', () => popup.close(), socket.getRoutes().emitNetworkResourcesRemove({ type: extProp.type, guid: extProp.guid }))
                        .setEventListener('no', () => popup.close())
                        .show();
                    utils.setDraggable(popup.getDOM(), '.title');
                }
            };
        };

        // DEBUG _balloonCloseHandler после реализации серверной части
        let _balloonCloseHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;
            let utils = _utils.utils;
            let Popup = _popup.Popup;

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

            function setNetworkResources (o) {
                let extProp = o.properties.get('external');
                let networdResource = extProp.type === 'node' ? new Node() : (extProp.type === 'route' ? new Route() : (extProp.type === 'blueprint' ? new Node() : null));
                if (!networdResource) return;
                socket.getRoutes().emitNetworkResourcesUpdate({ type: extProp.type, data: networdResource.create(networdResource.read(null, o.properties.get('balloonContent'))).toObject() });
            }

            return async e => {
                if (e.get('cluster') || !e.get('target').properties.get('external').editable) return;
                try { await prompt(); } catch (e) { return; };
                setNetworkResources(e.get('target'));
                e.get('target').properties.get('external').editable = false;
                e.get('target').options.set('iconColor', '#F4425F');
            };
        };

        // DEBUG _balloonOpenHandler после реализации серверной части
        let _balloonOpenHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socket;

            function getNetworkResources (object) {
                let networdResources = new Promise((resolve, reject) => socket.getRoutes().onNetworkResources(r => resolve(r)));
                socket.getRoutes().emitNetworkResources(object);
                return networdResources;
            }

            async function setBalloonContent (o) {
                let extProp = o.properties.get('external');
                let networdResource = extProp.type === 'node' ? new Node() : extProp.type === 'route' ? new Route() : null;
                if (!networdResource) return;
                o.properties.set('balloonContent', networdResource.create(await getNetworkResources(extProp)).render().outerHTML);
            }

            return e => (e.get('cluster') ? e.get('cluster').getGeoObjects() : [e.get('target')]).forEach(o => setBalloonContent(o));
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
                    _ymap.initializeObjectCluster();
                    _ymap.initializeObjectCollection();
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
