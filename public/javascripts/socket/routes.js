define([], function () {
    'use strict';

    /**
     *
     */
    function Routes () {
        //
        let _socket = null;

        //
        this.initialize = socket => { if (!_socket) _socket = socket.getSocket(); };

        // Fired upon a connection error.
        this.onConnect = cb => _socket.on('connect', cb);
        // Fired upon a connection error.
        this.onConnectError = cb => _socket.on('connect_error', cb);
        // Fired upon a connection timeout.
        this.onConnectTimeout = cb => _socket.on('connect_timeout', cb);
        // Fired upon a successful reconnection.
        this.onDisconnect = cb => _socket.on('disconnect', cb);
        // Fired upon a successful reconnection.
        this.onReconnect = cb => _socket.on('reconnect', cb);
        // Fired upon a successful reconnection.
        this.onReconnecting = cb => _socket.on('reconnecting', cb);
        // Fired upon a reconnection attempt error.
        this.onReconnectError = cb => _socket.on('reconnect_error', cb);
        // Fired when couldn’t reconnect within reconnectionAttempts.
        this.onReconnectFailed = cb => _socket.on('reconnect_failed', cb);
        // Fired upon an attempt to reconnect.
        this.onReconnectAttempt = cb => _socket.on('reconnect_attempt', cb);

        //
        //  Additional
        //

        this.onNetworkResources = (cb, context = null, args = null) => _socket.on('network resources requested', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        this.emitNetworkResources = opts => _socket.emit('network resources request', opts);

        this.onNetworkResourcesCreated = (cb, context = null, args = null) => _socket.on('network resource create', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        this.emitNetworkResourcesCreate = opts => _socket.emit('network resource create', opts);

        this.onNetworkResourcesUpdated = (cb, context = null, args = null) => _socket.on('network resource updated', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        this.emitNetworkResourcesUpdate = opts => _socket.emit('network resource update', opts);

        this.onNetworkResourcesRemoved = (cb, context = null, args = null) => _socket.on('network resource removed', context ? (args ? cb.bind(context, args) : cb.bind(context)) : (args ? cb.bind(null, args) : cb));
        this.emitNetworkResourcesRemove = opts => _socket.emit('network resource remove', opts);

        return this;
    }

    return Routes;
});
