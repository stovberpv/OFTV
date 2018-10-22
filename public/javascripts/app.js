define(function (require) {
    'use strict';

    let EventBus = require('eventbus');

    let Socket = require('socket/index').Socket;
    let Database = require('database/index').Database;

    let ymapIndex = require('ymap/index');
    let nodeIndex = require('node/index');
    let routeIndex = require('route/index');

    /*
        TODO :
                2.    При построении маршрута трассы, если последняя точка != начальная - позволять начальную точку добавить в маршрут
                3.    "Трасса зафиксировать" не отображать если точка одна
                4.    Размещение: канализация/воздух
        FIX :

        NOTE :
                1.    Подумать над реализацией через ObjectManager https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/
        DEBUG :

    */
    function app () {
        let _map;
        let _EventBus;
        let _Database;
        let _Socket;

        async function run () {
            (function () { // initialize event bus
                _EventBus = EventBus.getInstance();
            })();

            (function () { // initialize socket
                _Socket = Socket.getInstance();

                _Socket.initialize();
                _Socket.onConnect(function () {
                    console.log('WebSocket::Server connection established');
                });
                _Socket.open();
            })();

            (function () { // initialize database
                _Database = Database.getInstance();
                _Database.initialize();
            })();

            await (function () { // initialize ymap
                _map = ymapIndex.map.getInstance();
                return _map.initialize().then(() => { }).catch(e => { console.log(e); });
            })();

            _map.attach('map');
            _map.layout.set('route', routeIndex.view.render());
            _map.layout.set('node', nodeIndex.view.render());
            _map.map.geoObjects.add(_map.geoObjectsFactory.Clusterer);
            _map.map.geoObjects.add(_map.geoObjectsFactory.Collection);
            _map.geoObjectsFactory.DraggablePlacemark.setProp({ type: 'node', isNew: true }).init();
            _map.geoObjectsFactory.EditablePolyline.setProp({ type: 'route', isNew: true });
            _map.map.geoObjects.events.add('contextmenu', _map.contextMenu.handler);
            /*
            // FIX :
            bundle.get().geoObjects.events.add('balloonopen', _balloonOpenHandler);
            bundle.get().geoObjects.events.add('balloonclose', _balloonCloseHandler);
            bundle.get().events.add('click', e => {
                _mapHelper.geoObjects.DraggablePlacemark.setCoords(e.get('coords')).create().move();
            });
            */

            (function () { // data processing
                _Socket.onDataRead(function (data) {
                    if (data.type === 'node') {
                        data.data.forEach(function (row) {
                            let handler = _map.nodeHandler;
                            let node = new nodeIndex.Node(row);
                            let geoObj = handler.create(node);
                            handler.add(geoObj);
                        });
                    } else if (data.type === 'route') {
                        data.data.forEach(function (row) {
                            let handler = _map.routeHandler;
                            let route = new routeIndex.Route(row);
                            let geoObj = handler.create(route);
                            handler.add(geoObj);
                        });
                    }
                });

                _EventBus.on('create', _Database.create);
                _EventBus.on('fetch', _Database.fetch);
                _EventBus.on('update', _Database.update);
                _EventBus.on('remove', _Database.remove);

                _EventBus.emit('fetch', { type: 'node', requestType: 'M' });
                _EventBus.emit('fetch', { type: 'route', requestType: 'M' });
                // FIX :
                /*
                (networkResourceType === 'node') && (() => {
                    let clusterer = _map.geoObjects.Clusterer;
                    let mapObject = placemark(new _node.Node(networkResourceObject));
                    clusterer.getGeoObjects().forEach(o => { (o.properties.get('external').guid === mapObject.properties.get('external').guid) && clusterer.remove(o); });
                    !mapObject.properties.get('external').isDeprecated && clusterer.add(mapObject);
                })();
                (networkResourceType === 'route') && (() => {
                    let collection = _map.geoObjects.Collection;
                    let mapObject = polyline(new _route.Route(networkResourceObject));
                    collection.each(o => { (o.properties.get('external').guid === mapObject.properties.get('external').guid) && collection.remove(o); });
                    !mapObject.properties.get('external').isDeprecated && collection.add(mapObject);
                })();
                _socketHelper.onNetworkResources(function (result) {
                    result.data.forEach(d => { _transposeDataOnMap(result.type, d); });
                    _mapHelper.map.setBounds();
                });
                _socketHelper.emitNetworkResources({ type: 'node' });
                _socketHelper.emitNetworkResources({ type: 'route' });
                _socketHelper.onNetworkResourcesCreated(function (result) { _transposeDataOnMap(result.type, result.data); });
                _socketHelper.onNetworkResourcesUpdated(function (result) { _transposeDataOnMap(result.type, result.data); });
                _socketHelper.onNetworkResourcesRemoved(function (result) { _transposeDataOnMap(result.type, result.data); });
                */
            })();
        }

        return {
            run
        };
    }

    return app;
});
