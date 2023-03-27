import P5 from "p5";
import { Point } from "./geometry";

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

class Stack<T> {
    private storage: T[] = [];

    push(item: T): void {
        this.storage.push(item);
    }

    pop(): T | undefined {
      return this.storage.pop();
    }

    peek(): T | undefined {
      return this.storage[this.size() - 1];
    }

    size(): number {
      return this.storage.length;
    }
}

class Draggable extends Point {
    w: number;
    h: number;
    offsetX: number;
    offsetY: number;

    dragging: boolean;
    rollover: boolean;

    constructor(x: number, y: number, w: number, h: number) {
        super(x, y);
        this.dragging = false; // Is the object being dragged?
        this.rollover = false; // Is the mouse over the ellipse?

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

    draw(p5: P5) {
        p5.stroke(0);
        p5.strokeWeight(1);
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
    constructor(x: number, y: number) {
        super(x, y, 5, 5);
    }
}

export {randInt, Stack, Point, Draggable, DraggablePoint};
