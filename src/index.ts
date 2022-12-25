import P5 from "p5";
import "p5/lib/addons/p5.dom";

import {Vector, ComplexNumber, MobiusTransformation, LinearTransformation} from "./linalg";
import {Simplex, Model, PoincareModel, KleinModel} from "./model";
import {Point, Draggable, DraggablePoint, randInt} from "./utils";

const sketch = (p5: P5) => {
    let model: Model;
    let draggables: Draggable[] = [];

    let generators: LinearTransformation[] = [];

    let x0: Vector;
    let p: Vector;
    let q: Vector;

	p5.setup = () => {
		const canvas = p5.createCanvas(1000, 800);
		canvas.parent("app");

		p5.background("white");

        model = new KleinModel({x: 210, y: 210}, 400);

        x0 = Vector.fromList(0, 0, 1);
        p = Vector.fromList(0.5, 0, 1);
        q = Vector.fromList(0, 0.5, 1);

        model.drawPoint(p5, p);
        model.drawPoint(p5, q);

        model.tesselate(p5, [p, q]);

        //console.log(model.d(x0, q));
        
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

        //let s = new Simplex([Vector.fromList(0, 0, 1), Vector.fromList(.5, 0, 1), Vector.fromList(0, .5, 1)]);
        //let circumcircle = s.circumcircle(model);
        //let circumcenter = model.modelToCanvas(circumcircle[0]);
        //p5.strokeWeight(3);
        //p5.point(circumcenter.x, circumcenter.y);

        /*******
        // Draw bisector between p and q by looking at each pixel
        let epsilon = .1;
        let A = [];

        for (let y = 0; y < 400; y += 0.5) {
            for (let x = 0; x < 400; x += 0.5) {
                let a = model.canvasToModel({x: x, y: y});
                if (Math.abs(model.d(p, a) - model.d(a, q)) < epsilon)
                    A.push(p);
            }
        }

        for (let i = 0; i < A.length; ++i)
            model.drawPoint(p5, A[i]);
        ********/

        //let _p = model.modelToCanvas(z);
        //let _q = model.modelToCanvas(w);
        //p = new DraggablePoint(_p.x, _p.y);
        //q = new DraggablePoint(_q.x, _q.y);
        //draggables.push(p);
        //draggables.push(q);
	};

	p5.draw = () => {
        //p5.clear();

        p5.noFill();

        model.draw(p5);
        //model.drawPoint(p5, x0);
        //model.drawPoint(p5, q);
        //let a = model.modelToCanvas(x0);
        //let b = model.modelToCanvas(q);
        //p5.stroke('blue');
        //p5.point(a.x, a.y);
        //p5.stroke('red');
        //p5.point(b.x, b.y);

        let modelMouse = model.canvasToModel({x: p5.mouseX, y: p5.mouseY});
        if (modelMouse.normSquared() > 1) {
            let newMouse = model.modelToCanvas(modelMouse.normalize());
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
};

new P5(sketch);
