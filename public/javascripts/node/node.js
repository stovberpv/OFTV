define([], function () {
    'use strict';

    function Node (obj) {
        let node = {
            type: 'node',
            guid: obj.guid ? obj.guid : null,
            isDeprecated: obj.isDeprecated ? obj.isDeprecated : null,
            coordinates: obj.coordinates ? obj.coordinates : null,
            name: obj.name ? obj.name : null,
            description: obj.description ? obj.description : null
        };

        this.giud = { set: val => { node.guid = val; }, get: () => { return node.guid; } };
        this.isDeprecated = { set: val => { node.isDeprecated = val; }, get: () => { return node.isDeprecated; } };
        this.coordinates = { set: val => { node.coordinates = val; }, get: () => { return node.coordinates; } };
        this.name = { set: val => { node.name = val; }, get: () => { return node.name; } };
        this.description = { set: val => { node.description = val; }, get: () => { return node.description; } };

        this.toPrimitive = () => { return node; };

        return this;
    }

    return Node;
});
