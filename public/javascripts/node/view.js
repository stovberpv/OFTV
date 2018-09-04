define([], function () {
    'use strict';

    function View () {
        let _model =
            `
            <div class='node wrapper'>
                <div class='name'>
                    <label>Название</label>
                    <input type='text' required name='name' title='name' autocomplete='on'>
                </div>
                <div class='description'>
                    <label>Описание</label>
                    <input type='text' required name='description' title='description' autocomplete='on'>
                </div>
                <div class='coordinates'>
                    <label>Координаты</label>
                    <input type='text' required name='coordinates' title='coordinates' autocomplete='off'>
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
