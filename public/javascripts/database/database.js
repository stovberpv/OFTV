define(['./helper', './controller'], function (helper, controller) {
    'use strict';

    let Database = (function () {
        let _instance;

        function database () {
            let bundle = {};

            bundle.initialize = () => {
                pack();
            };

            function pack () {
                helper(bundle);
                controller(bundle);

                delete bundle.initialize;
            }

            return bundle;
        }

        function createInstance () {
            _instance = database();
            return _instance;
        }

        return {
            getInstance: function () {
                return _instance || createInstance();
            }
        };
    })();

    return Database;
});
