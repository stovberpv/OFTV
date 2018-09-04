define(['./properties', './view', './controller', './helper'], function (Properties, View, Controller, Helper) {
    'use strict';

    function Node () {
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

        this.create = node => {
            _guid = node.guid ? node.guid : null;
            _isDeprecated = node.isDeprecated ? node.isDeprecated : false;
            _properties.set('coordinates', node.coordinates || '');
            _properties.set('name', node.name || '');
            _properties.set('description', node.description || '');

            return this;
        }

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
                coordinates: _properties.get('coordinates'),
                name: _properties.get('name'),
                description: _properties.get('description'),
            };
        };

        return this;
    }

    return Node;
});
