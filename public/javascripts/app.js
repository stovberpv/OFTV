define(['socket/index', 'ymap/index', 'node/index', 'route/index', 'utils/index', 'popup/index'], function (socket, ymap, node, route, utils, popup) {
    'use strict';

    /*
        TODO :
                1.      Две точки с одинаковыми координатами - придумать реализацию, не сохранять или сохранять но как тогда удалять?
                2.      При построении маршрута трассы, если последняя точка != начальная - позволять начальную точку добавить в маршрут
                3. +    _socket.routes.emitNetworkResources Обработать ресурсы
                4. +    _socket.routes запрос, обновление, удаление ресурсов
                5.      удалять draggableplacemark после сохранения
                6. +    _socket.routes.onNetworkResourcesUpdated();
                7. +    _socket.routes.onNetworkResourcesRemoved();
                8. +    Возможность редактировать только для edited
                9.      ContextMenu закрывать по Esc
                10.     ContextMenu выводить имя точки
        FIX :
                1.      ymaps не отображается searchControlProvider
                2. +    _ymap.showBounds(); вызывать после загрузки всех ресурсов по сокету
                3.      Кнопка множественного выбора должна быть недоступна если не выбран ни один из элементов списка
                4. +    ContextMenu закрывать предыдущее
                5.      ContextMenu не использовать await. вместо него - callback
        NOTE :
                1.
                2.
                3.
        DEBUG :
                1. +    _contextMenuHandler после реализации серверной части
                2. +    _balloonOpenHandler после реализации серверной части
                3. +    _balloonCloseHandler после реализации серверной части
                4. +    Сохранение маршрута
                5. +    Сохранение точки
    */
    function App () {
        let _eventBus = new utils.EventBus();
        let _socketHelper = socket.helper();
        let _ymap = new ymap.Ymap();
        let _node = node;
        let _route = route;
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
                    clusterer.getGeoObjects().forEach(o => { (o.properties.get('external').guid === mapObject.properties.get('external').guid) && clusterer.remove(o); });
                    !mapObject.properties.get('external').isDeprecated && clusterer.add(mapObject);
                })();
                (networkResourceType === 'route') && (() => {
                    let collection = _ymap.getObjectCollection();
                    let mapObject = polyline(new Route(networkResourceObject));
                    collection.each(o => { (o.properties.get('external').guid === mapObject.properties.get('external').guid) && collection.remove(o); });
                    !mapObject.properties.get('external').isDeprecated && collection.add(mapObject);
                })();
            };
        })();

        let _contextMenuHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socketHelper;
            let ymap = _ymap;
            let popup = _popup;
            let target;

            function createList (prop) {
                let list = [
                    (prop.type === 'node' && !prop.routePoint) && { id: 'check', text: 'Трасса: добавить' },
                    (prop.type === 'node' && prop.routePoint) && { id: 'uncheck', text: 'Трасса: исключить' },
                    (prop.type === 'node' && prop.routePoint) && { id: 'complete', text: 'Трасса: зафиксировать' },
                    ((prop.type === 'node' || prop.type === 'route') && !prop.editable) && { id: 'update', text: 'Редактировать описание' },
                    (prop.type === 'node' || prop.type === 'route') && { id: 'delete', text: 'Удалить' },
                    (prop.type === 'node blueprint') && { id: 'fix', text: 'Точка: зафиксировать' }
                ];
                return list.reduce((p, c) => { c && p.push(c); return p; }, []);
            }

            function getTarget (target) {
                return new Promise((resolve, reject) => {
                    if (target.options.getName() === 'cluster') {
                        let geoObj = [];
                        new popup.PopupWithSelection({
                            title: 'Выбор объекта',
                            content: 'Возможна только поэлементная обработка. Выберите один элемент из списка.',
                            selectionList: target.getGeoObjects().map((o, i) => {
                                let extProp = o.properties.get('external');
                                geoObj.push({ id: extProp.guid, obj: o });
                                return { id: extProp.guid, title: extProp.name || `Безымянный узел #${i}` };
                            }),
                            buttons: [{ id: 'secondary', title: 'Выбрать' }, { id: 'primary', title: 'Отменить' }],
                            listeners: [
                                { id: 'secondary', cb: (e, selection) => { geoObj.forEach(o => { (o.id === selection[0].id) && resolve(o.obj); }); } },
                                { id: 'primary', cb: e => { reject(e); } }
                            ]
                        }).render().show();
                    } else {
                        resolve(target);
                    }
                });
            }

            function check (extProp) {
                extProp.routePoint = true;
                ymap.getEditablePolyline().point.add({ id: extProp.guid, placemark: target }).render();
            }

            function uncheck (extProp) {
                delete extProp.routePoint;
                ymap.getEditablePolyline().point.del({ id: extProp.guid }).render();
            }

            function complete () {
                let ep = ymap.getEditablePolyline();
                let coordinatePath = ep.point.all();
                ep.point.each(p => { delete p.properties.get('external').routePoint; });
                ep.reset();
                socket.emitNetworkResourcesCreate(new Route({ coordinatePath: coordinatePath }).toPrimitive());
            }

            function update (extProp) {
                extProp.editable = true;
                if (extProp.type === 'node') target.options.set('iconColor', '#FFE100');
                else if (extProp.type === 'route') target.options.set('strokeColor', '#FFE100');
                var clusterer = ymap.getObjectCluster();
                var geoObjectState = clusterer.getObjectState(target);
                if (geoObjectState.isShown) {
                    if (geoObjectState.isClustered) {
                        ymap.getMap().balloon.open(extProp.coordinates.split(',').map(i => parseFloat(i)), 'Содержимое балуна', {
                            closeButton: false,
                            // contentLayout: ymap.getLayout('node')
                        });
                        // geoObjectState.cluster.state.set('activeObject', target);
                        // clusterer.balloon.open(geoObjectState.cluster);
                    } else {
                        target.balloon.open(extProp.coordinates.split(',').map(i => parseFloat(i)));
                    }
                }
                /*
                try {
                    target.balloon.open();
                } catch (e) {
                    ymap.getMap().balloon.open(extProp.coordinates.split(',').map(i => parseFloat(i)), { content: 'loooser' }, {});
                }
                */
            }

            function del (extProp) {
                new popup.PopupDialog({
                    title: 'Удалить объект?',
                    content: 'Объект станет недоступным. Действие нельзя будет отменить!',
                    buttons: [{ id: 'primary', title: 'Удалить' }, { id: 'secondary', title: 'Отменить' }],
                    listeners: [
                        { id: 'primary', cb: e => { socket.emitNetworkResourcesRemove({ type: extProp.type, guid: extProp.guid }); } },
                        { id: 'secondary' }
                    ]
                }).render().show();
            }

            function fix () {
                let prompt = new Promise((resolve, reject) => {
                    new popup.PopupDialog({
                        title: 'Зафиксировать как узел?',
                        content: 'Новая точка соединения будет добавлена на карту.',
                        buttons: [{ id: 'primary', title: 'Сохранить' }, { id: 'secondary', title: 'Отменить' }],
                        listeners: [
                            { id: 'primary', cb: e => { resolve(e); } },
                            { id: 'secondary', cb: e => { reject(e); } }
                        ]
                    }).render().show();
                });
                prompt.then(() => {
                    socket.emitNetworkResourcesCreate(new Node({ coordinates: target.geometry.getCoordinates() }).toPrimitive());
                }).catch(() => { });
            }

            return async e => {
                try { target = await getTarget(e.get('target')); } catch (e) { return; }
                let extProp = target.properties.get('external');
                let list = createList({ type: extProp.type, routePoint: extProp.routePoint, editable: extProp.editable });
                let clicked = await new popup.ContextMenu({ list: list, xy: e.get('pagePixels') }).render().show().awaitUserSelect();
                switch (clicked) {
                    case 'check': check(extProp); break;
                    case 'uncheck': uncheck(extProp); break;
                    case 'complete': complete(); break;
                    case 'update': update(extProp); break;
                    case 'delete': del(extProp); break;
                    case 'fix': fix(); break;
                    default: break;
                }
            };
        };

        let _balloonOpenHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let socket = _socketHelper;

            async function getNetworkResources (o) {
                let extProp = o.properties.get('external');
                if (!['node', 'route'].includes(extProp.type)) return;
                socket.emit('network resource read', { type: extProp.type, guid: extProp.guid }, r => {
                    let data = (extProp.type === 'node') ? new Node(r) : ((extProp.type === 'route') && new Route(r));
                    Object.assign(extProp, data.toPrimitive());
                });
            }

            return e => { (e.get('cluster') ? e.get('cluster').getGeoObjects() : [e.get('target')]).forEach(o => { getNetworkResources(o); }); };
        };

        let _balloonCloseHandler = () => {
            let Node = _node.Node;
            let Route = _route.Route;
            let popup = _popup;
            let socket = _socketHelper;

            function prompt () {
                return new Promise((resolve, reject) => {
                    new popup.PopupDialog({
                        title: 'Сохранить изменения?',
                        content: 'Данные будут перезаписаны. Действия нельзя будет отменить!',
                        buttons: [{ id: 'primary', title: 'Сохранить' }, { id: 'secondary', title: 'Отменить' }],
                        listeners: [
                            { id: 'primary', cb: e => { resolve(e); } },
                            { id: 'secondary', cb: e => { reject(e); } }
                        ]
                    }).render().show();
                });
            }

            return async e => {
                if (e.get('cluster')) return;
                let target = e.get('target');
                let extProp = target.properties.get('external');
                if (!extProp.editable) return;
                prompt().then(() => {
                    extProp.editable = false;
                    if (extProp.type === 'node') {
                        socket.emitNetworkResourcesUpdate(new Node(extProp).toPrimitive());
                        target.options.set('iconColor', '#F4425F');
                    } else if (extProp.type === 'route') {
                        socket.emitNetworkResourcesUpdate(new Route(extProp).toPrimitive());
                        target.options.set('strokeColor', '#F4425F');
                    }
                }).catch(() => { });
            };
        };

        this.run = async () => {
            (() => { // initialize event bus
                _eventBus.initialize();
            })();

            (() => { // initialize socket
                _socketHelper.onConnect(() => { console.log('Established socket connection with a server'); });
            })();

            await (() => { // initialize ymap
                return new Promise(async (resolve, reject) => {
                    try { await _ymap.load(); } catch (e) { reject(e); }
                    _ymap.attachTo('map');
                    _ymap.addLayout('route', _route.view.render());
                    _ymap.addLayout('node', _node.view.render());
                    _ymap.initializeObjectCluster();
                    _ymap.initializeObjectCollection();
                    _ymap.registerDraggablePlacemark({ properties: { type: 'node blueprint' } });
                    _ymap.registerEditablePolyline({ properties: { type: 'route blueprint' } });
                    _ymap.registerMapGlobalEvents();
                    _ymap.getObjectCluster();
                    _ymap.setGeoObjectEventHandler('contextmenu', _contextMenuHandler());
                    _ymap.setGeoObjectEventHandler('balloonopen', _balloonOpenHandler());
                    _ymap.setGeoObjectEventHandler('balloonclose', _balloonCloseHandler());

                    resolve();
                });
            })();

            (() => { // data processing
                _socketHelper.onNetworkResources(r => {
                    r.data.forEach(d => { _transposeDataOnMap(r.type, d); });
                    _ymap.showBounds();
                });
                _socketHelper.emitNetworkResources({ type: 'node' });
                _socketHelper.emitNetworkResources({ type: 'route' });
                _socketHelper.onNetworkResourcesCreated(r => { _transposeDataOnMap(r.type, r.data); });
                _socketHelper.onNetworkResourcesUpdated(r => { _transposeDataOnMap(r.type, r.data); });
                _socketHelper.onNetworkResourcesRemoved(r => { _transposeDataOnMap(r.type, r.data); });
            })();

            (() => { // post config
            })();
        };

        return this;
    }

    return App;
});
