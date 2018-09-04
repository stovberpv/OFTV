define([], function () {
    'use strict';

    function EventBus () {
        let _id = Math.floor(Math.random() * 100000);
        let _eventBus = null;

        this.initialize = () => {
            if (_eventBus) return;

            _eventBus = document.createElement('eventbus');
            _eventBus.setAttribute('id', `${_id}`);
            _eventBus.setAttribute('style', 'display:none;');
            document.body.appendChild(_eventBus);

            _eventBus = document.querySelector('eventbus');

            return this;
        };

        this.destroy = () => { if (_eventBus) document.body.removeChild(_eventBus); };

        this.subscribe = (event, cb, context = null, args ={}) => {
            if (!_eventBus) throw new Error('EventBus was not initialized');
            _eventBus.addEventListener(event, context ? cb.bind(context, args) : cb);
        };

        this.unsubscribe = (event, cb) => {
            if (!_eventBus) throw new Error('EventBus was not initialized');
            _eventBus.removeEventListener(event, cb);
        };

        this.dispatch = (event, data) => {
            if (!_eventBus) throw new Error('EventBus was not initialized');
            _eventBus.dispatchEvent(new CustomEvent(event, data));
        };

        return this;
    }

    return EventBus;
});
