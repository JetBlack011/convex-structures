import P5 from 'p5';
import { EPSILON, Matrix, Vector } from './linalg';
import { MetricFunction } from './model';
import { rand } from "./utils";

type Circle = [Vector, number];

class Edge {
    v1: Vector;
    v2: Vector;

    constructor(v1: Vector, v2: Vector) {
        this.v1 = v1;
        this.v2 = v2;
    }

    equals(other: Edge) {
        return ((this.v1.equals(other.v1, EPSILON) || this.v1.equals(other.v2, EPSILON))
            && (this.v2.equals(other.v1, EPSILON) || this.v2.equals(other.v2, EPSILON)));
    }

    toString(): string {
        return `[${this.v1.toString()}, ${this.v2.toString()}]`;
    }

    hash(): string {
        return '' + this.v1.mat[0][0] + this.v1.mat[1][0] + this.v2.mat[0][0] + this.v2.mat[1][0];
    }
}

class Point {
    x: number;
    y: number;

    static randPoint(minX: number, maxX: number, minY: number, maxY: number): Point {
        return new Point(rand(minX, maxX), rand(minY, maxY));
    }

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    subtract(other: Point): Vector {
        return Vector.fromList(this.x - other.x, this.y - other.y, 1);
    }

    add(v: Vector): Point {
        return new Point(this.x + v.at(0), this.y + v.at(1));
    }

    equals(other: Point): Boolean {
        return this.x == other.x && this.y == other.y;
    }
}

class Simplex {
    n: number;          // Dimension
    vertices: Vector[]; // Vertex list
    edges: Edge[];      // Edge list

    constructor(vertices: Vector[]) {
        this.n = vertices.length - 1;
        this.edges = [];
        for (let i = 0; i <= this.n; ++i)
            this.edges.push(new Edge(vertices[i], vertices[(i + 1) % vertices.length]));
        this.vertices = vertices;
    }

    /**
     * Finds the circumcenter of this n-simplex with respect to the
     * given metric
     * @param {(Vector, Vector) => number} d The metric with which to find the circumcircle 
     */
    circumcircle(d: MetricFunction): Circle {
        let mat = [];
        for (let i = 0; i <= this.n + 1; ++i) {
            mat.push([]);
            for (let j = 0; j <= this.n + 1; ++j) {
                if      (i == j) mat[i].push(0);
                else if (j == 0) mat[i].push(1);
                else if (i == 0) mat[i].push(1);
                else    mat[i].push(d(this.vertices[i - 1], this.vertices[j - 1])**2);
                //else    mat[i].push((this.vertices[j - 1].at(0) - this.vertices[i - 1].at(0))**2 + (this.vertices[j - 1].at(1) - this.vertices[i - 1].at(1))**2);
            }
        }

        let M = new Matrix(mat);
        let Q = M.inverse();
        let barycentric_circumcenter = [];

        for (let i = 0; i <= this.n; ++i) {
            let s = 0;
            for (let j = 1; j <= this.n + 1; ++j)
                s += Q.at(0, j);
            barycentric_circumcenter.push(Q.at(0,i + 1) / s);
        }

        let circumcenter = Vector.zeros(this.n + 1);
        circumcenter = circumcenter.scale(0);
        for (let i = 0; i <= this.n; ++i) {
            circumcenter = circumcenter.add(this.vertices[i].scale(barycentric_circumcenter[i]));
        }

        console.log(circumcenter);
        return [circumcenter, Math.sqrt(Q.at(0,0))];
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

export { Point, Edge, Circle, Simplex, Draggable, DraggablePoint };
