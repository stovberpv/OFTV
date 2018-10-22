define(function (require) {
    'use strict';

    let Socket = require('socket/index').Socket;
    // let EventBus = require('eventbus');

    function controller (bundle) {
        let _Socket = Socket.getInstance();
        // let _EventBus = EventBus.getInstance();

        function create (data) {
            _Socket.emitCreateData(data);
        }

        function fetch (data, cb) {
            _Socket.emitReadData(data, cb);
            // function (result) {
            //     _EventBus.dispatch(`fetch${data.guid}`, result);
            // });
        }

        function update (data) {
            _Socket.emitUpdateData(data);
        }

        function remove (data) {
            _Socket.emitRemoveData(data);
        }

        bundle.create = create;
        bundle.fetch = fetch;
        bundle.update = update;
        bundle.remove = remove;

        return bundle;
    }

    return controller;
});
