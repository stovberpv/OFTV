define([], function () {
    'use strict';

    function helper (bundle) {
        bundle.isConnected = function () {
            // this.io.on('connect', () => {
            //     console.log(this.io.connected);
            // });
        };

        return bundle;
    }

    return helper;
});
