"use strict";
exports.__esModule = true;
exports.hilbertBisectorSketch = void 0;
require("p5/lib/addons/p5.dom");
var linalg_1 = require("../linalg");
var model_1 = require("../model");
var utils_1 = require("../utils");
function hilbertBisectorSketch(p5) {
    // Model
    var model;
    var pModel = linalg_1.Vector.fromList(0, 0, 1);
    var qModel = linalg_1.Vector.fromList(0.1, 0.5, 1);
    var pCanvas;
    var qCanvas;
    var defaultBulge = 0.5;
    var prevBulge = -1;
    // Graphical elements
    var draggables = [];
    var bulgeSlider;
    var bisectorButton;
    // Layers
    var modelLayer;
    var chordLayer;
    var bisectorLayer;
    var drawChord = true;
    p5.setup = function () {
        var canvas = p5.createCanvas(1000, 800);
        canvas.parent("app");
        p5.background("white");
        // Model
        model = new model_1.PCModel(new utils_1.Point(400, 400), 100);
        pCanvas = model.modelToCanvas(pModel);
        qCanvas = model.modelToCanvas(qModel);
        // Layers
        modelLayer = p5.createGraphics(1000, 800);
        chordLayer = p5.createGraphics(1000, 800);
        bisectorLayer = p5.createGraphics(1000, 800);
        // Graphical elements
        bulgeSlider = p5.createSlider(-4, 4, 0, 0.01);
        bulgeSlider.position(10, 10);
        bulgeSlider.style('width', '80px');
        bisectorButton = p5.createButton('Bisector');
        bisectorButton.position(10, 40);
        bisectorButton.mousePressed(drawBisector);
        draggables.push(new utils_1.DraggablePoint(pCanvas.x, pCanvas.y));
        draggables.push(new utils_1.DraggablePoint(qCanvas.x, qCanvas.y));
        // Triangular reflection group case
        /*************
        let coshphi = 2/Math.sqrt(3) * Math.sqrt((2 + Math.sqrt(2))/2);
        let sinhphi = Math.sqrt(coshphi**2 - 1);
        let h = new LinearTransformation(3, 3,
            [[coshphi, 0, sinhphi],
             [0, 1, 0],
             [sinhphi, 0, coshphi]]);
        let r = h.compose(new LinearTransformation(3, 3, [[1,0,0],[0,-1,0],[0,0,-1]])).compose(h.inverse());
        let R = new LinearTransformation(3, 3, [[Math.cos(2 * Math.PI/3), -Math.sin(2 * Math.PI/3), 0], [Math.sin(2 * Math.PI / 3), Math.cos(2 * Math.PI/3), 0], [0,0,1]]);

        generators.push(r);
        generators.push(R.compose(r).compose(R.inverse()));
        generators.push(R.compose(R).compose(r).compose(R.inverse()).compose(R.inverse()));

        let Q = new LinearTransformation(3, 3, [[1, 0, 0], [0, 1, 0], [0, 0, -1]]);

        for (let i = 0; i < generators.length; ++i) {
            console.log(generators[i].transpose().compose(Q).compose(generators[i]).mat);
        }

        let a = model.modelToCanvas(x0);
        p5.strokeWeight(5);
        p5.stroke('red');
        p5.point(a.x, a.y);

        for (let i = 0; i < 100; ++i) {
            model.push();
            for (let j = 0; j < 10; ++j) {
                let a = randInt(0,3);
                model.transfrom(generators[a]);
                model.drawPoint(p5, x0);
            }
            model.pop();
        }
        *******/
        //let _p = model.modelToCanvas(z);
        //let _q = model.modelToCanvas(w);
        //p = new DraggablePoint(_p.x, _p.y);
        //q = new DraggablePoint(_q.x, _q.y);
        //draggables.push(p);
        //draggables.push(q);
    };
    function drawBisector() {
        bisectorLayer.clear();
        model.drawBisector(bisectorLayer, pModel, qModel);
    }
    p5.draw = function () {
        p5.clear();
        modelLayer.noFill();
        chordLayer.noFill();
        bisectorLayer.noFill();
        var bulge = Math.sqrt(2) / 2 * Math.exp(bulgeSlider.value());
        if (bulge != prevBulge) {
            prevBulge = bulge;
            modelLayer.clear();
            console.log();
            model.setBulge(bulge, modelLayer);
            model.draw(modelLayer);
            drawChord = true;
            model.clearChordCache();
        }
        p5.image(bisectorLayer, 0, 0);
        p5.image(chordLayer, 0, 0);
        p5.image(modelLayer, 0, 0);
        for (var _i = 0, draggables_1 = draggables; _i < draggables_1.length; _i++) {
            var draggable = draggables_1[_i];
            draggable.update(p5);
            draggable.over(p5);
            draggable.draw(p5);
            if (draggable.dragging)
                drawChord = true;
        }
        if (drawChord) {
            drawChord = false;
            chordLayer.clear();
            pModel = model.canvasToModel(draggables[0]);
            qModel = model.canvasToModel(draggables[1]);
            var chord = model.chord(pModel, qModel);
            var _a = [chord.v1, chord.v2], a = _a[0], b = _a[1];
            chordLayer.strokeWeight(1);
            chordLayer.stroke('blue');
            chordLayer.line(model.modelToCanvas(a).x, model.modelToCanvas(a).y, model.modelToCanvas(b).x, model.modelToCanvas(b).y);
            model.drawPoint(chordLayer, a);
            model.drawPoint(chordLayer, b);
        }
    };
    p5.mousePressed = function () {
        for (var _i = 0, draggables_2 = draggables; _i < draggables_2.length; _i++) {
            var draggable = draggables_2[_i];
            draggable.pressed(p5);
        }
    };
    p5.mouseReleased = function () {
        for (var _i = 0, draggables_3 = draggables; _i < draggables_3.length; _i++) {
            var draggable = draggables_3[_i];
            draggable.released(p5);
        }
    };
}
exports.hilbertBisectorSketch = hilbertBisectorSketch;
