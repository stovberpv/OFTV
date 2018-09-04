define([], function () {
    'use strict';

    function check () { }

    /**
     * TODO : https://v-ipc.ru/guides/coord
     * Форматы:
     *      1. Градусы минуты секунды, например 55° 47′ 27″, где:
     *           55 - градусы - целое число в диапазоне [-90, 90] для широты и [-180, 180] для долготы
     *           47 - минуты - положительное целое число в диапазоне [0, 59]
     *           27 - секунды - положительное целое или дробное число в диапазоне [0, 59.99].
     *      2. Градусы минуты, например 55° 47.450′, где:
     *           55 - градусы - целое число в диапазоне [-90, 90] для широты и [-180, 180] для долготы
     *           47.450 - минуты - положительное дробное число в диапазоне [0, 59.999]. допускается три знака после запятой.
     *      3. Градусы, например 55.79083°:
     *           дробное число в диапазоне [-90, 90] для широты и [-180, 180] для долготы. допускатся пять знаков после запятой, т.к. шесть знаков дают точность ± 0,1 метра, что избыточно.
     *
     * Положительность или отрицательность координат обозначают двуми способами:
     *      знаками «+» и «-»
     *      буквами (могут стоять как перед, так и после цифр):
     *          положительные значения: «N» северная широта, «E» восточная долгота
     *          отрицательные значения: «S» южная широта, «W» западная долгота
     *
     * @param {*} coord
     */
    function normalize (coord) {
        let defError = `Unable to normalized coordinates: ${coord}`;

        if (typeof coord === 'string') coord = coord.split(',');

        if (!Array.isArray(coord)) throw new Error(defError);
        if (coord.length !== 2) throw new Error(defError);
        if (coord.every(e => { return typeof e === 'string' ? !/(\r|\n|\t|\0)/gmi.test(e) : typeof e === 'number' ? true : false; })) throw new Error(defError);

        return coord;
    }

    return {
        check: check,
        normalize: normalize
    }
});
/*
var tokens = { '\n': '', '\r': '', '\t': '', '\0': '' };
el = el.replace(/\n|\r|\t|\0/gmi, matched => { return tokens[matched]; });
if (!/^\d+(\.|)\d+$/.test(el)) result = false;
el = parseFloat(el);
*/
