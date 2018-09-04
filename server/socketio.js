const SocketIO = require('socket.io');
const log = require('fancy-log');
const cv = require.main.require('../config/console');

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));
        socket.on('network resources', request => { console.log('network resources'); });
        socket.on('node add', request => { console.log('node add'); });
        socket.on('node update', request => { console.log('node update'); });
        socket.on('node remove', request => { console.log('node remove'); });
        socket.on('route add', request => { console.log('route add'); });
        socket.on('route update', request => { console.log('route update'); });
        socket.on('route remove', request => { console.log('route remove'); });
        socket.on('node fetch', request => { console.log('node fetch'); });
        socket.on('rote fetch', request => { console.log('rote fetch'); });

// emitNetworkResources
// emitNodeAdd
// emitNodeUpdate
// emitNodeRemove
// emitRouteAdd
// emitRouteUpdate
// emitRouteRemove
// emitFetchNode
// emitFetchRoute
    }

    io.on('connection', onConnection);

    return io;
};
