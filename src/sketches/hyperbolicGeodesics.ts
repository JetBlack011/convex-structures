import P5, { Graphics } from "p5";
import "p5/lib/addons/p5.dom";

import { Vector } from "../linalg";
import { DiskModel, PoincareModel, KleinModel } from "../model"
import { Point, Draggable, DraggablePoint } from "../geometry";

export function hyperbolicGeodesicsSketch(p5: P5): void {
    let drawOrigin = new Point(205, 205);
    let drawRadius = 400;
    let model: DiskModel;

    let draggables: Draggable[] = [];

    let pCanvas: DraggablePoint;
    let qCanvas: DraggablePoint;

    // Graphical elements
    let modelSelect;

    p5.setup = () => {
		const canvas = p5.createCanvas(1000, 800);
		canvas.parent("app");

        // Model
        model = new PoincareModel(drawOrigin, drawRadius);

        modelSelect = p5.createSelect();
        modelSelect.position(410, 10);
        modelSelect.option('Poincare');
        modelSelect.option('Klein');
        modelSelect.changed(updateModel);

        let pModel = Vector.fromList(0, 0, 1);
        let qModel = Vector.fromList(0.5, 0, 1);
        let _p = model.modelToCanvas(pModel);
        let _q = model.modelToCanvas(qModel);
        pCanvas = new DraggablePoint(_p.x, _p.y);
        qCanvas = new DraggablePoint(_q.x, _q.y);
        draggables.push(pCanvas);
        draggables.push(qCanvas);
	};

    function updateModel(): void {
        let modelString = modelSelect.value();
        let oldModel = model;

        if (modelString == "Klein") {
            model = new KleinModel(drawOrigin, drawRadius);
        } else {
            model = new PoincareModel(drawOrigin, drawRadius);
        }
        model.cols = oldModel.cols;
    }

    p5.draw = () => {
        p5.noFill();
        p5.clear();

        model.draw(p5);

        let pModel = model.canvasToModel(pCanvas);
        let qModel = model.canvasToModel(qCanvas);
        model.drawGeodesic(p5, pModel, qModel);

        let modelMouse = model.canvasToModel(new Point(p5.mouseX, p5.mouseY));
        
        if (modelMouse.xy().normSquared() > 1) {
            let newMouse = model.modelToCanvas(modelMouse.normalizeXY());
            p5.mouseX = newMouse.x;
            p5.mouseY = newMouse.y;
        }

        for (let draggable of draggables) {
            draggable.update(p5);
            draggable.over(p5);
            draggable.draw(p5);
        }
    };

    p5.mousePressed = () => {
        for (let draggable of draggables)
            draggable.pressed(p5);
    };

    p5.mouseReleased = () => {
        for (let draggable of draggables)
            draggable.released(p5);
    };
}
