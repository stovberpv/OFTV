define(['./helper', './routes'], function (helper, routes) {
    console.log('Socket loaded');
    return {
        helper: helper,
        routes: routes
    };
});
