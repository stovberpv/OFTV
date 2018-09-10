define([], function () {
    'use strict';

    function view () {
        function render () {
            return `<div class='node wrapper'>
                        <div class='name'><label>Название</label><input type='text' value='{{ properties.external.name }}'></div>
                        <div class='description'><label>Описание</label><input type='text' value='{{ properties.external.description }}'></div>
                    </div>`.replace(/\s\s+/gmi, '');
        }

        return { render: render };
    }

    return view();
});
