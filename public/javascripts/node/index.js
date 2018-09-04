define(['./node', './view', './helper', './controller'], function (Node, View, Helper, Controller) {
    console.log('Node loaded');
    return {
        Node: Node,
        View: View,
        Helper: Helper,
        Controller: Controller
    };
});
