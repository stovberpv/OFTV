define([], function () {
    'use strict';

    function Route (obj) {
        let _route = {
            type: 'route',
            guid: obj.guid ? obj.guid : null,
            isDeprecated: obj.isDeprecated ? obj.isDeprecated : 0,
            coordinatePath: obj.coordinatePath ? parseCoords(obj.coordinatePath) : [],
            routeDescription: obj.routeDescription ? obj.routeDescription : '',
            cableDescription: obj.cableDescription ? obj.cableDescription : '',
            cableLabelA: obj.cableLabelA ? obj.cableLabelA : 0,
            cableLabelB: obj.cableLabelB ? obj.cableLabelB : 0,
            cableLength: obj.cableLength ? obj.cableLength : 0,
            cableCores: obj.cableCores ? obj.cableCores : 0,
            cableType: obj.cableType ? obj.cableType : ''
        };

        function parseCoords (coords) {
            if (Array.isArray(coords)) return coords;
            let _coords = coords.split(',');
            _coords = _coords.map(v => parseFloat(v));
            let arr = new Array(_coords.length / 2);
            arr.fill([]);
            return arr.map((v, i) => _coords.slice((i * 2), (i * 2) + 2));
        }

        this.giud = { set: val => { _route.guid = val; }, get: () => { return _route.guid; } };
        this.isDeprecated = { set: val => { _route.isDeprecated = val; }, get: () => { return _route.isDeprecated; } };
        this.coordinatePath = { set: val => { _route.coordinatePath = val; }, get: () => { return _route.coordinatePath; } };
        this.routeDescription = { set: val => { _route.routeDescription = val; }, get: () => { return _route.routeDescription; } };
        this.cableDescription = { set: val => { _route.cableDescription = val; }, get: () => { return _route.cableDescription; } };
        this.cableLabelA = { set: val => { _route.cableLabelA = val; }, get: () => { return _route.cableLabelA; } };
        this.cableLabelB = { set: val => { _route.cableLabelB = val; }, get: () => { return _route.cableLabelB; } };
        this.cableLength = { set: val => { _route.cableLength = val; }, get: () => { return _route.cableLength; } };
        this.cableCores = { set: val => { _route.cableCores = val; }, get: () => { return _route.cableCores; } };
        this.cableType = { set: val => { _route.cableType = val; }, get: () => { return _route.cableType; } };

        this.toPrimitive = () => {
            let routePrimitive = Object.assign({}, _route);
            routePrimitive.coordinatePath = routePrimitive.coordinatePath.toString();
            return routePrimitive;
        };

        return this;
    }

    return Route;
});
