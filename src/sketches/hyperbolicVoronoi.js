"use strict";
exports.__esModule = true;
exports.hyperbolicVoronoiSketch = void 0;
require("p5/lib/addons/p5.dom");
var linalg_1 = require("../linalg");
var model_1 = require("../model");
var geometry_1 = require("../geometry");
function hyperbolicVoronoiSketch(p5) {
    var drawOrigin = new geometry_1.Point(205, 205);
    var drawRadius = 400;
    var model;
    var points = [];
    // Graphical elements
    var modelSelect;
    // Layers
    var modelLayer;
    var tesselateLayer;
    var tesselateLayers = {};
    p5.setup = function () {
        var canvas = p5.createCanvas(1000, 800);
        canvas.parent("app");
        // Model
        model = new model_1.KleinModel(drawOrigin, drawRadius);
        // Layers
        modelLayer = p5.createGraphics(1000, 800);
        model.draw(modelLayer);
        // Voronoi points
        var g = new model_1.PCModel(drawOrigin, drawRadius).bulgeSubgroup(Math.sqrt(2) / 2);
        console.log(g);
        points.push(linalg_1.Vector.fromList(0, 0, 1));
        for (var i = 0; i < 3; ++i) {
            points.push(linalg_1.Vector.fromMatrix(g[i].multiply(points[0])).homogenize());
        }
        console.log(points);
        //while (points.length != 50) {
        //    let pCanvas = Point.randPoint(5, 405, 5, 405) ;
        //    let pModel = model.canvasToModel(pCanvas);
        //    if (pModel.normSquared() - 1 <= 1)
        //        points.push(pModel);
        //}
        // Graphical elements
        //draggables.push(new DraggablePoint(pCanvas.x, pCanvas.y));
        //draggables.push(new DraggablePoint(qCanvas.x, qCanvas.y));
        modelSelect = p5.createSelect();
        modelSelect.position(410, 10);
        modelSelect.option('Poincare');
        modelSelect.option('Klein');
        modelSelect.changed(updateModel);
        updateModel();
        //let _p = model.modelToCanvas(z);
        //let _q = model.modelToCanvas(w);
        //p = new DraggablePoint(_p.x, _p.y);
        //q = new DraggablePoint(_q.x, _q.y);
        //draggables.push(p);
        //draggables.push(q);
    };
    function updateModel() {
        var modelString = modelSelect.value();
        var oldModel = model;
        if (modelString == "Klein") {
            model = new model_1.KleinModel(drawOrigin, drawRadius);
        }
        else {
            model = new model_1.PoincareModel(drawOrigin, drawRadius);
        }
        model.cols = oldModel.cols;
        var hash = modelString + JSON.stringify(points);
        if (hash in tesselateLayers) {
            tesselateLayer = tesselateLayers[hash];
            console.log(tesselateLayers);
        }
        else {
            tesselateLayer = p5.createGraphics(1000, 800);
            model.tesselate(tesselateLayer, points);
            tesselateLayers[hash] = tesselateLayer;
        }
    }
    p5.draw = function () {
        p5.clear();
        //modelLayer.clear();
        modelLayer.noFill();
        tesselateLayer.noFill();
        p5.image(modelLayer, 0, 0);
        p5.image(tesselateLayer, 0, 0);
    };
}
exports.hyperbolicVoronoiSketch = hyperbolicVoronoiSketch;
