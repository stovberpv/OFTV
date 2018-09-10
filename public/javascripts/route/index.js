define(['./route', './view', './helper', './controller'], function (Route, view, Helper, Controller) {
    console.log('Route loaded');
    return {
        Route: Route,
        view: view,
        Helper: Helper,
        Controller: Controller
    };
});
