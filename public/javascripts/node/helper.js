define([], function () {
    'use strict';

    function Helper () {
        let _view = null;
        let _elements = {
            name: null,
            coordinates: null,
            description: null
        };

        this.getView = () => { return _view; };

        function parseHTML (html) {
            let template = document.createElement('template');
            template.innerHTML = html;

            return template.content.firstChild;
        }

        this.attachTo = (DOMview, HTMLView) => {
            _view = DOMview || parseHTML(HTMLView);

            _elements.name = _view.querySelector('.name input');
            _elements.coordinates = _view.querySelector('.coordinates input');
            _elements.description = _view.querySelector('.description input');

            return this;
        };
        this.fillView = values => {
            if (values.name) {
                _elements.name.value = values.name;
                _elements.name.setAttribute('value', values.name);
            }

            if (values.coordinates) {
                _elements.coordinates.value = values.coordinates;
                _elements.coordinates.setAttribute('value', values.coordinates);
            }

            if (values.description) {
                _elements.description.value = values.description;
                _elements.description.setAttribute('value', values.description);
            }

            return this;
        };
        this.readView = () => {
            return {
                name: _elements.name ? _elements.name.value : null,
                coordinates: _elements.coordinates ? _elements.coordinates.value : null,
                description: _elements.description ? _elements.description.value : null
            };
        }

        return this;
    }

    return Helper;
});
