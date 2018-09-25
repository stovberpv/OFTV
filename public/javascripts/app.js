define(['socket/index', 'ymap/index', 'node/index', 'route/index', 'utils/index', 'popup/index'], function (socket, ymap, node, route, utils, popup) {
    'use strict';

    /*
        TODO :
                1.  + Две точки с одинаковыми координатами - придумать реализацию, не сохранять или сохранять но как тогда удалять?
                2.    При построении маршрута трассы, если последняя точка != начальная - позволять начальную точку добавить в маршрут
                3.    "Трасса зафиксировать" не отображать если точка одна
                4.  + _socket.routes.emitNetworkResources Обработать ресурсы
                5.  + _socket.routes запрос, обновление, удаление ресурсов
                6.  + удалять draggableplacemark после сохранения
                7.  + _socket.routes.onNetworkResourcesUpdated();
                8.  + _socket.routes.onNetworkResourcesRemoved();
                9.  + Возможность редактировать только для edited
                10. + ContextMenu закрывать по Esc
                11. + ContextMenu выводить имя точки
        FIX :
                1.  + ymaps не отображается searchControlProvider
                2.  + _ymap.showBounds(); вызывать после загрузки всех ресурсов по сокету
                3.  + Кнопка множественного выбора должна быть недоступна если не выбран ни один из элементов списка
                4.  + ContextMenu закрывать предыдущее
                5.  + ContextMenu не использовать await. вместо него - callback
        NOTE :
                1.    Подумать над реализацией через ObjectManager https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/
        DEBUG :
                1.  + _contextMenuHandler после реализации серверной части
                2.  + _balloonOpenHandler после реализации серверной части
                3.  + _balloonCloseHandler после реализации серверной части
                4.  + Сохранение маршрута
                5.  + Сохранение точки
    */
    function App () {
        let _eventBus = new utils.EventBus();
        let _socketHelper = socket.helper();
        let _map = ymap;
        let _node = node;
        let _route = route;
        let _popup = popup;

        let _transposeDataOnMap = (function () {
            function placemark (node) {
                return _map.geoObjects.create.Placemark({
                    geometry: node.coordinates.get(),
                    properties: {
                        iconCaption: node.name.get(),
                        hintContent: node.description.get(),
                        clusterCaption: node.name.get(),
                        external: node.toPrimitive()
                    },
                    options: { balloonContentLayout: _map.layout.get('node') }
                });
            }

            function polyline (route) {
                return _map.geoObjects.create.Polyline({
                    geometry: route.coordinatePath.get(),
                    properties: {
                        hintContent: route.routeDescription.get() || route.cableDescription.get(),
                        external: route.toPrimitive()
                    },
                    options: { balloonContentLayout: _map.layout.get('route') }
                });
            }

            return function (networkResourceType, networkResourceObject) {
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
            };
        })();

        let _contextMenuHandler = (function () {
            let target;

            function createContextmenuList (prop) {
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
                        new _popup.PopupWithSelection({
                            title: 'Выбор объекта',
                            content: 'Возможна только поэлементная обработка. Выберите один элемент из списка.',
                            selectionList: target.getGeoObjects().map((o, i) => {
                                let extProp = o.properties.get('external');
                                geoObj.push({ id: extProp.guid, obj: o });
                                return { id: extProp.guid, title: extProp.name || `Узел без имени #${i}` };
                            }),
                            buttons: {
                                primary: { title: 'Выбрать', cb: (e, sel) => { geoObj.forEach(o => { (o.id === sel[0]) && resolve(o.obj); }); } },
                                secondary: { title: 'Отменить', cb: (e, sel) => { reject(e); } }
                            }
                        }).render().show();
                    } else {
                        resolve(target);
                    }
                });
            }

            function check (extProp) {
                extProp.routePoint = true;
                _map.geoObjects.EditablePolyline.point.add({ id: extProp.guid, placemark: target }).create().move();
            }

            function uncheck (extProp) {
                delete extProp.routePoint;
                _map.geoObjects.EditablePolyline.point.del({ id: extProp.guid }).move();
            }

            function complete () {
                let ep = _map.geoObjects.EditablePolyline;
                let coordinatePath = ep.point.all();
                ep.point.each(p => { delete p.properties.get('external').routePoint; });
                ep.remove();
                _socketHelper.emitNetworkResourcesCreate(new _route.Route({ coordinatePath: coordinatePath }).toPrimitive());
            }

            function update (extProp) {
                extProp.editable = true;
                if (extProp.type === 'node') target.options.set('iconColor', '#FFE100');
                else if (extProp.type === 'route') target.options.set('strokeColor', '#FFE100');
                var clusterer = _map.geoObjects.Clusterer;
                var geoObjectState = clusterer.getObjectState(target);
                if (geoObjectState.cluster === null) {
                    target.balloon.open();
                } else {
                    if (geoObjectState.isShown) {
                        if (geoObjectState.isClustered) {
                            // FIX : balloon close catch
                            _map.map.get().balloon.open(target.geometry.getCoordinates(), { properties: { external: extProp } }, { closeButton: true, contentLayout: _map.layout.get('node') });
                        } else {
                            target.balloon.open();
                        }
                    }
                }
            }

            function del (extProp) {
                new _popup.PopupDialog({
                    title: `Удалить ${extProp.name || extProp.routeDescription || 'объект'}?`,
                    content: 'Объект станет недоступным. Действие нельзя будет отменить!',
                    buttons: {
                        primary: { title: 'Удалить', cb: e => { _socketHelper.emitNetworkResourcesRemove({ type: extProp.type, guid: extProp.guid }); } },
                        secondary: { title: 'Отменить', cb: e => { } }
                    }
                }).render().show();
            }

            function fix () {
                new _popup.PopupDialog({
                    title: 'Зафиксировать как узел?',
                    content: 'Новая точка соединения будет добавлена на карту.',
                    buttons: {
                        primary: { title: 'Сохранить', cb: e => {
                            _socketHelper.emitNetworkResourcesCreate(new _node.Node({ coordinates: target.geometry.getCoordinates() }).toPrimitive());
                            _map.geoObjects.DraggablePlacemark.remove();
                        } },
                        secondary: { title: 'Отменить', cb: e => { } }
                    }
                }).render().show();
            }

            return async function (e) {
                try { target = await getTarget(e.get('target')); } catch (e) { return; }
                let extProp = target.properties.get('external');
                new _popup.ContextMenu({
                    list: createContextmenuList(extProp),
                    xy: e.get('pagePixels'),
                    cb: clicked => {
                        switch (clicked) {
                            case 'check': check(extProp); break;
                            case 'uncheck': uncheck(extProp); break;
                            case 'complete': complete(); break;
                            case 'update': update(extProp); break;
                            case 'delete': del(extProp); break;
                            case 'fix': fix(); break;
                            default: break;
                        }
                    }
                }).render().show();
            };
        })();

        let _balloonOpenHandler = (function () {
            function getNetworkResources (o) {
                let extProp = o.properties.get('external');
                if (!['node', 'route'].includes(extProp.type)) return;
                _socketHelper.emit('network resource read', { type: extProp.type, guid: extProp.guid }, r => {
                    let data = (extProp.type === 'node') ? new _node.Node(r) : ((extProp.type === 'route') && new _route.Route(r));
                    Object.assign(extProp, data.toPrimitive());
                });
            }

            return e => { (e.get('cluster') ? e.get('cluster').getGeoObjects() : [e.get('target')]).forEach(o => { getNetworkResources(o); }); };
        })();

        let _balloonCloseHandler = function (e) {
            if (e.get('cluster')) return;
            let target = e.get('target');
            let extProp = target.properties.get('external');
            if (!extProp.editable) return;
            new _popup.PopupDialog({
                title: `Сохранить изменения ${extProp.name || extProp.routeDescription || ''}?`,
                content: 'Данные будут перезаписаны. Действия нельзя будет отменить!',
                buttons: {
                    primary: {
                        title: 'Сохранить',
                        cb: e => {
                            extProp.editable = false;
                            if (extProp.type === 'node') {
                                _socketHelper.emitNetworkResourcesUpdate(new _node.Node(extProp).toPrimitive());
                                target.options.set('iconColor', '#F4425F');
                            } else if (extProp.type === 'route') {
                                _socketHelper.emitNetworkResourcesUpdate(new _route.Route(extProp).toPrimitive());
                                target.options.set('strokeColor', '#F4425F');
                            }
                        }
                    },
                    secondary: {
                        title: 'Отменить',
                        cb: e => {
                            extProp.editable = false;
                            if (extProp.type === 'node') target.options.set('iconColor', '#F4425F');
                            else if (extProp.type === 'route') target.options.set('strokeColor', '#F4425F');
                        }
                    }
                }
            }).render().show();
        };

        this.run = async () => {
            (() => { // initialize event bus
                _eventBus.initialize();
            })();

            (() => { // initialize socket
                _socketHelper.onConnect(() => {
                    console.log('Established socket connection with a server');
                    _socketHelper.emit('authentication', {username: "John", password: "secret"});
                });
            })();

            await (() => { // initialize ymap
                return new Promise(async (resolve, reject) => {
                    try { _map = new _map.Helper(await _map.controller.load()); } catch (e) { reject(e); }
                    _map.map.attach('map');
                    _map.layout.set('route', _route.view.render());
                    _map.layout.set('node', _node.view.render());
                    _map.geoObjects.add(_map.geoObjects.Clusterer);
                    _map.geoObjects.add(_map.geoObjects.Collection);
                    _map.geoObjects.DraggablePlacemark.setProp({ type: 'node blueprint' });
                    _map.geoObjects.EditablePolyline.setProp({ type: 'route blueprint' });
                    _map.map.get().geoObjects.events.add('contextmenu', _contextMenuHandler);
                    _map.map.get().geoObjects.events.add('balloonopen', _balloonOpenHandler);
                    _map.map.get().geoObjects.events.add('balloonclose', _balloonCloseHandler);
                    _map.map.get().events.add('click', e => { _map.geoObjects.DraggablePlacemark.setCoords(e.get('coords')).create().move(); });

                    resolve();
                });
            })();

            (() => { // data processing
                _socketHelper.onNetworkResources(r => {
                    r.data.forEach(d => { _transposeDataOnMap(r.type, d); });
                    _map.map.setBounds();
                });
                _socketHelper.emitNetworkResources({ type: 'node' });
                _socketHelper.emitNetworkResources({ type: 'route' });
                _socketHelper.onNetworkResourcesCreated(r => { _transposeDataOnMap(r.type, r.data); });
                _socketHelper.onNetworkResourcesUpdated(r => { _transposeDataOnMap(r.type, r.data); });
                _socketHelper.onNetworkResourcesRemoved(r => { _transposeDataOnMap(r.type, r.data); });
            })();
        };

        return this;
    }

    return App;
});
