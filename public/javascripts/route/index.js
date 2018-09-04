define(['./route', './view', './helper', './controller'], function (Route, View, Helper, Controller) {
    console.log('Route loaded');
    return {
        Route: Route,
        View: View,
        Helper: Helper,
        Controller: Controller
    };
});
