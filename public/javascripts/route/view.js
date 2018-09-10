define([], function () {
    'use strict';

    function view () {
        function render () {
            return `<div class='node wrapper'>
                        <div class='route-description'><label>Описание трассы</label><input type='text' value='{{ properties.external.routeDescription }}'></div>
                        <div class='cable-description'><label>Описание кабеля</label><input type='text' value='{{ properties.external.cableDescription }}'></div>
                        <div class='cable-label-a'><label>Метка А</label><input type='text' value='{{ properties.external.cableLabelA }}'></div>
                        <div class='cable-label-b'><label>Метка Б</label><input type='text' value='{{ properties.external.cableLabelB }}'></div>
                        <div class='cable-length'><label>Длина</label><input type='text' value='{{ properties.external.cableLength }}'></div>
                        <div class='cable-cores'><label>Жильность</label><input type='text' value='{{ properties.external.cableCores }}'></div>
                        <div class='cable-type'><label>Тип кабеля</label><input type='text' value='{{ properties.external.cableType }}'></div>
                    </div>`.replace(/\s\s+/gmi, '');
        }

        return { render: render };
    }

    return view();
});
