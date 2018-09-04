define([], function () {
    'use strict';

    function Properties () {
        // FIX utils
        let normalizeCoordinates = coordinates => {
            if (!coordinates) return;

            let defError = `Incorrect coordinates value: ${coordinates}`;
            let normalized = coordinates;

            switch (typeof normalized) {
                case 'string': normalized = coordinates.split(','); /* !!! No break; !!! */
                case 'object': if (normalized.length !== 2) throw new Error(defError); break;
                default: throw new Error(defError);
            }
            normalized = normalized.map(c => { return parseFloat(c); });
            if (normalized.includes(NaN)) throw new Error(defError);

            return normalized;
        }

        let _properties = {
            coordinates: null,
            name: null,
            description: null
        };

        let setProperty = {
            coordinates: val => _properties.coordinates = normalizeCoordinates(val),
            name: val => _properties.name = val,
            description: val => _properties.description = val
        };

        this.set = (property, value) => { try { setProperty[property](value); } catch (e) { } }
        this.get = property => { return _properties[property]; }

        this.getAll = () => { return _properties; };

        return this;
    }

    return Properties;
});
