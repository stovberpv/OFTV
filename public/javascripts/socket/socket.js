define(['./helper', './controller', 'socketio', 'config/index'], function (helper, controller, io, configIndex) {
    'use strict';

    let Socket = (function () {
        let _instance;

        function socket () {
            let bundle = {};

            bundle.initialize = () => {
                bundle.io = io(`${configIndex.socket.host}:${configIndex.socket.port}`, configIndex.socket.options);
                pack();
            };

            function pack () {
                bundle.open = function () {
                    this.io.open();
                };

                helper(bundle);
                controller(bundle);

                delete bundle.initialize;
            }

            return bundle;
        }

        function createInstance () {
            _instance = socket();
            return _instance;
        }

        return {
            getInstance: function () {
                return _instance || createInstance();
            }
        };
    })();

    return Socket;
});
