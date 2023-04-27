import P5, { Graphics } from "p5";
import "p5/lib/addons/p5.dom";

import { EPSILON, Matrix, Vector } from "../linalg";
import { DiskModel, PoincareModel, KleinModel, ConvexProjectiveModel } from "../model"
import { Point } from "../geometry";

export function hyperbolicVoronoiSketch(p5: P5): void {
    let drawOrigin = new Point(205, 205);
    let drawRadius = 400;
    let model: DiskModel;

    let points = [];

    // Graphical elements
    let modelSelect;
    let pointsInput;
    let submitButton;

    let prevPoints: number;
    
    // Layers
    let modelLayer;
    let tesselateLayer;
    let tesselateLayers = {};

    p5.setup = () => {
		const canvas = p5.createCanvas(1000, 800);
		canvas.parent("app");

        // Model
        model = new PoincareModel(drawOrigin, drawRadius);

        // Layers
        modelLayer = p5.createGraphics(1000, 800);

        model.draw(modelLayer);

        // Voronoi points
        //let g = new ConvexProjectiveModel(drawOrigin, drawRadius).bulgeSubgroup(Math.sqrt(2)/2);
        //console.log(g);
        //points.push(Vector.fromList(0, 0, 1));

        //for (let i = 0; i < 100; ++i) {
        //    if (!g[i].equals(Matrix.identity(3), EPSILON))
        //        points.push(Vector.fromMatrix(g[i].multiply(points[0])).homogenize());
        //}

        //console.log(points);

        //points = points.filter((p, index, self) => {
        //    return index === self.findIndex((q) => q.equals(p, EPSILON));
        //});

        //console.log(points);

        // Graphical elements
        //draggables.push(new DraggablePoint(pCanvas.x, pCanvas.y));
        //draggables.push(new DraggablePoint(qCanvas.x, qCanvas.y));

        modelSelect = p5.createSelect();
        modelSelect.position(410, 10);
        modelSelect.option('Poincare');
        modelSelect.option('Klein');
        modelSelect.changed(updateModel);

        pointsInput = p5.createInput();
        pointsInput.position(410, 40);
        pointsInput.style('width', '80px');
        pointsInput.attribute('type', 'number');
        pointsInput.attribute('value', 5);
        prevPoints = pointsInput.value();

        submitButton = p5.createButton('Update');
        submitButton.position(410, 70);
        submitButton.mousePressed(validateAndUpdate);

        tesselateLayer = p5.createGraphics(1000, 800);

        validateAndUpdate();

        //updateModel();

        //let _p = model.modelToCanvas(z);
        //let _q = model.modelToCanvas(w);
        //p = new DraggablePoint(_p.x, _p.y);
        //q = new DraggablePoint(_q.x, _q.y);
        //draggables.push(p);
        //draggables.push(q);
	};

    function validateAndUpdate(): void {
        let p = pointsInput.value();
        if (0 < p && p <= 100) {
            while (points.length < p) {
                let pCanvas = Point.randPoint(5, 405, 5, 405) ;
                let pModel = model.canvasToModel(pCanvas);
                if (pModel.normSquared() - 1 <= 1)
                    points.push(pModel);
            }
            updateModel();
        } else {
            alert("Please enter a number between 1 and 100");
        }
    }

    function updateModel(): void {
        let modelString = modelSelect.value();
        let oldModel = model;

        if (modelString == "Klein") {
            model = new KleinModel(drawOrigin, drawRadius);
        } else {
            model = new PoincareModel(drawOrigin, drawRadius);
        }
        model.cols = oldModel.cols;

        let hash = modelString + JSON.stringify(points);

        if (hash in tesselateLayers) {
            tesselateLayer = tesselateLayers[hash];
            console.log(tesselateLayers);
        } else {
            tesselateLayer = p5.createGraphics(1000, 800);
            model.tesselate(tesselateLayer, points);
            tesselateLayers[hash] = tesselateLayer;
        }
    }

    p5.draw = () => {
        //modelLayer.clear();
        modelLayer.noFill();
        tesselateLayer.noFill();

        let points = pointsInput.value();

        p5.image(modelLayer, 0, 0);
        p5.image(tesselateLayer, 0, 0);
        p5.text('Points', 500, 20);
    }
}
