define(['./node', './view', './helper', './controller'], function (Node, view, Helper, Controller) {
    console.log('Node loaded');
    return {
        Node: Node,
        view: view,
        Helper: Helper,
        Controller: Controller
    };
});
