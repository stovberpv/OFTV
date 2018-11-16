define([], function () {
    'use strict';

    function Node (obj) {
        let _node = {
            type: 'node',
            guid: obj.guid ? obj.guid : null,
            isDeprecated: obj.isDeprecated ? obj.isDeprecated : 0,
            coordinates: obj.coordinates ? parseCoords(obj.coordinates) : [],
            name: obj.name ? obj.name : '',
            description: obj.description ? obj.description : ''
        };

        function parseCoords (coords) {
            if (Array.isArray(coords)) return coords;
            let _coords = coords.split(',');

            return [parseFloat(_coords[0]), parseFloat(_coords[1])];
        }

        this.giud = { set: val => { _node.guid = val; }, get: () => { return _node.guid; } };
        this.isDeprecated = { set: val => { _node.isDeprecated = val; }, get: () => { return _node.isDeprecated; } };
        this.coordinates = { set: val => { _node.coordinates = val; }, get: () => { return _node.coordinates; } };
        this.name = { set: val => { _node.name = val; }, get: () => { return _node.name; } };
        this.description = { set: val => { _node.description = val; }, get: () => { return _node.description; } };

        this.toPrimitive = () => {
            let nodePrimitive = Object.assign({}, _node);
            nodePrimitive.coordinates = nodePrimitive.coordinates.toString();
            return nodePrimitive;
        };

        return this;
    }

    return Node;
});
