define(function (require) {
    'use strict';

    let ymaps = require('ymaps');
    let controller = require('./controller');
    let helper = require('./helper');
    let configIndex = require('config/index');
    let nodeIndex = require('node/index');
    let routeIndex = require('route/index');
    let popupIndex = require('popup/index');

    let map = (function () {
        let _instance;

        function map () {
            let bundle = {};

            bundle.initialize = () => ymaps.ready().then(r => { return pack(r); }); /* .catch(e => { throw new Error(e.message); }); */

            function pack (map) {
                bundle.map = map;
                bundle.ymaps = ymaps;

                bundle.texts = configIndex.locale;
                bundle.Node = nodeIndex.Node;
                bundle.Route = routeIndex.Route;
                bundle.popup = popupIndex.popup;

                helper(bundle);
                controller(bundle);

                delete bundle.initialize;

                return bundle;
            }

            return bundle;
        }

        function createInstance () {
            _instance = map();
            return _instance;
        }

        return {
            getInstance: function () {
                return _instance || createInstance();
            }
        };
    })();

    return map;
});
