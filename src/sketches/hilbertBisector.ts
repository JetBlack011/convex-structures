import P5, { Graphics } from "p5";
import "p5/lib/addons/p5.dom";

import { Vector } from "../linalg";
import { ConvexProjectiveModel, HilbertBisectorDrawOption } from "../model";
import { Point, Draggable, DraggablePoint } from "../geometry";

export function hilbertBisectorSketch(p5: P5): void {
    // Model
    let model: ConvexProjectiveModel;

    let pModel: Vector = Vector.fromList(0, 0, 1);
    let qModel: Vector = Vector.fromList(0.1, 0.5, 1);
    let pCanvas: Point;
    let qCanvas: Point;
    
    let defaultBulge: number = 0.5;
    let prevBulge: number = -1;

    // Graphical elements
    let draggables: Draggable[] = [];
    let bulgeSlider;
    let bisectorButton;
    let drawOptionSelect;

    // Layers
    let modelLayer: Graphics;
    let chordLayer: Graphics;
    let bisectorLayer: Graphics;

    let drawChord: boolean = true;

	p5.setup = () => {
		const canvas = p5.createCanvas(1000, 800);
		canvas.parent("app");

		p5.background("white");

        // Model
        model = new ConvexProjectiveModel(new Point(400, 400), 100);
        pCanvas = model.modelToCanvas(pModel);
        qCanvas = model.modelToCanvas(qModel);

        // Layers
        modelLayer = p5.createGraphics(1000, 800);
        chordLayer = p5.createGraphics(1000, 800);
        bisectorLayer = p5.createGraphics(1000, 800);

        // Graphical elements
        bulgeSlider = p5.createSlider(-4, 4, 0, 0.01);
        bulgeSlider.position(10, 40);
        bulgeSlider.style('width', '80px');

        bisectorButton = p5.createButton('Bisector');
        bisectorButton.position(10, 70);
        bisectorButton.mousePressed(drawBisector);

        drawOptionSelect = p5.createSelect();
        drawOptionSelect.position(85, 70);
        drawOptionSelect.option('Epsilon');
        drawOptionSelect.option('Gradient');

        draggables.push(new DraggablePoint(pCanvas.x, pCanvas.y));
        draggables.push(new DraggablePoint(qCanvas.x, qCanvas.y));

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
        let drawOption: HilbertBisectorDrawOption;

        if (drawOptionSelect.value() == 'Epsilon')
            drawOption = HilbertBisectorDrawOption.Epsilon;
        else
            drawOption = HilbertBisectorDrawOption.Gradient;

        model.drawBisector(bisectorLayer, pModel, qModel, drawOption);
    }

	p5.draw = () => {
        p5.clear();
        modelLayer.noFill();
        chordLayer.noFill();
        bisectorLayer.noFill();

        let bulge = Math.sqrt(2)/2 * Math.exp(bulgeSlider.value());
        if (bulge != prevBulge) {
            prevBulge = bulge;
            modelLayer.clear();
            model.setBulge(bulge, modelLayer);
            model.draw(modelLayer);

            drawChord = true;
            model.clearChordCache();
        }

        p5.image(bisectorLayer, 0, 0);
        p5.image(chordLayer, 0, 0);
        p5.image(modelLayer, 0, 0);

        p5.text('Bulge', 100, 25);

        for (let draggable of draggables) {
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

            let chord = model.chord(pModel, qModel);
            let [a,b] = [chord.v1, chord.v2];
            chordLayer.strokeWeight(1);
            chordLayer.stroke('blue');
            chordLayer.line(model.modelToCanvas(a).x, model.modelToCanvas(a).y, model.modelToCanvas(b).x, model.modelToCanvas(b).y);

            model.drawPoint(chordLayer, a);
            model.drawPoint(chordLayer, b);
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
