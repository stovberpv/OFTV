const DBHelper = require.main.require('../db/helper');

module.exports = function () {
    function _prepare (data) {
        let _data = {
            guid: data.guid,
            coordinates: data.coordinates,
            name: data.name,
            description: data.description,
            isDeprecated: data.isDeprecated,
            coordinatePath: data.coordinatePath,
            routeDescription: data.routeDescription,
            cableDescription: data.cableDescription,
            cableLabelA: data.cableLabelA,
            cableLabelB: data.cableLabelB,
            cableLength: data.cableLength,
            cableCores: data.cableCores,
            cableType: data.cableType
        };
        let nodeFields = [
            'guid',
            'coordinates',
            'name',
            'description',
            'isDeprecated'
        ];
        let routeFields = [
            'guid',
            'coordinatePath',
            'routeDescription',
            'cableDescription',
            'cableLabelA',
            'cableLabelB',
            'cableLength',
            'cableCores',
            'cableType',
            'isDeprecated'
        ];

        let fields = { expA: '', expB: '', expC: '' };
        let values;
        let table;

        if (data.type === 'node') {
            fields = nodeFields;
            table = 'node';
        } else if (data.type === 'route') {
            fields = routeFields;
            table = 'route';
        } else {
            fields = [];
            table = '';
        }

        values = fields.map(c => data[c]);

        {
            let len = fields.length - 1;
            fields.expA = fields.reduce((p, c, i) => `${p}${c} = ?${i === len ? '' : ' AND '}`, '');
            fields.expB = fields.reduce((p, c, i) => `${p}${c} = ?${i === len ? '' : ', '}`, '');
            fields.expC = fields.reduce((p, c, i) => `${p}?${i === len ? '' : ','}`, '');
        }

        return {
            field: fields,
            values: values,
            table: table,
            data: _data
        };
    }

    function request (data) {
        let db = new DBHelper();
        const prep = _prepare(data);
        return new Promise((resolve, reject) => {
            let fetch;
            if (prep.data.guid) {
                fetch = db.all(`SELECT * FROM ${prep.table} WHERE guid = ?`, [prep.data.guid]);
                fetch.then(r => { resolve(r); }, e => { reject(e); });
            } else {
                fetch = db.all(`SELECT * FROM ${prep.table}`);
                fetch.then(r => { resolve(r); }, e => { reject(e); });
            }
        });
    }
    function update (data) {
        let db = new DBHelper();
        const prep = _prepare(data);
        return db.run(`UPDATE ${prep.table} SET ${prep.expB}`, prep.values);
    }
    function remove (data) {
        let db = new DBHelper();
        const prep = _prepare(data);
        return db.run(`DELETE FROM ${prep.table} WHERE guid = ?`, [prep.data.guid]);
    }
    function create (data) {
        let db = new DBHelper();
        const prep = _prepare(data);
        return db.run(`INSERT INTO ${prep.table} VALUES(${prep.expC})`, prep.values);
    }

    return {
        request: request,
        update: update,
        remove: remove,
        create: create
    };
};
