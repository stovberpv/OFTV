define(['ymaps'], function (ymaps) {
    'use strict';

    async function load () {
        return new Promise((resolve, reject) => {
            ymaps.ready(map => { resolve(map); }, e => { reject(e); });
        });
    };

    return {
        load: load
    };
});
