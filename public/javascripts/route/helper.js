define([], function () {
    'use strict';

    function Helper () {
        let _view = null;
        let _elements = {
            routeDescription: null,
            cableDescription: null,
            cableLabelA: null,
            cableLabelB: null,
            cableLength: null,
            cableCores: null,
            cableType: null,
            coordinatePath: null
        };

        this.getView = () => { return _view; };

        function parseHTML (html) {
            let template = document.createElement('template');
            template.innerHTML = html;

            return template.content.firstChild;
        }

        this.attachTo = (DOMview, HTMLView) => {
            _view = DOMview || parseHTML(HTMLView);

            _elements.routeDescription = _view.querySelector('.route-description input');
            _elements.cableDescription = _view.querySelector('.cable-description input');
            _elements.cableLabelA = _view.querySelector('.cable-label-a input');
            _elements.cableLabelB = _view.querySelector('.cable-label-b input');
            _elements.cableLength = _view.querySelector('.cable-length input');
            _elements.cableCores = _view.querySelector('.cable-cores input');
            _elements.cableType = _view.querySelector('.cable-type input');
            _elements.coordinatePath = _view.querySelector('.coordinate-path input');

            return this;
        };

        this.fillView = values => {
            if (values.routeDescription) {
                _elements.routeDescription.value = values.routeDescription;
                _elements.routeDescription.setAttribute('value', values.routeDescription);
            }

            if (values.cableDescription) {
                _elements.cableDescription.value = values.cableDescription;
                _elements.cableDescription.setAttribute('value', values.cableDescription);
            }

            if (values.cableLabelA) {
                _elements.cableLabelA.value = values.cableLabelA;
                _elements.cableLabelA.setAttribute('value', values.cableLabelA);
            }

            if (values.cableLabelB) {
                _elements.cableLabelB.value = values.cableLabelB;
                _elements.cableLabelB.setAttribute('value', values.cableLabelB);
            }

            if (values.cableLength) {
                _elements.cableLength.value = values.cableLength;
                _elements.cableLength.setAttribute('value', values.cableLength);
            }

            if (values.cableCores) {
                _elements.cableCores.value = values.cableCores;
                _elements.cableCores.setAttribute('value', values.cableCores);
            }

            if (values.cableType) {
                _elements.cableType.value = values.cableType;
                _elements.cableType.setAttribute('value', values.cableType);
            }

            if (values.coordinatePath) {
                _elements.coordinatePath.value = values.coordinatePath;
                _elements.coordinatePath.setAttribute('value', values.coordinatePath);
            }

            return this;
        };

        this.readView = () => {
            return {
                routeDescription: _elements.routeDescription ? _elements.routeDescription.value : null,
                cableDescription: _elements.cableDescription ? _elements.cableDescription.value : null,
                cableLabelA: _elements.cableLabelA ? _elements.cableLabelA.value : null,
                cableLabelB: _elements.cableLabelB ? _elements.cableLabelB.value : null,
                cableLength: _elements.cableLength ? _elements.cableLength.value : null,
                cableCores: _elements.cableCores ? _elements.cableCores.value : null,
                cableType: _elements.cableType ? _elements.cableType.value : null
            };
        }

        return this;
    }

    return Helper;
});
