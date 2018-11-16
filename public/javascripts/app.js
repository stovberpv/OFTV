define(function (require) {
    'use strict';

    let eventBus = require('eventbus');

    let Socket = require('socket/index').Socket;
    let Database = require('database/index').Database;

    let ymap = require('ymap/index');
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
        // let _EventBus;
        let _Database;
        let _Socket;

        async function go () {
            (function () { // initialize event bus
                // _EventBus = eventBus.getInstance();
            })();

            (function () { // initialize socket
                _Socket = Socket.getInstance();

                _Socket.initialize();
                _Socket.onConnect(() => { console.log('WebSocket::Server connection established'); });
                _Socket.open();
            })();

            (function () { // initialize database
                _Database = Database.getInstance();
                _Database.initialize();
            })();

            await ymap.init('map');
            ymap.layout.set('route', routeIndex.view.render());
            ymap.layout.set('node', nodeIndex.view.render());

            /*
            bundle.get().geoObjects.events.add('balloonopen', _balloonOpenHandler);
            bundle.get().geoObjects.events.add('balloonclose', _balloonCloseHandler);
            bundle.get().events.add('click', e => {
                _mapHelper.geoObjects.DraggablePlacemark.setCoords(e.get('coords')).create().move();
            });
            */

            (function () { // data processing
                _Socket.onDataRead(function (data) {
                    if (data.type === 'node') {
                        data.data.forEach(function (data) {
                            let node = new nodeIndex.Node(data);
                            ymap.node.create(node);
                        });
                    } else if (data.type === 'route') {
                        data.data.forEach(function (data) {
                            let route = new routeIndex.Route(data);
                            ymap.route.create(route);
                        });
                    }
                });

                eventBus.on('create', _Database.create);
                eventBus.on('fetch', _Database.fetch);
                eventBus.on('update', _Database.update);
                eventBus.on('remove', _Database.remove);

                eventBus.emit('fetch', { type: 'node', requestType: 'M' });
                eventBus.emit('fetch', { type: 'route', requestType: 'M' });
                /*
                _socketHelper.onNetworkResources(function (result) {
                    result.data.forEach(d => { _transposeDataOnMap(result.type, d); });
                    _mapHelper.map.setBounds();
                });
                _socketHelper.onNetworkResourcesCreated(function (result) { _transposeDataOnMap(result.type, result.data); });
                _socketHelper.onNetworkResourcesUpdated(function (result) { _transposeDataOnMap(result.type, result.data); });
                _socketHelper.onNetworkResourcesRemoved(function (result) { _transposeDataOnMap(result.type, result.data); });
                */
            })();
        }

        return { go };
    }

    return app;
});
