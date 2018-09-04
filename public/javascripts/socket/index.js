define(['./socket', './routes'], function (Socket, Routes) {
    console.log('Socket loaded');
    return {
        Socket: Socket,
        Routes: Routes
    };
});
