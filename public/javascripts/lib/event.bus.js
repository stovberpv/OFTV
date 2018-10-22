define([], function () {
    'use strict';

    let EventBus = (function () {
        let _instance;

        function EventBus () {
            const eventCallbacksPairs = [];

            this.on = function (eventType, callback) {
                const eventCallbacksPair = findEventCallbacksPair(eventType);

                if (eventCallbacksPair) eventCallbacksPair.callbacks.push(callback);
                else eventCallbacksPairs.push(new EventCallbacksPair(eventType, callback));
            };

            this.emit = function (eventType, args) {
                const eventCallbacksPair = findEventCallbacksPair(eventType);

                if (!eventCallbacksPair) {
                    console.error(`no subscribers for event ${eventType}`);
                    return;
                }

                eventCallbacksPair.callbacks.forEach(callback => callback(args));
            };

            this.cancel = function (eventType, callback) {
                const eventCallbacksPair = findEventCallbacksPair(eventType);

                if (!eventCallbacksPair) {
                    console.error(`no subscribers for event ${eventType}`);
                    return;
                }

                removeEventCallbacksPair(eventType, callback);
            };

            function findEventCallbacksPair (eventType) {
                return eventCallbacksPairs.find(eventObject => eventObject.eventType === eventType);
            }

            function removeEventCallbacksPair (eventType, callback) {
                const eventCallbacksPair = findEventCallbacksPair(eventType);
                let index = eventCallbacksPair.callbacks.indexOf(callback);
                eventCallbacksPair.callbacks.splice(index, 1);
            }

            function EventCallbacksPair (eventType, callback) {
                this.eventType = eventType;
                this.callbacks = [callback];
            }

            return this;
        }

        function createInstance () {
            _instance = new EventBus();
            return _instance;
        }

        return {
            getInstance: function () {
                return _instance || createInstance();
            }
        };
    })();

    return EventBus;
});
