const DBHelper = require.main.require('../database/helper');

module.exports = function () {
    const DATA_TYPES = {
        NODE: 'node',
        ROUTE: 'route'
    };

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
            // 'guid',
            'coordinates',
            'name',
            'description',
            'isDeprecated'
        ];
        let routeFields = [
            // 'guid',
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

        let query = { expA: null, expB: null, expC: null };
        let fields;
        let values;
        let table;

        if (data.type === DATA_TYPES.NODE) {
            fields = nodeFields;
            table = 'node';
        } else if (data.type === DATA_TYPES.ROUTE) {
            fields = routeFields;
            table = 'route';
        } else {
            fields = [];
            table = '';
        }

        values = fields.map(c => data[c]);

        {
            let len = fields.length - 1;
            query.expA = fields.reduce((p, c, i) => `${p}${c} = ?${i === len ? '' : ' AND '}`, '');
            query.expB = fields.reduce((p, c, i) => `${p}${c} = ?${i === len ? '' : ', '}`, '');
            query.expC = fields.reduce((p, c, i) => `${p}?${i === len ? '' : ','}`, '');
            query.expD = fields.reduce((p, c, i) => `${p}${c}${i === len ? '' : ', '}`, '');
        }

        return {
            fields: query,
            values: values,
            table: table,
            data: _data
        };
    }

    const REQUEST_TYPES = {
        MASS: 'M',
        SINGLE: 'S'
    };

    function read (data) {
        if (data.requestType === REQUEST_TYPES.MASS) {
            let db = new DBHelper();
            let prep = _prepare(data);
            return new Promise((resolve, reject) => {
                let query = db.all(`SELECT * FROM ${prep.table}`);
                query.then(r => { resolve(r); }).catch(e => { reject(e); });
            });
        } else if (data.requestType === REQUEST_TYPES.SINGLE) {
            let db = new DBHelper();
            let prep = _prepare(data);
            return new Promise((resolve, reject) => {
                let query = db.all(`SELECT * FROM ${prep.table} WHERE guid = ?`, [prep.data.guid]);
                query.then(r => { resolve(r); }).catch(e => { reject(e); });
            });
        }
    }
    function update (data) {
        let db = new DBHelper();
        let prep = _prepare(data);
        return new Promise((resolve, reject) => {
            let query = db.run(`UPDATE ${prep.table} SET ${prep.fields.expB} WHERE guid = ?`, [...prep.values, prep.data.guid]);
            query.then(r => {
                query = db.all(`SELECT * FROM ${prep.table} WHERE guid = ?`, [prep.data.guid]);
                query.then(r => { resolve(r[0]); }).catch(e => { reject(e); });
            }).catch(e => { reject(e); });
        });
    }
    function remove (data) {
        let db = new DBHelper();
        let prep = _prepare(data);
        return new Promise((resolve, reject) => {
            // let query = db.run(`DELETE FROM ${prep.table} WHERE guid = ?`, [prep.data.guid]);
            let query = db.run(`UPDATE ${prep.table} SET isDeprecated = 1 WHERE guid = ?`, [prep.data.guid]);
            query.then(r => { resolve({ guid: prep.data.guid, isDeprecated: !!r.changes }); }).catch(e => { reject(e); });
        });
    }
    function create (data) {
        let db = new DBHelper();
        let prep = _prepare(data);
        return new Promise((resolve, reject) => {
            let query = db.run(`INSERT INTO ${prep.table}(${prep.fields.expD}) VALUES(${prep.fields.expC})`, prep.values);
            query.then(r => {
                query = db.all(`SELECT * FROM ${prep.table} WHERE ROWID = ${r.lastID}`);
                query.then(r => { resolve(r[0]); }).catch(e => { reject(e); });
            }).catch(e => { reject(e); });
        });
    }

    return { read, create, update, remove };
};
