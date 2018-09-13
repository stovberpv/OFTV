define([], function () {
    'use strict';

    function Node (obj) {
        let node = {
            type: 'node',
            guid: obj.guid ? obj.guid : null,
            isDeprecated: obj.isDeprecated ? obj.isDeprecated : null,
            coordinates: obj.coordinates ? parseCoords(obj.coordinates) : null,
            name: obj.name ? obj.name : null,
            description: obj.description ? obj.description : null
        };

        function parseCoords (coords) {
            let _coords = coords.split(',');

            return [parseFloat(_coords[0]), parseFloat(_coords[1])];
        }

        this.giud = { set: val => { node.guid = val; }, get: () => { return node.guid; } };
        this.isDeprecated = { set: val => { node.isDeprecated = val; }, get: () => { return node.isDeprecated; } };
        this.coordinates = { set: val => { node.coordinates = val; }, get: () => { return node.coordinates; } };
        this.name = { set: val => { node.name = val; }, get: () => { return node.name; } };
        this.description = { set: val => { node.description = val; }, get: () => { return node.description; } };

        this.toPrimitive = () => {
            let _node = node;
            _node.coordinates = _node.coordinates.toString();
            return _node;
        };

        return this;
    }

    return Node;
});
