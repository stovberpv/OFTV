require.config({
    baseUrl: 'javascripts',
    // waitSeconds: 20,
    paths: {
        '@app': ['.'],
        'ymap': './ymap',
        'node': './node',
        'route': './route',
        'popup': './popup',
        'utils': './utils',
        'config': './config',
        'socket': './socket',
        'database': './database',
        'eventbus': './lib/event.bus',
        'socketio': './lib/socket.io.slim',
        'ymaps': 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.map,package.controls,package.search,package.geoObjects,package.clusters'
    },
    shim: {
        'ymaps': { exports: 'ymaps' } // ,
        // 'socketio': { exports: 'socketio' }
    }
});

require(['@app/app'], function (app) {
    app().run();
});
