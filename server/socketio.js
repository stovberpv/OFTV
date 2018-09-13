const SocketIO = require('socket.io');
const log = require('fancy-log');
const cv = require.main.require('../config/console');
const db = require.main.require('../db/db')();

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));

        socket.on('network resources request', e => {
            let query = db.request(e);
            query.then(r => { socket.emit('network resources requested', { type: e.type, data: r }); }, e => { log(e); });
        });
        socket.on('network resource read', (e, cb) => {
            let query = db.request(e);
            query.then(r => { cb(r[0]); }, e => { log(e); });
        });
        socket.on('network resource create', request => { console.log(`network resource create ${JSON.stringify(db.create(request))}`); });
        socket.on('network resource update', request => { console.log(`network resource update ${JSON.stringify(db.update(request))}`); });
        socket.on('network resource remove', request => { console.log(`network resource remove ${JSON.stringify(db.remove(request))}`); });
        /*
        network resources requested
        network resource updated
        network resource removed
        network resources request
        network resource update
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
