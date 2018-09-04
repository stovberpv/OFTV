define(['./config', './socket'], function (config, socket) {
    console.log('Config loaded');
    return {
        config: config,
        socket: socket,
    };
});
