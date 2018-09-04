define(['config/index', 'socketio', './routes'], function (config, socketio, Routes) {
    'use strict';

    function Socket () {
        let _socketio = null;
        let _routes = new Routes();

        this.setSocket = socket => _socketio = socket;
        this.getSocket = () => { return _socketio; };

        this.getRoutes = () => { return _routes; };

        this.connect = () => _socketio = socketio(`${config.socket.host}:${config.socket.port}`, config.socket.options);

        this.initializeRoutes = () => _routes.initialize(this);

        return this;
    }

    return Socket;
});
