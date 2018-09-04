define([], function () {
    'use strict';

    function Properties () {
        let checkNumber = val => { if (/^\d+$/.test(val)) { return parseInt(val) } else { throw new Error(`Not a Number: ${val}`); } }

        let _properties = {
            coordinatePath: null,
            routeDescription: null,
            cableDescription: null,
            cableLabelA: null,
            cableLabelB: null,
            cableLength: null,
            cableCores: null,
            cableType: null
        };

        let setProperty = {
            coordinatePath: val => _properties.coordinatePath = val,
            routeDescription: val => _properties.routeDescription = val,
            cableDescription: val => _properties.cableDescription = val,
            cableLabelA: val => _properties.cableLabelA = checkNumber(val),
            cableLabelB: val => _properties.cableLabelB = checkNumber(val),
            cableLength: val => _properties.cableLength = checkNumber(val),
            cableCores: val => _properties.cableCores = checkNumber(val),
            cableType: val => _properties.cableType = val
        };

        this.set = (property, value) => { try { setProperty[property](value); } catch (e) { } }
        this.get = property => { return _properties[property]; }

        this.getAll = () => { return _properties; };

        return this;
    }

    return Properties;
});
