import P5 from "p5";

import {randInt, Stack, Point} from './utils';
import {Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation} from "./linalg";
import {Edge, Simplex} from './geometry';

type MetricFunction = (v1: Vector, v2: Vector) => number;

/**
 * Represents a model of hyperbolic space. Classes which implement
 * this interface should provide a metric and know how to draw itself
 * on the canvas.
 */
interface Model {
    drawOrigin: Point;
    frameStack: Stack<Transformation>;

    d(z: Vector, w: Vector): number;

    canvasToModel(p: Point): Vector;
    modelToCanvas(z: Vector): Point;

    push(): void;
    pop(): Transformation;
    transfrom(T: Transformation): void;

    draw(p5: P5): void;
    drawPoint(p5: P5, z: Vector): void;
    drawGeodesic(p5: P5, z: Vector, w: Vector): void;
    tesselate(p5: P5, points: Vector[]): void
}

abstract class DiskModel implements Model {
    DIM = 3;

    drawOrigin: Point;
    drawRadius: number;
    frameStack: Stack<Transformation>;

    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {number} drawRadius - The radius of the disk in the canvas
     */
    constructor(drawOrigin: Point, drawRadius: number) {
        this.drawOrigin = drawOrigin;
        this.drawRadius = drawRadius;
        this.frameStack = new Stack<Transformation>();
        this.frameStack.push(LinearTransformation.identity(this.DIM));
    }

    private T() {
        return this.frameStack.peek();
    }

    private act(p: Vector): Vector {
        return this.T().T(p).homogenize();
    }

    abstract d(p: Vector, q: Vector): number;

    /**
     * Convert a point in the canvas to a point in the model
     * @param {Point} a
     */
    canvasToModel(a: Point): Vector {
        let p = Vector.fromList(
            (a.x - this.drawOrigin.x) / this.drawRadius * 2,
            -(a.y - this.drawOrigin.y) / this.drawRadius * 2,
            1
        );
        return this.act(p);
    }

    /**
     * Convert a point in the model to a point in the canvas
     * @param {Vector} p
     */
    modelToCanvas(p: Vector): Point {
        p = this.act(p);
        return {x: p.at(0) * this.drawRadius / 2 + this.drawOrigin.x, y: -p.at(1) * this.drawRadius / 2 + this.drawOrigin.y};
    }

    /**
     * Push a new frame onto the transformation stack
     */
    push(): void {
        this.frameStack.push(this.T().clone());
    }

    /**
     * Pop a new frame onto the transformation stack
     */
    pop(): Transformation {
        return this.frameStack.pop();
    }

    /**
     * Apply a transformation to the model
     * @param {Transformation} T
     */
    transfrom(T: Transformation): void {
        this.frameStack.push(T.compose(this.frameStack.pop()));
    }

    /**
     * Render the model in p5.
     * @param {P5} p5 - A reference to the canvas
     */
    draw(p5: P5): void {
        p5.strokeWeight(1);
        p5.circle(this.drawOrigin.x, this.drawOrigin.y, this.drawRadius);
    }

    /**
     * Draw a point in the disk
     * @param {P5} p5 - The p5 instance to which we should draw
     * @param {Vector} p - The point in D to draw, |z| < 1
     */
    drawPoint(p5: P5, p: Vector): void {
        p5.stroke(0);
        p5.strokeWeight(2);
        let a = this.modelToCanvas(p);
        p5.point(a.x, a.y);
    }

    /**
     * Draw a geodesic between two points
     * @param {P5} p5 - the p5 instance to which we should draw
     * @param {Vector} p - The first point, |z| < 1
     * @param {Vector} q - The second point, |w| < 1
     */
    abstract drawGeodesic(p5: P5, p: Vector, q: Vector): void;

    /**
     * Bowyer-Watson algorithm for finding Delaunay triangulation, which is dual
     * to the Voronoi tesselation
     * @param {P5} p5
     * @param {Vector} x0 The base point
     * @param {Transformation[]} generators The generators for the discrete group
     * used to generate the tesselation
     * @param {number} breadth How many branches to evaluate
     * @param {number} depth How deep along each branch to generate
     */
    abstract tesselate(p5: P5, points: Vector[]): void;
}

/**
 * The Poincaré disk model of hyperbolic space.
 */
class PoincareModel extends DiskModel { // TODO: Fix frameStack here
    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {number} drawRadius - The radius of the disk in the canvas
     */
    constructor(drawOrigin: Point, drawRadius: number) {
        super(drawOrigin, drawRadius);
    }

    private delta(p: Vector, q: Vector): number {
        return 2 * p.subtract(q).normSquared() / ((1 - p.normSquared()) * (1 - q.normSquared()));
    }

    private mod(n: number, m: number): number {
        return ((n % m) + m) % m;
    }

    /**
     * Hyperbolic distance between points p and q in D.
     * @param {Vector} p
     * @param {Vector} q
     */
    d(p: Vector, q: Vector): number {
        p = this.T.T(p).homogenize();
        q = this.T.T(q).homogenize();
        return Math.acosh(1 + this.delta(p, q));
    }

    /**
     * Draw a geodesic between two points
     * @param {P5} p5 - the p5 instance to which we should draw
     * @param {Vector} p - The first point, |z| < 1
     * @param {Vector} q - The second point, |w| < 1
     */
    drawGeodesic(p5: P5, p: Vector, q: Vector) {
        p = this.T.T(p).homogenize();
        q = this.T.T(q).homogenize();
        p5.strokeWeight(1);

        let u = p.normalize();
        let v = q.normalize();

        // If p and q are collinear, drawing a circle is hard; use a line instead
        if (u.equals(v) || u.equals(v.scale(-1))) {
            let a = this.modelToCanvas(p);
            let b = this.modelToCanvas(q);
            p5.line(a.x, a.y, b.x, b.y);
            return;
        }

        // Compute the center and radius of tangent circle
        let a = (p.at(1) * (q.at(0)**2 + q.at(1)**2 + 1) - q.at(1) * (p.at(0)**2 + p.at(1)**2 + 1)) / (p.at(0) * q.at(1) - p.at(1) * q.at(0));
        let b = (q.at(0) * (p.at(0)**2 + p.at(1)**2 + 1) - p.at(0) * (q.at(0)**2 + q.at(1)**2 + 1)) / (p.at(0) * q.at(1) - p.at(1) * q.at(0));

        let center = Vector.fromList(-a / 2, -b / 2, 1);
        let r = Math.sqrt(center.normSquared() - 1);

        let theta1 = this.mod(-Math.atan2(p.at(1) - center.at(1), p.at(0) - center.at(0)), 2 * Math.PI);
        let theta2 = this.mod(-Math.atan2(q.at(1) - center.at(1), q.at(0) - center.at(0)), 2 * Math.PI);

        // A hacky way of ensuring the order of theta1 and theta2 is correct
        if (this.mod(theta2 - theta1, 2 * Math.PI) > this.mod(theta1 - theta2, 2 * Math.PI)) {
            let temp = theta1;
            theta1 = theta2;
            theta2 = temp;
        }

        let canvasCenter = this.modelToCanvas(center);
        let canvasR = r * this.drawRadius;

        // Draw geodesic arc between p and q
        p5.arc(canvasCenter.x, canvasCenter.y, canvasR, canvasR, theta1, theta2);
    }

    tesselate(p5: P5, points: Vector[]): void {
        return; // TODO: ?
    }
}

interface ConvexDomain extends Model {
    chord(z: Vector, w: Vector): [Vector, Vector];
    crossRatio(z: Vector, w: Vector): number;
}

class PCModel implements Model, ConvexDomain {
    drawOrigin: Point;
    frameStack: Stack<Transformation>;
    
    constructor(drawOrigin: Point, bulge: number = 1) {
        this.drawOrigin = drawOrigin;
    }
    
    chord(z: Vector, w: Vector): [Vector, Vector] {
        return [Vector.fromList(5, 0), Vector.fromList(0, 5)]; // TODO
    }

    crossRatio(z: Vector, w: Vector): number {
        let [a,b] = this.chord(z,w);

        // Make sure point ordering is correct
        if (a.subtract(z).norm() > a.subtract(w).norm()) {
            let t = a;
            a = b;
            b = t;
        }

        return (w.subtract(a).norm() * b.subtract(z).norm()) / (z.subtract(a).norm() * b.subtract(w).norm());
    }

    d(z: Vector, w: Vector): number {
        return 0.5 * Math.log(this.crossRatio(z, w));
    }

    modelToCanvas(z: Vector): Point {
        return {x: z.at(0) / 2 + this.drawOrigin.x, y: -z.at(1) / 2 + this.drawOrigin.y};
    }

    canvasToModel(p: Point): Vector {
        return Vector.fromList((p.x - this.drawOrigin.x) / 2, -(p.y - this.drawOrigin.y) / 2);
    }

    push(): void {
        
    }

    pop(): Transformation {
        return new LinearTransformation(0, 0); // TODO
    }

    transfrom(T: Transformation): void {
        
    }

    draw(p5: P5): void {
        
    }

    drawPoint(p5: P5, z: Vector): void {
        
    }

    drawGeodesic(p5: P5, z: Vector, w: Vector): void {
        
    }

    tesselate(p5: P5, points: Vector[]): void {
        return; // TODO: ?
    }
}

class KleinModel extends DiskModel {
    constructor(drawOrigin: Point, drawRadius: number) {
        super(drawOrigin, drawRadius);
    }

    chord(p: Vector, q: Vector): [Vector, Vector] {
        let x1 = p.at(0);
        let y1 = p.at(1);
        let x2 = q.at(0);
        let y2 = q.at(1);
        let a: Vector;
        let b: Vector;

        // Find where the chord through z and w intersects D
        let numera1 = (-((-(x2*y1**2) + x1*y1*y2 + x2*y1*y2 - x1*y2**2 + Math.sqrt(-((x1 - x2)**2* (x2**2*(-1 + y1**2) - (y1 - y2)**2 - 2*x1*x2*(-1 + y1*y2) + x1**2*(-1 + y2**2)))))));
        let denoma1 = x1**2 - 2*x1*x2 + x2**2 + (y1 - y2)**2;
        let numera2 = (-(x2**3*y1) + x1**3*y2 + x1*x2**2*(2*y1 + y2) - x1**2*x2*(y1 + 2*y2) + (-y1 + y2)*Math.sqrt(-((x1 - x2)**2*(x2**2*(-1 + y1**2) - (y1 - y2)**2 - 2*x1*x2*(-1 + y1*y2) + x1**2*(-1 + y2**2)))));
        let denoma2 = ((x1 - x2)*(x1**2 - 2*x1*x2 + x2**2 + (y1 - y2)**2));

        let numb1 = (x2*y1**2 - x1*y1*y2 - x2*y1*y2 + x1*y2**2 + Math.sqrt(-((x1 - x2)**2* (x2**2*(-1 + y1**2) - (y1 - y2)**2 - 2*x1*x2*(-1 + y1*y2) + x1**2*(-1 + y2**2)))));
        let denomb1 = (x1**2 - 2*x1*x2 + x2**2 + (y1 - y2)**2);
        let numb2 = (-(x2**3*y1) + x1**3*y2 + x1*x2**2*(2*y1 + y2) - x1**2*x2*(y1 + 2*y2) + (y1 - y2)*Math.sqrt(-((x1 - x2)**2* (x2**2*(-1 + y1**2) - (y1 - y2)**2 - 2*x1*x2*(-1 + y1*y2) + x1**2*(-1 + y2**2)))));
        let denomb2 = ((x1 - x2)*(x1**2 - 2*x1*x2 + x2**2 + (y1 - y2)**2));

        // This solution leads to NaN, but TODO, it should always be at (0, -1), (0, 1)
        if ((numera1 == 0 && denoma1 == 0) || (numera2 == 0 && denoma2 == 0) || (numb1 == 0 && denomb1 == 0) || (numb2 == 0 && denomb2 == 0)) {
            a = Vector.fromList(0, -1);
            b = Vector.fromList(0, 1);
        } else {
            a = Vector.fromList(numera1 / denoma1, numera2 / denoma2);
            b = Vector.fromList(numb1 / denomb1, numb2 / denomb2);
        }

        return [a,b];
    }

    crossRatio(p: Vector, q: Vector): number {
        let [a,b] = this.chord(p,q);
        p = Vector.fromList(p.at(0), p.at(1));
        q = Vector.fromList(q.at(0), q.at(1));

        // Make sure point ordering is correct
        if (a.subtract(p).norm() > a.subtract(q).norm()) {
            let t = a;
            a = b;
            b = t;
        }

        return (q.subtract(a).norm() * b.subtract(p).norm()) / (p.subtract(a).norm() * b.subtract(q).norm());
    }

    d(p: Vector, q: Vector): number {
        return 0.5 * Math.log(this.crossRatio(p, q));
    }

    drawGeodesic(p5: P5, p: Vector, q: Vector): void {
        p5.stroke(0);
        p5.strokeWeight(1);

        let a = this.modelToCanvas(p);
        let b = this.modelToCanvas(q);

        p5.line(a.x, a.y, b.x, b.y);
    }

    drawCircle(p5: P5, p: Vector, r: number): void {

    }

    randomPoints(x0: Vector, generators: LinearTransformation[], breadth: number = 10, depth: number = 10) {

    }

    private isBadEdge(badTriangles: Simplex[], edge: Edge): boolean {
        for (let i = 0; i < badTriangles.length; ++i) {
            for (let e = 0; e < badTriangles[i].edges.length; ++e) {
                if (edge == badTriangles[i].edges[e]) // TODO: Check this
                    return true;
            }
        }
        return false;
    }

    tesselate(p5: P5, points: Vector[]): void {
        let triangulation: Simplex[] = [];
        // Start with explicit super triangle bigger than the model
        let superTriangle = new Simplex([
            Vector.fromList(0, 3, 1),
            Vector.fromList(-2, -1, 1),
            Vector.fromList(2, -1, 1)
        ]);
        triangulation.push(superTriangle);

        for (let i = 0; i < points.length; ++i) {
            let point = points[i];
            let badTriangles: Simplex[] = [];
            for (let j = 0; j < triangulation.length; ++j) {
                let circumcircle = triangulation[j].circumcircle((v1: Vector, v2: Vector) => v1.dot(v2));
                if (point.subtract(circumcircle[0]).norm() <= circumcircle[1])
                    badTriangles.push(triangulation[j]);
            }
            
            let polygon: Edge[] = [];
            for (let j = 0; j < badTriangles.length; ++j) {
                let badTriangle = badTriangles[j];
                for (let e = 0; e < badTriangle.edges.length; ++e) {
                    let edge = badTriangle.edges[e];
                    if (this.isBadEdge(badTriangles, edge))
                        polygon.push(edge);
                }
            }

            for (let j = 0; j < badTriangles.length; ++j) {
                triangulation = triangulation.filter(triangle => triangle !== badTriangles[j]); // TODO: Does this comparison work?
            }

            for (let e = 0; e < polygon.length; ++e) {
                let edge = polygon[e];
                triangulation.push(new Simplex([edge[0], edge[1], point]));
            }
        }

        for (let i = 0; i < triangulation.length; ++i) {
            let triangle = triangulation[i];
            for (let j = 0; j < superTriangle.vertices.length; ++j) {
                let origVertex = superTriangle.vertices[j];
                if (triangle.vertices.includes(origVertex))
                    triangulation = triangulation.filter(t => t !== triangle);
            }
        }

        console.log(triangulation);
        // TODO: Draw triangulation
    }
}

export {MetricFunction, Model, KleinModel, PoincareModel};
