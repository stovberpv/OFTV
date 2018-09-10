const SocketIO = require('socket.io');
const log = require('fancy-log');
const cv = require.main.require('../config/console');

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));
        socket.on('network resources request', request => { console.log(`network resources request ${JSON.stringify(request)}`); });
        socket.on('network resource add', request => { console.log(`network resource add ${JSON.stringify(request)}`); });
        socket.on('network resource update', request => { console.log(`network resource update ${JSON.stringify(request)}`); });
        socket.on('network resource remove', request => { console.log(`network resource remove ${JSON.stringify(request)}`); });
/*
network resources requested
network resources request
network resource updated
network resource update
network resource removed
network resource remove
*/
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
