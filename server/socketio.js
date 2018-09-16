const SocketIO = require('socket.io');
const log = require('fancy-log');
const cv = require.main.require('../config/console');
const dbController = require.main.require('../db/controller')();

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));

        socket.on('network resources request', e => {
            let query = dbController.request(e);
            query.then(r => { socket.emit('network resources requested', { type: e.type, data: r }); }, e => { log(e); });
        });
        socket.on('network resource read', (e, cb) => {
            let query = dbController.read(e);
            query.then(r => { cb(r[0]); }, e => { log(e); });
        });
        socket.on('network resource create', e => {
            let query = dbController.create(e);
            query.then(r => { socket.emit('network resource created', { type: e.type, data: r }); }, e => { log(e); });
        });
        socket.on('network resource update', e => {
            let query = dbController.update(e);
            query.then(r => { socket.emit('network resource updated', { type: e.type, data: r }); }, e => { log(e); });
        });
        socket.on('network resource remove', e => {
            let query = dbController.remove(e);
            query.then(r => { socket.emit('network resource removed', { type: e.type, data: r }); }, e => { log(e); });
        });
    }

    io.on('connection', onConnection);

    return io;
};
