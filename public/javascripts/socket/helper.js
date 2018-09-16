define(['config/index', 'socketio', './routes'], function (config, socketio, routes) {
    'use strict';

    function helper () {
        let _socketio = socketio(`${config.socket.host}:${config.socket.port}`, config.socket.options);
        let emit = (name, data, cb) => { _socketio.emit(name, data, cb); };

        return { ...routes(_socketio), emit };
    }

    return helper;
});
