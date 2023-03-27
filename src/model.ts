import P5 from "p5";

import {randInt, Stack} from './utils';
import {Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation, EPSILON} from "./linalg";
import {Edge, Simplex, Point} from './geometry';

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
    //chord(z: Vector, w: Vector): [Vector, Vector];
    crossRatio(z: Vector, w: Vector): number;
}

class PCModel implements ConvexDomain {
    private static STEPS = 900;
    private static C: Matrix = new Matrix([[2, -1, -1], [-2, 2, -1], [-1, -1, 2]]);

    generators: LinearTransformation[];
    bulge: number;
    // TODO: Make these sets
    interior: Edge[] = [];
    boundary: Edge[];

    drawOrigin: Point;
    drawScale: number;
    frameStack: Stack<Transformation>;
    
    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {LinearTransformation[]} generators - Generators of the subgroup of SL_3(R)
     *     which divide this convex domain
     * @param{number} bulge - Bulging parameter
     */
    constructor(drawOrigin: Point, drawScale: number, bulge: number = 1) {
        this.drawOrigin = drawOrigin;
        this.drawScale = drawScale;
        //this.generators = generators;

        this.setBulge(bulge);
    }

    setBulge(bulge: number): void {
        this.bulge = bulge;

        const p1 = Vector.fromList(1, 0, 1);
        const p2 = Vector.fromList(-0.5, Math.sqrt(3)/2, 1);
        const p3 = Vector.fromList(-0.5, -Math.sqrt(3)/2, 1);

        const alpha1: Vector = p2.cross(p3);
        const alpha2: Vector = p3.cross(p1);
        const alpha3: Vector = p1.cross(p2);

        const l = Math.cos(Math.PI/4);
        const cartanMatrix = new Matrix([
            [2,        -2 * l, -4 * Math.pow(l, 2) * bulge],
            [-2 * l,   2,      -2 * l                     ],
            [-1/bulge, -2 * l, 2                          ]
        ]);

        const V = Matrix.fromBasis(alpha1, alpha2, alpha3)
            .transpose()
            .inverse()
            .multiply(cartanMatrix)
            .transpose();
        const v1 = Vector.fromList(...V.mat[0]);
        const v2 = Vector.fromList(...V.mat[1]);
        const v3 = Vector.fromList(...V.mat[2]);

        const r1 = Matrix.identity(3).subtract(v1.multiply(alpha1.transpose()));
        const r2 = Matrix.identity(3).subtract(v2.multiply(alpha2.transpose()));
        const r3 = Matrix.identity(3).subtract(v3.multiply(alpha3.transpose()));

        let g = [r1, r2, r3];
        for (let i = 0; i < PCModel.STEPS; ++i) {
            g.push(g[i].multiply(g[0]));
            g.push(g[i].multiply(g[1]));
            g.push(g[i].multiply(g[2]));
        }

        this.boundary = [[p1, p2], [p2, p3], [p3, p1]];

        for (let i = 1; i < g.length - 2680; ++i) {
            if (g[i].equals(Matrix.identity(3), EPSILON))
                continue;
            const PMat = g[i].multiply(Matrix.fromBasis(p1, p2, p3)).transpose();

            const P1 = Vector.fromList(...PMat.mat[0]).homogenize();
            const P2 = Vector.fromList(...PMat.mat[1]).homogenize();
            const P3 = Vector.fromList(...PMat.mat[2]).homogenize();

            const newLines: Edge[] = [[P1, P2], [P2, P3], [P3, P1]];
            const newVertices: Vector[] = [newLines[0], newLines[1]].flat();

            this.interior.push(...newLines);
            this.boundary.push(...newLines);

            for (let i = 0; i < newVertices.length; ++i) {
                let vertex = newVertices[i];
                for (let j = 0; j < this.boundary.length; ++j) {
                    let edge = this.boundary[j];
                    if (edge[0].equals(vertex, EPSILON) || edge[1].equals(vertex, EPSILON)) {
                        // TODO
                        if (edge is in interior)
                            this.boundary.remove(edge);
                    }
                }
            }
            //// Update our boundary
            //for (let j = 0; j < newLines.length; ++j) {
            //    const L: Edge = newLines[j];
            //    let inBoundary: Boolean = false;

            //    // Prune the repeat edges (there will always be at least one, since this is a reflection group)
            //    for (let k = 0; k < this.boundary.length; ++k) {
            //        if (L[0].equals(this.boundary[k][0], EPSILON) && L[1].equals(this.boundary[k][1], EPSILON)
            //            || L[0].equals(this.boundary[k][1], EPSILON) && L[1].equals(this.boundary[k][0], EPSILON)) {
            //            this.interior.push(this.boundary[k]);
            //            this.boundary.splice(k--, 1);
            //            inBoundary = true;
            //        }
            //    }
            //    // If this edge is not already in the boundary, add it
            //    if (!inBoundary) 
            //        this.boundary.push(L);
            //}
        }
    }
    
    chord(x: Vector, y: Vector): [Vector, Vector] {
        const ray: Vector = x.subtract(y);
        let tMin = Infinity;
        let tMax = -Infinity;
        let a: Vector = x;
        let b: Vector = y;

        let ts: Vector;
        let tw: Vector;
        let tt1: number;
        let tt2: number;

        for (let i = 0; i < this.boundary.length; ++i) {
            let s = this.boundary[i][0];
            let w = this.boundary[i][1].subtract(s);
            let intersectionPoint = Vector.fromList(
                -(-ray.at(0) * s.at(1) * w.at(0) + ray.at(0) * s.at(0) * w.at(1) - ray.at(1) * w.at(0) * x.at(0) + ray.at(0) * w.at(0) * x.at(1))/(ray.at(1) * w.at(0) - ray.at(0) * w.at(1)),
                -((ray.at(1) * s.at(1) * w.at(0) - ray.at(1) * s.at(0) * w.at(1) + ray.at(1) * w.at(1) * x.at(0) - ray.at(0) * w.at(1) * x.at(1))/(-ray.at(1) * w.at(0) + ray.at(0) * w.at(1)))
            );
            let t1 = -((s.at(1) * w.at(0) - s.at(0) * w.at(1) + w.at(1) * x.at(0) - w.at(0) * x.at(1))/(-ray.at(1) * w.at(0) + ray.at(0) * w.at(1)))
            let t2 = -((ray.at(1) * s.at(0) - ray.at(0) * s.at(1) - ray.at(1) * x.at(0) + ray.at(0) * x.at(1))/(ray.at(1) * w.at(0) - ray.at(0) * w.at(1)))
            
            // We actually intersect this line segment
            if (t2 >= 0 && t2 <= 1) {
                if (t1 < tMin) {
                    tMin = t1;
                    a = intersectionPoint;
                }
                if (t1 > tMax) {
                    tMax = t1;
                    b = intersectionPoint;

                    ts = s;
                    tw = w;
                    tt1 = t1;
                    tt2 = t2;
                }
            }
        }
        //console.log(`s = ${[ts.at(0).toFixed(2), ts.at(1).toFixed(2)]}, w = ${[tw.at(0).toFixed(2), tw.at(1).toFixed(2)]}, t2 = ${tt2}\n`);

        //p5.strokeWeight(5);
        //p5.stroke('green');
        //const tsCanvas = this.modelToCanvas(ts);
        //const tPCanvas = this.modelToCanvas(ts.add(tw));
        //p5.point(tsCanvas.x, tsCanvas.y);
        //p5.point(tPCanvas.x, tPCanvas.y);

        return [a, b];
    }

    crossRatio(x: Vector, y: Vector): number {
        let [a,b] = this.chord(x,y);

        // Make sure point ordering is correct
        if (a.subtract(x).norm() > a.subtract(y).norm()) {
            let t = a;
            a = b;
            b = t;
        }

        return (y.subtract(a).norm() * b.subtract(x).norm()) / (x.subtract(a).norm() * b.subtract(y).norm());
    }

    d(p: Vector, q: Vector): number {
        return 0.5 * Math.log(this.crossRatio(p, q));
    }

    modelToCanvas(p: Vector): Point {
        return {x: this.drawScale * p.at(0) + this.drawOrigin.x, y: -this.drawScale * p.at(1) + this.drawOrigin.y};
    }

    canvasToModel(p: Point): Vector {
        return Vector.fromList((p.x - this.drawOrigin.x) / this.drawScale, -(p.y - this.drawOrigin.y) / this.drawScale, 1);
    }

    push(): void {
        
    }

    pop(): Transformation {
        return new LinearTransformation([]); // TODO
    }

    transfrom(T: Transformation): void {
        
    }

    draw(p5: P5): void {
        p5.stroke('black');
        p5.strokeWeight(1);
        for (let i = 0; i < this.boundary.length; ++i) {
            let pCanvas = this.modelToCanvas(this.boundary[i][0]);
            let qCanvas = this.modelToCanvas(this.boundary[i][1]);
            p5.line(pCanvas.x, pCanvas.y, qCanvas.x, qCanvas.y);
        }

        //p5.stroke(50, 168, 82);
        //for (let i = 0; i < this.interior.length; ++i) {
        //    let pCanvas = this.modelToCanvas(this.interior[i][0]);
        //    let qCanvas = this.modelToCanvas(this.interior[i][1]);
        //    p5.line(pCanvas.x, pCanvas.y, qCanvas.x, qCanvas.y);
        //}
        // p5.strokeWeight(5);
        // p5.stroke('red');

        // for (let i = 0; i < 100; ++i) {
        //     let z = Vector.fromList(0, 0, 1);
        //     for (let j = 0; j < 100; ++j) {
        //         let p = this.modelToCanvas(z);
        //         p5.point(p.x, p.y);
        //         z = this.generators[randInt(0, 3)].T(z);
        //     }
        // }
    }

    drawPoint(p5: P5, p: Vector): void {
        p5.stroke('red');
        p5.strokeWeight(5);
        let a = this.modelToCanvas(p);
        p5.point(a.x, a.y);
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

export {MetricFunction, Model, KleinModel, PoincareModel, PCModel};
