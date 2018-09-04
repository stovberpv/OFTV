define(['./properties', './view', './controller', './helper'], function (Properties, View, Controller, Helper) {
    'use strict';

    function Route () {
        // TODO : utils checkGuid
        let checkGUID = guid => {
            if (typeof guid !== 'string' || guid.length < 32) throw new Error(`Incorrect GUID: ${guid}`)
            return guid;
        };

        let _guid = null;
        let _isDeprecated = null;
        let _properties = new Properties();
        let _view = new View();
        let _controller = new Controller();
        let _helper = new Helper();

        this.setGuid = guid => _guid = checkGUID(guid);
        this.getGuid = () => { return _guid; };

        this.setIsDeprecated = isDeprecated => _isDeprecated = isDeprecated;
        this.getIsDeprecated = () => { return _isDeprecated; };

        this.setPropertу = (property, value) => { _properties.set(property, value); };
        this.getPropertу = property => { return _properties.get(property); };

        this.getView = () => { return _view };
        this.getController = () => { return _controller };
        this.getHelper = () => { return _helper };
        this.getProperties = () => { return _properties };

        this.create = route => {
            _guid = route.guid ? route.guid : null;
            _isDeprecated = route.isDeprecated ? route.isDeprecated : false;
            _properties.set('coordinatePath', route.coordinatePath || '');
            _properties.set('routeDescription', route.routeDescription || '');
            _properties.set('cableDescription', route.cableDescription || '');
            _properties.set('cableLabelA', route.cableLabelA || '');
            _properties.set('cableLabelB', route.cableLabelB || '');
            _properties.set('cableLength', route.cableLength || '');
            _properties.set('cableCores', route.cableCores || '');
            _properties.set('cableType', route.cableType || '');

            return this;
        };

        this.render = () => {
            return this.getHelper()
                        .attachTo(this.getView().render('dom'))
                        .fillView(this.getProperties().getAll())
                        .getView();
        };

        this.read = (dom, html) => {
            return this.getHelper()
                        .attachTo(dom, html)
                        .readView();
        };

        this.toObject = () => {
            return {
                guid: _guid,
                isDeprecated: _isDeprecated,
                coordinatePath: _properties.get('coordinatePath'),
                routeDescription: _properties.get('routeDescription'),
                cableDescription: _properties.get('cableDescription'),
                cableLabelA: _properties.get('cableLabelA'),
                cableLabelB: _properties.get('cableLabelB'),
                cableLength: _properties.get('cableLength'),
                cableCores: _properties.get('cableCores'),
                cableType: _properties.get('cableType'),
            };
        };

        return this;
    }

    return Route;
});
