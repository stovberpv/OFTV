define(['eventbus'], function (EventBus) {
    'use strict';

    function controller (bundle) {
        bundle.attach = function (target) {
            let _stateConfig = { center: [44.914436, 34.085001], controls: ['zoomControl', 'typeSelector', 'rulerControl', 'searchControl'], zoom: 15 };
            let _optionsConfig = { suppressMapOpenBlock: true, searchControlProvider: 'yandex#search' };
            this.map = new this.map.Map(target, _stateConfig, _optionsConfig);
        };

        bundle.setBounds = function () {
            let bounds = this.map.geoObjects.getBounds();
            bounds && this.map.setBounds(bounds, { checkZoomRange: true });
        };

        // TODO : ovserver каждый объект при создании регистрируется на изменение/удаление
        bundle.geoObjectsEvents = (function () {
            let self = this;

            function registerAll () {
                // меню - трасса добавить узел
                //      узел - установка префикса трассы
                //      трасса - сохраненить узул в массив узлов
                self.map.geoObjects.events.add('hookup', e => {
                    let guid = e.get('guid');
                    self.geoObjectsConstructor.Clusterer.getGeoObjects().forEach(o => {
                        let extProp = o.properties.get('external');
                        if (extProp.guid === guid) {
                            extProp.isHooked = true;
                            o.properties.set('external', extProp);
                            self.geoObjectsConstructor.EditablePolyline.points.add({ id: guid, placemark: o });
                        }
                    });
                });
                // меню - трасса убрать узел
                //      узел - убрать префикс трассы
                //      трасса - убрать узел из массива
                self.map.geoObjects.events.add('breakup', e => {
                    let guid = e.get('guid');
                    self.geoObjectsConstructor.Clusterer.getGeoObjects().forEach(o => {
                        let extProp = o.properties.get('external');
                        if (extProp.guid === guid) {
                            delete extProp.isHooked;
                            o.properties.set('external', extProp);
                            // DEBUG : upd route
                            self.geoObjectsConstructor.EditablePolyline.points.del({ id: guid });
                        }
                    });
                });
                // меню - изменить
                //      объект - установка префикса редактируемый
                //      запросить данные из БД
                self.map.geoObjects.events.add('edit', e => {});
                // меню - удалить
                //      отправить данные в БД
                self.map.geoObjects.events.add('remove', e => {});
                // меню - трасса сохранить
                //      трасса - убрать все узлы из массива
                //          все узлы - убрать префикс трассы
                //      трасса - убрать
                //      отправить информацию в БД
                // меню - узел сохранить
                //      узел - убрать
                //      отправить информацию в БД
                self.map.geoObjects.events.add('new', e => {});
            }

            return { registerAll };
        }).bind(bundle)();

        bundle.geoObjectsFactory = (function () {
            let self = this;

            let node = {
                create: function Node (data) {
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

                        return new self.ymaps.data.Manager(data);
                    })({
                        iconCaption: data.name.get(),
                        hintContent: data.description.get(),
                        clusterCaption: data.name.get(),
                        external: data.toPrimitive()
                    });

                    let options = (options => {
                        let data = {
                            iconColor: '#F4425F',
                            preset: 'islands#glyphCircleIcon',
                            iconCaptionMaxWidth: '150',
                            balloonContentLayout: options.balloonContentLayout || null
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return data;
                    })({
                        balloonContentLayout: self.layout.get('node')
                    });

                    if (data.isDeprecated.get()) {
                        return void (0);
                    } else {
                        let placemark = new self.ymaps.Placemark(data.coordinates.get(), properties, options);
                        self.geoObjectsConstructor.Clusterer.add(placemark);

                        return placemark;
                    }
                },
                update: function () {
                },
                remove: function (guid) {
                    let clusterer = self.geoObjectsConstructor.Clusterer;
                    clusterer.getGeoObjects().forEach(o => {
                        (o.properties.get('external').guid === guid) && clusterer.remove(o);
                    });
                }
            };

            let route = {
                create: function Route (data) {
                    let properties = (properties => {
                        let data = {
                            hintContent: properties.hintContent || null,
                            balloonContent: properties.balloonContent || null,
                            external: properties.external || {}
                        };

                        for (let k in data) if (!data[k]) delete data[k];

                        return new self.ymaps.data.Manager(data);
                    })({
                        hintContent: data.routeDescription.get() || data.cableDescription.get(),
                        external: data.toPrimitive()
                    });

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
                    })({
                        balloonContentLayout: self.layout.get('route')
                    });

                    if (data.isDeprecated.get()) {
                        return void (0);
                    } else {
                        let polyline = new self.ymaps.Polyline(data.coordinatePath.get(), properties, options);
                        self.geoObjectsConstructor.Collection.add(polyline);

                        return polyline;
                    }
                },
                update: function () {
                },
                remove: function (guid) {
                    let collection = self.geoObjectsConstructor.Collection;
                    collection.each(o => {
                        (o.properties.get('external').guid === guid) && collection.remove(o);
                    });
                }
            };

            return { node, route };
        }).bind(bundle)();

        bundle.balloon = function () {
            return {
                // TODO : передавать объект сюла из меню
                open: (editMode, e) => {
                    let target = e.get('target');
                    let extProp = target.properties.get('external');

                    if (editMode) {
                        extProp.editable = true;
                        if (extProp.type === 'node') target.options.set('iconColor', '#FFE100');
                        else if (extProp.type === 'route') target.options.set('strokeColor', '#FFE100');
                    }
                    var geoObjectState = this.geoObjectsConstructor.Clusterer.getObjectState(target);
                    let balloonContructor = {
                        position: target.geometry.getCoordinates(),
                        properties: { properties: { external: extProp } },
                        options: { closeButton: true, contentLayout: this.layout.get('node') }
                    };
                    if (geoObjectState.cluster) {
                        if (geoObjectState.isShown) {
                            if (geoObjectState.isClustered) {
                                this.ymap.map.get().balloon.open(balloonContructor.position, balloonContructor.properties, balloonContructor.options);
                            } else {
                                target.balloon.open();
                            }
                        }
                    } else {
                        target.balloon.open();
                    }
                },
                close: e => {
                    if (e.get('cluster')) return;
                    let target = e.get('target');
                    let extProp = target.properties.get('external');
                    let data;
                    let optsName;
                    if (extProp.editable) {
                        extProp.editable = false;
                        if (extProp.type === 'node') {
                            data = new this.Node(extProp).toPrimitive();
                            optsName = 'iconColor';
                        } else if (extProp.type === 'route') {
                            data = new this.Route(extProp).toPrimitive();
                            optsName = 'strokeColor';
                        }
                        target.options.set(optsName, '#F4425F');
                        EventBus.emit('update', { type: extProp.type, data }); // FIX :
                    }
                }
                /*
                ,
                fill: target => {
                    let extProp = target.properties.get('external');
                    function fillLayout (result) {
                        // eventBus.unsubscribe(`fetch${extProp.guid}`, fillLayout);
                        // let parsed = mapObjectsManager.parse(extProp.type, result);
                        return Object.assign(extProp, parsed.toPrimitive());
                    }

                     // FIX :
                    return new Promise((resolve, reject) => {
                        fillLayout(resolve);
                        // eventBus.subscribe(`fetch${extProp.guid}`, fillLayout);
                        // eventBus.dispatch(`fetch${extProp.guid}`, { type: extProp.type, guid: extProp.guid });
                    });
                }
                   */
            };
        }.bind(bundle)();

        /*
        let mapObjectsManager = {
            createRealObj: function (type) {
                if (type === 'route') {
                    let ep = ymap.geoObjects.EditablePolyline;
                    let coordinatePath = ep.point.all();
                    ep.point.each(p => { delete p.properties.get('external').isHooked; });
                    ep.remove();
                    eventBus.dispatch('create', { type, data: new routeIndex.Route({ coordinatePath: coordinatePath }).toPrimitive() });
                } else if (type === 'node') {
                    ymap.geoObjects.DraggablePlacemark.remove();
                    eventBus.dispatch('create', { type, data: new nodeIndex.Node({ coordinates: target.geometry.getCoordinates() }).toPrimitive() });
                }
            },
        };
        */

        /*
            контекстное меню отправляет событие с нажатой кнопкой
            событие ловится соответствующим обработчиком вне этой функции
            обработчик выполняет действие и отправляет событие с данными
            меню ловит событие и обнволяет данные элемента
            меню при создании подписывается на событие обновления элемента,
            а при удалении отменяет подписку
        */
        bundle.contextMenuMediator = (function () {
            let self = this;
            let _event;

            function getPossibleTargets (target) {
                let targets = [];

                if (target.options.getName() === 'cluster') {
                    target.getGeoObjects().forEach(target => {
                        targets.push({ target });
                    });
                } else {
                    targets = [{ target }];
                }

                return targets;
            }

            /**
             *
             *
             * @param {*} targets
             */
            function bindButtons (targets) {
                /**
                 * Формирование выпадающего списка меню.
                 * Алгоритмом расчета отображаемых полей выступают битовые операции.
                 * При этом статус узла/линии может быть составным. Для его формирования
                 * используется побитовое ИЛИ "|".
                 *
                 * @param {object} prop Расширенные параметры объекта
                 * @returns {number} Статус узла преобразованный из текстового представления в числовое
                 */
                function castState (extProp) {
                    let isHooked = (extProp.isHooked) ? 0x8 : 0x10;                 // 8 '01000' : 16 '10000';
                    let isEdited = (extProp.isEdited) ? 0x0 : 0x4;                  // 0 '00000' : 4 '00100';
                    let canBeRemoved = (extProp.canBeRemoved || 1) ? 0x2 : 0x0;     // 2 '00010' : 0 '00000';
                    let isNew = (extProp.isNew) ? 0x1 : 0x0;                        // 1 '00001' : 0 '00000';
                    let state = (isHooked | isEdited | canBeRemoved | isNew);

                    return state;
                }
                /**
                 * Формирование массива кнопок.
                 * Алгоритмом выступает битовая операция побитовое И "&".
                 *
                 * @param {number} state Статус узла преобразованный из текстового представления в hexadecimal | number
                 * @returns {array} Список кнопок, удовлетворяющих выборке.
                 */
                function getButtons (state) {
                    let buttons = [
                        { code: 0x10, id: 'hookup', title: self.texts.ru.menu.t001 },   // '10000'
                        { code: 0x8, id: 'breakup', title: self.texts.ru.menu.t002 },   // '01000'
                        { code: 0x4, id: 'edit', title: self.texts.ru.menu.t004 },      // '00100'
                        { code: 0x2, id: 'remove', title: self.texts.ru.menu.t005 },    // '00010'
                        { code: 0x1, id: 'new', title: self.texts.ru.menu.t003 }        // '00001'
                    ];

                    return buttons.filter(i =>
                        (i.code & state)
                    );
                }
                /**
                 * Для каждого узла формируем набор кнопок на основании его состояния.
                 */
                targets.forEach(target => {
                    let extProp = target.target.properties.get('external');
                    let state = castState(extProp);
                    target.buttons = getButtons(state);
                });
            }

            function createMenu (targets) {
                let list = [];

                function menuEventHandler (action, guid) {
                    switch (action) {
                        case 'hookup': self.map.geoObjects.events.fire('hookup', { guid }); break;
                        case 'breakup': self.map.geoObjects.events.fire('breakup', { guid }); break;
                        case 'edit': self.map.geoObjects.events.fire('edit', { guid }); break;
                        case 'remove': self.map.geoObjects.events.fire('remove', { guid }); break;
                        case 'new': self.map.geoObjects.events.fire('new', { guid }); break;
                        default: break;
                    }
                }

                targets.forEach(target => {
                    let extProp = target.target.properties.get('external');
                    list.push({
                        id: extProp.guid,
                        title: extProp.name || extProp.description || 'No name',
                        buttons: target.buttons
                    });
                });

                let menuOptions = {
                    list: list,
                    xy: _event.get('pagePixels'),
                    eventsHandlers: { buttons: menuEventHandler }
                };

                if (targets.length === 1) {
                    new self.popup.ContextMenu(menuOptions).render().show();
                } else if (targets.length > 1) {
                    new self.popup.SideMenu(menuOptions).render().show();
                }
            }

            function updateMenu (target) {
                bindButtons([target]);
            }

            function contextMenu (event) {
                _event = event;

                let eventTarget = event.get('target');
                let targets = getPossibleTargets(eventTarget);

                bindButtons(targets);
                createMenu(targets);
            }

            return { contextMenu };
        }).bind(bundle)();

        return bundle;
    }

    return controller;
});
