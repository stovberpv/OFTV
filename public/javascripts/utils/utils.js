define([], function () {
    function setDraggable (target, draggingPoint) {
        var pos1 = 0;
        var pos2 = 0;
        var pos3 = 0;
        var pos4 = 0;

        target = target.querySelector(draggingPoint);
        target.onmousedown = dragMouseDown;

        function dragMouseDown (e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag (e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            target.style.top = `${target.offsetTop - pos2}px`;
            target.style.left = `${target.offsetLeft - pos1}px`;
        }

        function closeDragElement () {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    return {
        setDraggable: setDraggable
    };
});
