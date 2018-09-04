require.config({
    baseUrl: 'javascripts',
    // waitSeconds: 20,
    paths: {
        '@app': ['.'],
        'ymap': './ymap',
        'node': './node',
        'route': './route',
        'socket': './socket',
        'popup': './popup',
        'utils': './utils',
        'config': './config',
        'socketio': 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.slim',
        'ymaps': 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.map,package.controls,package.search,package.geoObjects,package.clusters'
    },
    shim: {
        'ymaps': { exports: 'ymaps' }
    }
});

require(['@app/app'], function (App) {
    let app = new App();
    app.run();
});
