import P5 from "p5";
import {Point} from "./model";

class Draggable implements Point {
    x: number;
    y: number;
    w: number;
    h: number;
    offsetX: number;
    offsetY: number;

    dragging: boolean;
    rollover: boolean;

    constructor(x: number, y: number, w: number, h: number) {
        this.dragging = false; // Is the object being dragged?
        this.rollover = false; // Is the mouse over the ellipse?

        this.x = x;
        this.y = y;
        // Dimensions
        this.w = w;
        this.h = h;
    }

    over(p5: P5) {
        // Is mouse over object
        if (p5.mouseX > this.x - this.w / 2 && p5.mouseX < this.x + this.w / 2 && p5.mouseY > this.y - this.h / 2 && p5.mouseY < this.y + this.h / 2) {
            this.rollover = true;
        } else {
            this.rollover = false;
        }

    }

    update(p5: P5) {
        // Adjust location if being dragged
        if (this.dragging) {
            this.x = p5.mouseX + this.offsetX;
            this.y = p5.mouseY + this.offsetY;
        }
    }

    show(p5: P5) {
        p5.stroke(0);
        // Different fill based on state
        if (this.dragging) {
            p5.fill(50);
        } else if (this.rollover) {
            p5.fill(100);
        } else {
            p5.fill(0);
        }
        p5.circle(this.x, this.y, this.w);
        // p5.rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    }

    pressed(p5: P5) {
        // Did I click on the rectangle?
        if (p5.mouseX > this.x - this.w / 2 && p5.mouseX < this.x + this.w / 2 && p5.mouseY > this.y - this.h / 2 && p5.mouseY < this.y + this.h / 2) {
            this.dragging = true;
            // If so, keep track of relative location of click to corner of rectangle
            this.offsetX = this.x - p5.mouseX;
            this.offsetY = this.y - p5.mouseY;
        }
    }

    released(p5: P5) {
        // Quit dragging
        this.dragging = false;
    }
}

class DraggablePoint extends Draggable {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        super(x, y, 10, 10);
    }
}

export {Draggable, DraggablePoint};
