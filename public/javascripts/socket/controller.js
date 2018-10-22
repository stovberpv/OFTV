define([], function () {
    'use strict';

    function controller (bundle) {
        bundle.onConnect = function (cb) { this.io.on('connect', cb); };

        bundle.onDataRead = function (cb) { this.io.on('data was read', cb); };
        bundle.emitReadData = function (opts, cb) { this.io.emit('read data', opts, cb); };

        bundle.onDataCreated = function (cb) { this.io.on('data was created', cb); };
        bundle.emitCreateData = function (opts) { this.io.emit('create data', opts); };

        bundle.onDataUpdated = function (cb) { this.io.on('data was updated', cb); };
        bundle.emitUpdateData = function (opts) { this.io.emit('update data', opts); };

        bundle.onDataRemoved = function (cb) { this.io.on('data was removed', cb); };
        bundle.emitRemoveData = function (opts) { this.io.emit('remove data', opts); };

        return bundle;
    }

    return controller;
});
