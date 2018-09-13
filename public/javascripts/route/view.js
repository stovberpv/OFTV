define([], function () {
    'use strict';

    function view () {
        function render () {
            return `<div class='node wrapper'>
                        <div class='route-description'>
                            <label>Описание трассы</label>
                            <input name='routeDescription' type='text' value='{{ properties.external.routeDescription }}'>
                        </div>
                        <div class='cable-description'>
                            <label>Описание кабеля</label>
                            <input name='cableDescription' type='text' value='{{ properties.external.cableDescription }}'>
                        </div>
                        <div class='cable-label-a'>
                            <label>Метка А</label>
                            <input name='cableLabelA' type='text' value='{{ properties.external.cableLabelA }}'>
                        </div>
                        <div class='cable-label-b'>
                            <label>Метка Б</label>
                            <input name='cableLabelB' type='text' value='{{ properties.external.cableLabelB }}'>
                        </div>
                        <div class='cable-length'>
                            <label>Длина</label>
                            <input name='cableLength' type='text' value='{{ properties.external.cableLength }}'>
                        </div>
                        <div class='cable-cores'>
                            <label>Жильность</label>
                            <input name='cableCores' type='text' value='{{ properties.external.cableCores }}'>
                        </div>
                        <div class='cable-type'>
                            <label>Тип кабеля</label>
                            <input name='cableType' type='text' value='{{ properties.external.cableType }}'>
                        </div>
                    </div>`.replace(/\s\s+/gmi, '');
        }

        return { render: render };
    }

    return view();
});
