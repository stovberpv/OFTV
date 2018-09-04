define([], function () {
    'use strict';

    function View () {
        let _model =
            `
            <div class='node wrapper'>
                <div class='route-description'>
                    <label>Описание трассы</label>
                    <input type='text' required name='routeDescription' title='Описание трассы' autocomplete='on'>
                </div>
                <div class='cable-description'>
                    <label>Описание кабеля</label>
                    <input type='text' required name='cableDescription' title='Описание кабеля' autocomplete='on'>
                </div>
                <div class='cable-label-a'>
                    <label>Метка А</label>
                    <input type='text' required name='cableLabelA' title='Метка А' autocomplete='on'>
                </div>
                <div class='cable-label-b'>
                    <label>Метка Б</label>
                    <input type='text' required name='cableLabelB' title='Метка Б' autocomplete='on'>
                </div>
                <div class='cable-length'>
                    <label>Длина</label>
                    <input type='text' required name='cableLength' title='Длина' autocomplete='on'>
                </div>
                <div class='cable-cores'>
                    <label>Жильность</label>
                    <input type='text' required name='cableCores' title='Жильность' autocomplete='on'>
                </div>
                <div class='cable-type'>
                    <label>Тип кабеля</label>
                    <input type='text' required name='cableType' title='Тип кабеля' autocomplete='on'>
                </div>
                <div class='coordinate-path'>
                    <label>Координатный путь</label>
                    <input type='text' required name='coordinatePath' title='Координатный путь' autocomplete='on'>
                </div>
            </div>
            `.replace(/\s\s+/gmi, '');

        this.render = type => {
            let template = document.createElement('template');
            template.innerHTML = _model.trim();

            let types = {
                dom: template.content.firstChild,
                html: template.innerHTML
            };

            return types[type];
        }

        return this;
    }

    return View;
});
