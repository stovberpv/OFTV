define([], function () {
    'use strict';

    function routes (_socketio) {
        let _socket = _socketio;

        let onConnect = cb => _socket.on('connect', cb);

        let onNetworkResources = (cb, context = null, args = null) => _socket.on('network resources requested', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        let emitNetworkResources = opts => _socket.emit('network resources request', opts);

        let onNetworkResourcesCreated = (cb, context = null, args = null) => _socket.on('network resource created', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        let emitNetworkResourcesCreate = opts => _socket.emit('network resource create', opts);

        let onNetworkResourcesUpdated = (cb, context = null, args = null) => _socket.on('network resource updated', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        let emitNetworkResourcesUpdate = opts => _socket.emit('network resource update', opts);

        let onNetworkResourcesRemoved = (cb, context = null, args = null) => _socket.on('network resource removed', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        let emitNetworkResourcesRemove = opts => _socket.emit('network resource remove', opts);

        return {
            onConnect: onConnect,
            onNetworkResources: onNetworkResources,
            emitNetworkResources: emitNetworkResources,
            onNetworkResourcesCreated: onNetworkResourcesCreated,
            emitNetworkResourcesCreate: emitNetworkResourcesCreate,
            onNetworkResourcesUpdated: onNetworkResourcesUpdated,
            emitNetworkResourcesUpdate: emitNetworkResourcesUpdate,
            onNetworkResourcesRemoved: onNetworkResourcesRemoved,
            emitNetworkResourcesRemove: emitNetworkResourcesRemove
        };
    }

    return routes;
});
