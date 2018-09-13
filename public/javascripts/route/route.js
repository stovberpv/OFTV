define([], function () {
    'use strict';

    function Route (obj) {
        let route = {
            type: 'route',
            guid: obj.guid ? obj.guid : null,
            isDeprecated: obj.isDeprecated ? obj.isDeprecated : null,
            coordinatePath: obj.coordinatePath ? parseCoords(obj.coordinatePath) : [],
            routeDescription: obj.routeDescription ? obj.routeDescription : null,
            cableDescription: obj.cableDescription ? obj.cableDescription : null,
            cableLabelA: obj.cableLabelA ? obj.cableLabelA : null,
            cableLabelB: obj.cableLabelB ? obj.cableLabelB : null,
            cableLength: obj.cableLength ? obj.cableLength : null,
            cableCores: obj.cableCores ? obj.cableCores : null,
            cableType: obj.cableType ? obj.cableType : null
        };

        function parseCoords (coords) {
            let _coords = coords.split(',');
            _coords = _coords.map(v => parseFloat(v));
            let arr = new Array(_coords.length / 2);
            arr.fill([]);
            return arr.map((v, i) => _coords.slice((i * 2), (i * 2) + 2));
        }

        this.giud = { set: val => { route.guid = val; }, get: () => { return route.guid; } };
        this.isDeprecated = { set: val => { route.isDeprecated = val; }, get: () => { return route.isDeprecated; } };
        this.coordinatePath = { set: val => { route.coordinatePath = val; }, get: () => { return route.coordinatePath; } };
        this.routeDescription = { set: val => { route.routeDescription = val; }, get: () => { return route.routeDescription; } };
        this.cableDescription = { set: val => { route.cableDescription = val; }, get: () => { return route.cableDescription; } };
        this.cableLabelA = { set: val => { route.cableLabelA = val; }, get: () => { return route.cableLabelA; } };
        this.cableLabelB = { set: val => { route.cableLabelB = val; }, get: () => { return route.cableLabelB; } };
        this.cableLength = { set: val => { route.cableLength = val; }, get: () => { return route.cableLength; } };
        this.cableCores = { set: val => { route.cableCores = val; }, get: () => { return route.cableCores; } };
        this.cableType = { set: val => { route.cableType = val; }, get: () => { return route.cableType; } };

        this.toPrimitive = () => {
            let _route = route;
            _route.coordinatePath = _route.coordinatePath.toString();
            return _route;
        };

        return this;
    }

    return Route;
});
