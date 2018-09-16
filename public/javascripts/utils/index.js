define(['./eventbus', './geocode', './utils'], function (EventBus, geocode, utils) {
    console.log('Utils loaded');
    return {
        EventBus: EventBus,
        geocode: geocode,
        utils: utils
    };
});
