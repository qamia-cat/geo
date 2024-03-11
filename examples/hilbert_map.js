
/* Mapping between line and square in the Hilbert curve.
 *
 * Requires support for inline SVG.
 *
 * Code by Brian Hayes, March 2013. Please feel free to
 * adopt or adapt anything here you find useful.
 */


(function() {

    var xmlns="http://www.w3.org/2000/svg";

    var containerDiv = document.getElementById("hilbert-container");

    var theSVG = document.getElementById("the-svg");
    var svgWidth = parseInt(theSVG.getAttribute("width"));
    var svgHeight = parseInt(theSVG.getAttribute("height"));

    var theFrame = document.getElementById("the-coordinate-frame");
    var hSpace = document.getElementById("h-space");
    var tSpace = document.getElementById("t-space");
    var mouseLayer = document.getElementById("mouse-layer");
    var mouseRect = document.getElementById("mouse-rect");
    mouseRect.onclick = mapPoints;

    var tBoxBot = -0.07;
    var tBoxMid = -0.05;
    var tBoxTop = -0.03;


    var Point = function(x, y) {
        this.x = x;
        this.y = y;
    }

    function drawTSegment(divisions) {
        var deltaX = 1 / divisions;
        var thickness = 0.002;
        var epsilon = thickness / 2;

        var theAxis = document.createElementNS(xmlns, "line");
        theAxis.setAttribute("x1", 0);
        theAxis.setAttribute("y1", tBoxMid);
        theAxis.setAttribute("x2", 1);
        theAxis.setAttribute("y2", tBoxMid);
        theAxis.setAttribute("stroke-width", thickness);
        theAxis.setAttribute("stroke", "black");
        tSpace.appendChild(theAxis);
        for ( var i=0; i<=divisions; i++ ) {
            var x = i * deltaX;
            var theTickMark = document.createElementNS(xmlns, "line");
            theTickMark.setAttribute("x1", x);
            theTickMark.setAttribute("y1", tBoxBot);
            theTickMark.setAttribute("x2", x);
            theTickMark.setAttribute("y2", tBoxTop);
            theTickMark.setAttribute("stroke-width", thickness);
            theTickMark.setAttribute("stroke", "black");
            tSpace.appendChild(theTickMark);
            var tickLabel = document.createElementNS(xmlns, "text");
            tickLabel.setAttribute("x", x * 600);
            tickLabel.setAttribute("y", 57);
            tickLabel.setAttribute("text-anchor", "middle");
            //			tickLabel.setAttribute("font-family", "'Helvetica Neue' Helvetica sans-serif");
            tickLabel.setAttribute("font-size", 15);
            if ( x === 0 ) {
                tickLabel.setAttribute("x", 5);
                tickLabel.textContent = "0";
            }
            else if ( x === 1 ) {
                tickLabel.setAttribute("x", 595);
                tickLabel.textContent = "1";
            }
            else {
                tickLabel.textContent = x.toFixed(3);
            }
            tickLabel.setAttribute("fill", "black");
            tickLabel.setAttribute("transform", "matrix(0.001666667 0 0 -0.001666667 0 0)");
            tSpace.appendChild(tickLabel);
        }
        var tBox = document.createElementNS(xmlns, "rect");
        tBox.setAttribute("x", 0);
        tBox.setAttribute("y", tBoxBot);
        tBox.setAttribute("width", 1);
        tBox.setAttribute("height", tBoxTop - tBoxBot);
        tBox.setAttribute("fill", "rgba(1,1,1,0)");
        tSpace.appendChild(tBox);
    }

    drawTSegment(8);



    function drawGrids(divisions) {
        var delta = 1 / divisions;
        var thickness = 0.002;
        for ( var i=1; i<divisions; i++ ) {
            var xy = i * delta;
            var latLine = document.createElementNS(xmlns, "line");
            latLine.setAttribute("x1", 0);
            latLine.setAttribute("y1", xy);
            latLine.setAttribute("x2", 1);
            latLine.setAttribute("y2", xy);
            latLine.setAttribute("stroke-width", thickness);
            latLine.setAttribute("stroke", "white");
            hSpace.appendChild(latLine);
            var lonLine = document.createElementNS(xmlns, "line");
            lonLine.setAttribute("x1", xy);
            lonLine.setAttribute("y1", 0);
            lonLine.setAttribute("x2", xy);
            lonLine.setAttribute("y2", 1);
            lonLine.setAttribute("stroke-width", thickness);
            lonLine.setAttribute("stroke", "white");
            hSpace.appendChild(lonLine);
        }
    }

    drawGrids(8);

    // the control panel

    var controlDiv = document.getElementById("controls");
    var clearButton = document.getElementById("clear-button");
    var tInput = document.getElementById("t-input");
    var xInput = document.getElementById("x-input");
    var yInput = document.getElementById("y-input");
    var goButton = document.getElementById("go-button");

    clearButton.onclick = deletePointPairs;


    function maybeRemove(ev) {
        if ( ev.shiftKey ) {
            this.lowlight();
            this.parentNode.removeChild(this);
        }
    }



    function deletePointPairs(ev) {
        var pairs = mouseLayer.getElementsByClassName("point-pair");
        while ( pairs.length ) {
            mouseLayer.removeChild(pairs[0]);
        }
    }

    tInput.onfocus = function() {
        xInput.value = "";
        yInput.value = "";
    }

    xInput.onfocus = function() {
        tInput.value = "";
    }

    yInput.onfocus = function() {
        tInput.value = "";
    }

    controlDiv.onkeypress = checkForReturnKey;

    function checkForReturnKey(ev) {
        if ( ev.charCode === 13 || ev.keyCode === 13 ) {
            parseInputFields();
        }
    }


    goButton.onclick = parseInputFields;

    function parseInputFields(ev) {
        var t, x, y, source, target;
        t = parseOneField(tInput.value);
        x = parseOneField(xInput.value);
        y = parseOneField(yInput.value);
        if (t && !(x || y) || (!t && x && y) ) {
            if ( t ) {
                for ( var i = 0; i < t.length; i++ ) {
                    source = new Point(t[i], tBoxMid);
                    target = hilbertMap(toQuadits(t[i]));
                    drawPointPair(source, target);
                }
            }
            else {
                for ( var j = 0; j < x.length; j++ ) {
                    for ( var k = 0; k < y.length; k++ ) {
                        target = new Point(x[j], y[k]);
                        t = hilbertMapInverse(x[j], y[k], 1 / 65536);
                        source = new Point(t, tBoxMid);
                        drawPointPair(source, target);
                    }
                }
            }
        }
    }



    function parseOneField(str) {
        var floater, fraction, wildFraction;
        if ( !str ) {
            return null;																					// exit 1: no input
        }
        fraction = str.split("/");
        if ( fraction.length === 2 ) {
            var num = parseInt(fraction[0]);
            var denom = parseInt(fraction[1]);
            if ( !isNaN(num) && !isNaN(denom) && denom != 0 ) {
                var quotient = num / denom;
                return parseOneField(quotient.toString());					// exit 2: recurse on fraction
            }
            else if ( fraction[0] === "*" && !isNaN(denom) && denom > 1 ) {
                wildFraction = [];
                for ( var i = 0; i <= denom; i++ ) {
                    wildFraction.push(i / denom);
                }
                return wildFraction;																// exit 3: multiple values
            }
        }
        floater = parseFloat(str);
        if ( !isNaN(floater) ) {
            if ( floater === 1 ) {
                return [floater];																		// exit 4a: single value === 1
            }
            else {
                return [Math.abs(floater) % 1];											// exit 4b: single value < 1
            }
        }
    }



    function calculateHilbertCurve(generation) {

        var sw = [0, 0.5, 0.5, 0, 0, 0];
        var nw = [0.5, 0, 0, 0.5, 0, 0.5];
        var ne = [0.5, 0, 0, 0.5, 0.5, 0.5];
        var se = [0, -0.5, -0.5, 0, 1, 0.5];

        var transformPoint = function(pt, mat) {
            var xx = pt.x * mat[0] + pt.y * mat[2] + mat[4];
            var yy = pt.x * mat[1] + pt.y * mat[3] + mat[5];
            return new Point(xx, yy);
        }

        var map = function(pts, mat) {
            var ptsCopy = pts.slice();
            for ( var i = 0; i < ptsCopy.length; i++ ) {
                ptsCopy[i] = transformPoint(ptsCopy[i], mat);
            }
            return ptsCopy;
        }

        var calcAux = function(pts, gen) {
            if ( gen === 0 ) {
                return pts;
            }
            else {
                return calcAux(map(pts, sw).concat(map(pts, nw), map(pts, ne), map(pts, se)), gen-1);
            }
        }

        var ppp = calcAux([new Point(0.5, 0.5)], generation);
        return calcAux([new Point(0.5, 0.5)], generation);
    }

    function pointListToXYString(pts) {
        var xys = [];
        for ( var i=0; i<pts.length; i++ ) {
            var p = pts[i];
            xys.push(p.x, p.y);
        }
        return xys.join(" ");
    }

    function drawHilbertCurve(generation) {
        var pts = calculateHilbertCurve(generation);
        var xys = pointListToXYString(pts);
        var hCurve = document.createElementNS(xmlns, "polyline");
        hCurve.setAttribute("points", xys);
        hCurve.setAttribute("stroke-width", "0.002");
        hCurve.setAttribute("stroke-linecap", "round");
        hCurve.setAttribute("stroke-linejoin", "round");
        hCurve.setAttribute("stroke", "rgba(26,55,111,0.25)");
        hCurve.setAttribute("fill", "none");
        hSpace.appendChild(hCurve);
    }

    drawHilbertCurve(5);


    function mapPoints(ev) {
        var source, target, quadits, t, p;
        source = fromMouseCoords(ev);
        if ( !source ) { return; }
        if ( source.y === tBoxMid ) {
            quadits = toQuadits(source.x);
            target = hilbertMap(quadits);
            p = drawPointPair(source, target);
            p.highlight();
        }
        else {
            t = hilbertMapInverse(source.x, source.y, 1 / 65536);
            target = new Point(t, tBoxMid);
            p = drawPointPair(target, source);
            p.highlight();
        }
    }


    function fromMouseCoords(ev) {
        var mx, my, x, y, pt;
        var epsilon = 0.002;
        if ( typeof ev.offsetX === "number" ) {
            mx = ev.offsetX;
            my = ev.offsetY;
        }
        else {
            pt = calculateOffsets(ev);
            mx = pt.x;
            my = pt.y;
        }
        x = mx / svgWidth;
        y = 1 - my / (svgHeight / 1.1);
        if ( x < 0 - epsilon || x > 1 + epsilon ) {
            return null;
        }
        x = Math.max(x, 0);
        x = Math.min(x, 1);
        if ( y > 1 + epsilon ) {
            return null;
        }
        y = Math.min(y, 1);
        if ( y > 0 - epsilon ) {
            y = Math.max(y, 0);
            return new Point(x, y);
        }
        else if ( y <= tBoxTop && y >= tBoxBot ) {
            y = tBoxMid;
            return new Point(x, y);
        }
        return null;
    }


    // Firefox doesn't provide offsetX and offsetY

    function calculateOffsets(ev) {
        var px, py, mx, my;
        var rx = 0;
        var ry = 0;
        if ( typeof ev.pageX != "number" ) {
            return new Point(0, 0);
        }
        px = ev.pageX;
        py = ev.pageY;
        for ( var e = containerDiv; e != null; e = e.offsetParent ) {
            rx += e.offsetLeft;
            ry += e.offsetTop;
        }
        mx = px - rx;
        my = py - ry;
        return new Point(mx, my);
    }



    function drawPointPair(tPoint, hPoint) {
        var theColor = calculateColor(tPoint.x);
        var pair = document.createElementNS(xmlns, "g");
        pair.setAttribute("class", "point-pair");
        pair.setAttribute("opacity", 0.5);
        var tDot = document.createElementNS(xmlns, "circle");
        tDot.setAttribute("cx", tPoint.x);
        tDot.setAttribute("cy", tPoint.y);
        tDot.setAttribute("r", 0.01);
        tDot.setAttribute("fill", theColor);
        pair.appendChild(tDot);
        var hDot = document.createElementNS(xmlns, "circle");
        hDot.setAttribute("cx", hPoint.x);
        hDot.setAttribute("cy", hPoint.y);
        hDot.setAttribute("r", 0.01);
        hDot.setAttribute("fill", theColor);
        pair.appendChild(hDot);
        var leader = document.createElementNS(xmlns, "line");
        leader.setAttribute("x1", tPoint.x);
        leader.setAttribute("y1", tPoint.y);
        leader.setAttribute("x2", hPoint.x);
        leader.setAttribute("y2", hPoint.y);
        leader.setAttribute("stroke-width", 0.003);
        leader.setAttribute("stroke", theColor);
        pair.appendChild(leader);
        mouseLayer.appendChild(pair);
        pair.onmouseover = highlight;
        pair.onmouseout = lowlight;
        pair.onclick = maybeRemove;
        pair.highlight = highlight;
        pair.lowlight = lowlight;
        return pair;
    }


    function highlight(ev) {
        this.setAttribute("opacity", 1.0);
        var ln = this.lastChild;
        var t = ln.x1.baseVal.value.toFixed(5);
        var x = ln.x2.baseVal.value.toFixed(5);
        var y = ln.y2.baseVal.value.toFixed(5);
        tInput.value = t;
        xInput.value = x;
        yInput.value = y;
    }

    function lowlight(ev) {
        this.setAttribute("opacity", 0.5);
        tInput.value = "";
        xInput.value = "";
        yInput.value = "";
    }


    function calculateColor(t) {
        var color00 = [200, 100, 50];
        var color25 = [200, 50, 100];
        var color50 = [100, 50, 200];
        var color75 = [50, 100, 200];
        var color100 = [50, 100, 100];
        var c;
        if ( t < 0.25 ) {	c = interpolate((t - 0) * 4, color00, color25); }
        else if ( t < 0.50 ) { c = interpolate((t - 0.25) * 4, color25, color50); }
        else if ( t < 0.75 ) { c = interpolate((t - 0.50) * 4, color50, color75); }
        else { c = interpolate((t - 0.75) * 4, color75, color100); }
        return "rgb(" + c.toString() + ")";
    }


    function interpolate(t, c1, c2) {
        var blend = c1.slice();
        for ( var i = 0; i < 3; i++) {
            blend[i] += Math.floor((c2[i] - c1[i]) * t);
        }
        return blend;
    }


    function toQuadits(n) {
        if ( n === 1 ) {
            return [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
        }
        else {
            var quads = [];
            while ( n > 0 ) {
                var n4 = n * 4;
                n = n4 % 1;
                quads = quads.concat(Math.floor(n4));
            }
            return quads;
        }
    }

    function hilbertMap(quadits) {
        if ( quadits.length === 0 ) {
            return new Point(0, 0);
        } else {
            return (function() {
                var pt, t, x, y;
                t = quadits.shift();
                pt = hilbertMap(quadits);
                x = pt.x;
                y = pt.y;
                switch(t) {
                    case 0:
                        return new Point(y * 0.5 + 0, x * 0.5 + 0);
                    case 1:
                        return new Point(x * 0.5 + 0, y * 0.5 + 0.5);
                    case 2:
                        return new Point(x * 0.5 + 0.5, y * 0.5 + 0.5);
                    case 3:
                        return new Point(y * -0.5 + 1.0, x * -0.5 + 0.5);
                }
            })();
        }
    }


    function hilbertMapInverse(x, y, depth) {
        var t;
        if ( depth > 1 ) {
            return 0;
        }
        else {
            if ( x < 0.5 ) {
                if ( y < 0.5 ) {
                    return (hilbertMapInverse(y * 2, x * 2, depth * 4) + 0) / 4;
                }
                else {
                    return (hilbertMapInverse(x * 2, y * 2 - 1, depth * 4) + 1) / 4;
                }
            }
            else {
                if ( y >= 0.5 ) {
                    return (hilbertMapInverse(x * 2 - 1, y * 2 - 1, depth * 4) + 2) / 4;
                }
                else {
                    return (hilbertMapInverse(1 - y * 2, 2 - x * 2, depth * 4) + 3) / 4;
                }
            }
        }
    }



})();


