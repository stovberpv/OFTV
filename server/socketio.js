const SocketIO = require('socket.io');
const log = require('fancy-log');
const cv = require.main.require('../config/console');
const dbController = require.main.require('../database/controller')();

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);

    io.on('connection', onConnection);

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);

        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));

        socket.on('read data', (e, cb) => {
            dbController.read(e).then(result => {
                if (cb) cb(result[0]);
                else socket.emit('data was read', { type: e.type, data: result });
            }, error => { log(error); });
        });
        socket.on('create data', e => {
            dbController.create(e).then(result => { socket.emit('data was created', { type: e.type, data: result }); }, error => { log(error); });
        });
        socket.on('update data', e => {
            dbController.update(e).then(result => { socket.emit('data was updated', { type: e.type, data: result }); }, error => { log(error); });
        });
        socket.on('remove data', e => {
            dbController.remove(e).then(result => { socket.emit('data was removed', { type: e.type, data: result }); }, error => { log(error); });
        });
    }

    return io;
};
