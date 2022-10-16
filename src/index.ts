import P5 from "p5";
import "p5/lib/addons/p5.dom"

import {ComplexNumber, MobiusTransformation} from "./linalg"
import {Vector, Model, PoincareModel} from "./model"
import {Point, Draggable, DraggablePoint} from "./utils"

const sketch = (p5: P5) => {
    let model: PoincareModel;
    let draggables: Draggable[] = [];

    let p: DraggablePoint;
    let q: DraggablePoint;

	p5.setup = () => {
		const canvas = p5.createCanvas(1000, 800);
		canvas.parent("app");

		p5.background("white");

        model = new PoincareModel({x: 210, y: 210}, 400);

        let z = new ComplexNumber(1, 0);
        let w = new ComplexNumber(0, 1);

        let _p = model.modelToCanvas(z);
        let _q = model.modelToCanvas(w);

        p = new DraggablePoint(_p.x, _p.y);
        q = new DraggablePoint(_q.x, _q.y);

        draggables.push(p);
        draggables.push(q);
	};

    function polygon(p: Point, radius: number, npoints: number) {
        let angle = Math.PI * 2 / npoints;
        p5.beginShape();
        for (let a = 0; a < Math.PI * 2; a += angle) {
            let sx = p.x + Math.cos(a) * radius;
            let sy = p.y + Math.sin(a) * radius;
            p5.vertex(sx, sy);
        }
        p5.endShape(p5.CLOSE);
    }

	p5.draw = () => {
        p5.clear();

        p5.noFill();

        p5.push();
        p5.translate(700, 210);
        p5.rotate(Math.PI * 3/8);
        polygon({x: 0, y: 0}, 200, 8);
        p5.pop();

        model.draw(p5);
        model.drawPoint(p5, model.canvasToModel(p));
        model.drawPoint(p5, model.canvasToModel(q));

        model.drawGeodesic(p5, model.canvasToModel(p), model.canvasToModel(q));

        let modelMouse = model.canvasToModel({x: p5.mouseX, y: p5.mouseY});
        if (modelMouse.normSquared() > 1) {
            let newMouse = model.modelToCanvas(modelMouse.normalize());
            p5.mouseX = newMouse.x;
            p5.mouseY = newMouse.y;
        }
        for (let draggable of draggables) {
            draggable.update(p5);
            draggable.over(p5);
            draggable.show(p5);
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
};

new P5(sketch);
