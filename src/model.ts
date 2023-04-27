import P5 from "p5";

import { randInt, Stack, binarySearch } from './utils';
import { Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation, EPSILON } from "./linalg";
import { Edge, Simplex, Point } from './geometry';


type MetricFunction = (v1: Vector, v2: Vector) => number;

/**
 * Represents a model geometry. Classes which implement this interface
 * should provide a metric and know how to draw itself on the canvas.
 */
interface Model {
    drawOrigin: Point;
    frameStack: Stack<Transformation>;

    d: MetricFunction;

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

/**
 * Represents a convex domain in projective space. In particular,
 * inheriting classes should have a notion of chord and cross ratio.
 */
interface ConvexDomain extends Model {
    //chord(z: Vector, w: Vector): Edge;
    crossRatio(z: Vector, w: Vector): number;
}

/**
 * Represents a hyperbolic model disk model. This abstract class
 * implements the majority of the methods specific to the disk models, except
 * for the notions of distance, geodesic, and cross ratio.
 */
abstract class DiskModel implements ConvexDomain {
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

    abstract crossRatio(z: Vector, w: Vector): number;
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
        //p = this.act(p);
        return new Point(p.x() * this.drawRadius / 2 + this.drawOrigin.x, -p.y() * this.drawRadius / 2 + this.drawOrigin.y);
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
     * @param {Vector} p - The point in D to draw, |p| < 1
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
     * @param {Vector} p - The first point, |p| < 1
     * @param {Vector} q - The second point, |q| < 1
     */
    abstract drawGeodesic(p5: P5, p: Vector, q: Vector): void;

    cols = [];

    tesselate(p5: P5, points: Vector[]): void {
        p5.strokeWeight(2);

        let len = this.cols.length;
        for (let i = 0; i < points.length - len; ++i) {
            this.cols.push([randInt(0, 255), randInt(0, 255), randInt(0, 255)]);
        }

        for (let x = this.drawOrigin.x - this.drawRadius; x <= this.drawOrigin.x + this.drawRadius; x += 1) {
            for (let y = this.drawOrigin.y - this.drawRadius; y <= this.drawOrigin.y + this.drawRadius; y += 1) {
                let p = this.canvasToModel(new Point(x, y));

                if (p.normSquared() - 1 > 1)
                    continue;

                let minDistance = Number.POSITIVE_INFINITY;
                let col: [number, number, number] = [0, 0, 0];

                for (let i = 0; i < points.length; ++i) {
                    let distance = this.d(p, points[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        col = this.cols[i];
                    }
                }

                p5.stroke(...col);
                p5.point(x, y);
            }
        }

        for (let i = 0; i < points.length; ++i) {
            let p = this.modelToCanvas(points[i]);
            p5.stroke(255);
            p5.strokeWeight(3);
            p5.point(p.x, p.y);
        }
    }
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

    //private delta(p: Vector, q: Vector): number {
    //    return 2 * p.subtract(q).normSquared() / ((1 - p.normSquared()) * (1 - q.normSquared()));
    //}

    private mod(n: number, m: number): number {
        return ((n % m) + m) % m;
    }

    crossRatio(z: Vector, w: Vector): number {
        return -1;
    }

    /**
     * Hyperbolic distance between points p and q in D.
     * @param {Vector} p
     * @param {Vector} q
     */
    d(p: Vector, q: Vector): number {
        //p = this.T.T(p).homogenize();
        //q = this.T.T(q).homogenize();
        p = Vector.fromList(p.x(), p.y());
        q = Vector.fromList(q.x(), q.y());
        return Math.acosh(1 + (2 * p.subtract(q).normSquared()) / ((1 - p.normSquared()) * (1 - q.normSquared())));
    }

    /**
     * Draw a geodesic between two points
     * @param {P5} p5 - the p5 instance to which we should draw
     * @param {Vector} p - The first point, |z| < 1
     * @param {Vector} q - The second point, |w| < 1
     */
    drawGeodesic(p5: P5, p: Vector, q: Vector) {
        //p = this.T.T(p).homogenize();
        //q = this.T.T(q).homogenize();
        p5.strokeWeight(1);

        // If p and q are collinear, drawing a circle is hard; use a line instead
        if (Math.abs(p.xy().dot(q.xy()) - p.xy().norm() * q.xy().norm()) < EPSILON) {
            let a = this.modelToCanvas(p);
            let b = this.modelToCanvas(q);
            p5.line(a.x, a.y, b.x, b.y);
            return;
        }

        // Compute the center and radius of tangent circle
        let a = (p.y() * (q.x()**2 + q.y()**2 + 1) - q.y() * (p.x()**2 + p.y()**2 + 1)) / (p.x() * q.y() - p.y() * q.x());
        let b = (q.x() * (p.x()**2 + p.y()**2 + 1) - p.x() * (q.x()**2 + q.y()**2 + 1)) / (p.x() * q.y() - p.y() * q.x());

        let center = Vector.fromList(-a / 2, -b / 2, 1);
        let r = Math.sqrt(center.normSquared() - 2);

        let theta1 = this.mod(-Math.atan2(p.y() - center.y(), p.x() - center.x()), 2 * Math.PI);
        let theta2 = this.mod(-Math.atan2(q.y() - center.y(), q.x() - center.x()), 2 * Math.PI);

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

    //tesselate(p5: P5, points: Vector[]): void {
    //    return; // TODO: ?
    //}
}

/**
 * The Klein disk model of hyperbolic space.
 */
class KleinModel extends DiskModel {
    constructor(drawOrigin: Point, drawRadius: number) {
        super(drawOrigin, drawRadius);
    }

    chord(p: Vector, q: Vector): Edge {
        let x1 = p.x();
        let y1 = p.y();
        let x2 = q.x();
        let y2 = q.y();
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

        return new Edge(a,b);
    }

    crossRatio(p: Vector, q: Vector): number {
        let e = this.chord(p,q);
        let a = e.v1;
        let b = e.v2;
        p = Vector.fromList(p.x(), p.y());
        q = Vector.fromList(q.x(), q.y());

        // Make sure point ordering is correct
        if (a.subtract(p).norm() > a.subtract(q).norm()) {
            let t = a;
            a = b;
            b = t;
        }

        return (q.subtract(a).norm() * b.subtract(p).norm()) / (p.subtract(a).norm() * b.subtract(q).norm());
    }

    d(p: Vector, q: Vector): number {
        //console.log(0.5 * Math.log(this.crossRatio(p, q)));
        //console.log(Math.acosh((1 - p.dot(q)) / Math.sqrt((1 - p.normSquared()) * (1 - q.normSquared()))));
        p = Vector.fromList(p.x(), p.y());
        q = Vector.fromList(q.x(), q.y());
        return 0.5 * Math.log(this.crossRatio(p, q));
        //return Math.acosh((1 - p.dot(q)) / Math.sqrt((1 - p.normSquared()) * (1 - q.normSquared())));
    }

    drawGeodesic(p5: P5, p: Vector, q: Vector): void {
        p5.stroke(0);
        p5.strokeWeight(1);

        let a = this.modelToCanvas(p);
        let b = this.modelToCanvas(q);

        p5.line(a.x, a.y, b.x, b.y);
    }

    // TODO: A more efficient Voronoi tesselation
    drawCircle(p5: P5, p: Vector, r: number): void {

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

    //tesselate(p5: P5, points: Vector[]): void {
    //    let triangulation: Simplex[] = [];
    //    // Start with explicit super triangle bigger than the model
    //    let superTriangle = new Simplex([
    //        Vector.fromList(0, 3, 1),
    //        Vector.fromList(-2, -1, 1),
    //        Vector.fromList(2, -1, 1)
    //    ]);
    //    triangulation.push(superTriangle);

    //    for (let i = 0; i < points.length; ++i) {
    //        let point = points[i];
    //        let badTriangles: Simplex[] = [];
    //        for (let j = 0; j < triangulation.length; ++j) {
    //            let circumcircle = triangulation[j].circumcircle((v1: Vector, v2: Vector) => v1.dot(v2));
    //            if (point.subtract(circumcircle[0]).norm() <= circumcircle[1])
    //                badTriangles.push(triangulation[j]);
    //        }
    //        
    //        let polygon: Edge[] = [];
    //        for (let j = 0; j < badTriangles.length; ++j) {
    //            let badTriangle = badTriangles[j];
    //            for (let e = 0; e < badTriangle.edges.length; ++e) {
    //                let edge = badTriangle.edges[e];
    //                if (this.isBadEdge(badTriangles, edge))
    //                    polygon.push(edge);
    //            }
    //        }

    //        for (let j = 0; j < badTriangles.length; ++j) {
    //            triangulation = triangulation.filter(triangle => triangle !== badTriangles[j]); // TODO: Does this comparison work?
    //        }

    //        for (let e = 0; e < polygon.length; ++e) {
    //            let edge = polygon[e];
    //            triangulation.push(new Simplex([edge[0], edge[1], point]));
    //        }
    //    }

    //    for (let i = 0; i < triangulation.length; ++i) {
    //        let triangle = triangulation[i];
    //        for (let j = 0; j < superTriangle.vertices.length; ++j) {
    //            let origVertex = superTriangle.vertices[j];
    //            if (triangle.vertices.includes(origVertex))
    //                triangulation = triangulation.filter(t => t !== triangle);
    //        }
    //    }

    //    console.log(triangulation);
    //    // TODO: Draw triangulation
    //}
}

enum HilbertBisectorDrawOption {
    Epsilon,
    Gradient
}

/**
 * A model for convex projective geometry. Implements the Hilbert metric,
 * as well as methods to draw bisectors in this metric.
 */
class ConvexProjectiveModel implements ConvexDomain {
    private static STEPS = 900;
    private static C: Matrix = new Matrix([[2, -1, -1], [-2, 2, -1], [-1, -1, 2]]);

    //generators: LinearTransformation[];
    bulge: number;
    p1 = Vector.fromList(1, 0, 1);
    p2 = Vector.fromList(-0.5, Math.sqrt(3)/2, 1);
    p3 = Vector.fromList(-0.5, -Math.sqrt(3)/2, 1);
    // TODO: Make these sets
    interior: Edge[] = [];
    boundary: Edge[] = [];

    drawOrigin: Point;
    drawScale: number;
    frameStack: Stack<Transformation>;
    
    /**
     * @param {Point} drawOrigin - The point at which to draw the domain
     * @param {number} drawScale - The scale at which to draw the domain
     * @param {number} bulge - Bulging parameter
     */
    constructor(drawOrigin: Point, drawScale: number, bulge: number = 0) {
        this.drawOrigin = drawOrigin;
        this.drawScale = drawScale;
        //this.generators = generators;

        this.setBulge(bulge);
    }

    /**
     * Perform a 2D ray cast. This is used to find the chord between two points and compute
     * the cross ratio.
     * @param {Vector} p - The origin of the ray
     * @param {Vector} ray - The direction of the ray
     * @param {Vector} q - Origin of the line of intersection
     * @param {Vector} w - Ray defining the line of intersection
     */
    private rayCast(p: Vector, ray: Vector, q: Vector, w: Vector): [number, number, Vector] {
        let px = p.x();
        let py = p.y();
        let rayx = ray.x();
        let rayy = ray.y();
        let qx = q.x();
        let qy = q.y();
        let wx = w.x();
        let wy = w.y();

        let intersectionPoint = [
            [-(-rayx * qy * wx + rayx * qx * wy - rayy * wx * px + rayx * wx * py)/(rayy * wx - rayx * wy)],
            [-((rayy * qy * wx - rayy * qx * wy + rayy * wy * px - rayx * wy * py)/(-rayy * wx + rayx * wy))],
            [1]
        ];
        let t1 = -((qy * wx - qx * wy + wy * px - wx * py)/(-rayy * wx + rayx * wy))
        let t2 = -((rayy * qx - rayx * qy - rayy * px + rayx * py)/(rayy * wx - rayx * wy))

        return [t1, t2, new Vector(intersectionPoint)];
    }

    /**
     * Counts the number of line segments hit by a given ray. This is useful for
     * determining whether we're on the inside or the outside of a convex domain.
     */
    //rayCastCount(p: Vector, ray: Vector, p5?: P5): number {
    //    let res: number = 0;
    //    p = p.add(ray.scale(EPSILON));
    //    for (let i = 0; i < this.boundary.length; ++i) {
    //        let [t1, t2, ip] = this.rayCast(p, ray, 
    //            this.boundary[i][0],
    //            this.boundary[i][1].subtract(this.boundary[i][0])
    //        );

    //        if (t1 > 0 && t2 >= 0 && t2 <= 0)
    //            ++res;
    //    }
    //    return res;
    //}
    
    /**
     * Generates the subgroup of PSL_2(R) determined by the given bulge parameter
     */
    bulgeSubgroup(bulge: number): Matrix[] {
        const alpha1: Vector = this.p2.cross(this.p3);
        const alpha2: Vector = this.p3.cross(this.p1);
        const alpha3: Vector = this.p1.cross(this.p2);

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

        for (let i = 0; i < ConvexProjectiveModel.STEPS; ++i) {
            g.push(g[i].multiply(r1));
            g.push(g[i].multiply(r2));
            g.push(g[i].multiply(r3));
        }

        g = g.filter((m1, index, self) => {
            return index === self.findIndex((m2) => m2.equals(m1, EPSILON));
        });

        return g;
    }

    /**
     * Updates the interior and boundary of this domain based on a given bulge parameter.
     */
    setBulge(bulge: number, p5?: P5): void {
        this.bulge = Math.sqrt(2) / 2 * Math.exp(bulge);

        let g = this.bulgeSubgroup(bulge);

        //console.log(g);

        this.boundary = [new Edge(this.p1, this.p2), new Edge(this.p2, this.p3), new Edge(this.p3, this.p1)];
        this.interior = [new Edge(this.p1, this.p2), new Edge(this.p2, this.p3), new Edge(this.p3, this.p1)];

        let basis = Matrix.fromBasis(this.p1, this.p2, this.p3);

        for (let i = 0; i < g.length; ++i) {
            if (g[i].equals(Matrix.identity(3), EPSILON))
                continue;
            //try {
            //    let eigs = g[i].eigs();
            //    console.log(eigs.values);
            //    eigs.vectors.forEach((v: Vector) => {
            //        console.log(v.homogenize().toString());
            //        p5.strokeWeight(10);
            //        p5.stroke('purple');
            //        let p = this.modelToCanvas(v.homogenize());
            //        p5.point(p.x, p.y);
            //        console.log(p);
            //    });
            //} catch (e) {
            //    console.log(e);
            //}
            const PMat = g[i].multiply(basis).transpose();

            const P1 = Vector.fromList(...PMat.mat[0]).homogenize();
            const P2 = Vector.fromList(...PMat.mat[1]).homogenize();
            const P3 = Vector.fromList(...PMat.mat[2]).homogenize();

            const newTriangle: Edge[] = [new Edge(P1, P2), new Edge(P2, P3), new Edge(P3, P1)];

            let newEdges: Edge[] = [];
            let dupEdges: Edge[] = [];

            // Remove any duplicate edges
            for (let i = 0; i < newTriangle.length; ++i) {
                let edge = newTriangle[i];
                let edgeFound = false;
                for (let j = 0; j < this.interior.length; ++j) {
                    if (edge.equals(this.interior[j])) {
                        edgeFound = true;
                        dupEdges.push(edge);
                    }
                }
                if (!edgeFound)
                    newEdges.push(edge);
            }

            if (dupEdges.length == 3)
                continue;

            this.boundary.push(...newEdges);
            this.interior.push(...newEdges);
            // Only keep the new edges for the boundary
            for (let i = 0; i < this.boundary.length; ++i) {
                let edge = this.boundary[i];
                if (edge !== undefined) { // TODO: Hacky
                    for (let j = 0; j < dupEdges.length; ++j) {
                        if (edge.equals(dupEdges[j])) {
                            this.boundary.splice(i--, 1);
                        }
                    }
                }
            }
        }
    }

    private chordCache: [Edge, Edge] = [null, null];
    //private boundaryRayCache: Object = {};

    clearChordCache() {
        this.chordCache = [null, null];
        //this.boundaryRayCache = {};
    }
    
    /**
     * Compute the two boundary points defining the chord between x and y.
     */
    chord(x: Vector, y: Vector): Edge {
        const ray: Vector = x.subtract(y);
        let tMin = Number.POSITIVE_INFINITY;
        let tMax = Number.NEGATIVE_INFINITY;
        let a: Vector = x;
        let b: Vector = y;
        let foundEdges = 0;

        if (this.chordCache[0] !== null) {
            for (let i = 0; i < this.chordCache.length && foundEdges < 2; ++i) {
                let q = this.chordCache[i].v1;
                let [t1, t2, ip] = this.rayCast(x, ray, q, this.chordCache[i].v2.subtract(q));

                if (t2 >= 0 && t2 <= 1) {
                    if (t1 < tMin) {
                        tMin = t1;
                        a = ip;
                    }
                    if (t1 > tMax) {
                        tMax = t1;
                        b = ip;
                    }
                    ++foundEdges;
                }
            }
        }

        for (let i = 0; i < this.boundary.length && foundEdges < 2; ++i) {
            let q = this.boundary[i].v1;
            let w = this.boundary[i].v2.subtract(q)
            //let key = this.boundary[i].hash();
            //let w = this.boundaryRayCache[key];
            //if (w === undefined) {
            //    w = this.boundary[i].v2.subtract(q)
            //    this.boundaryRayCache[key] = w;
            //}

            let [t1, t2, ip] = this.rayCast(x, ray, q, w);

            if (t2 >= -1 && t2 <= 2) {
                this.chordCache.push(this.boundary[i]);
            }

            if (t2 >= 0 && t2 <= 1) {
                if (t1 < tMin) {
                    tMin = t1;
                    a = ip;
                }
                if (t1 > tMax) {
                    tMax = t1;
                    b = ip;
                }
                ++foundEdges;
            }
        }

        return new Edge(a,b);

        // TODO: Potential optimization?
        //const rayPos: Vector = y.subtract(x);
        //const rayNeg: Vector = x.subtract(y);

        //let maxDotPos: number = Number.NEGATIVE_INFINITY;
        //let secDotPos: number = Number.NEGATIVE_INFINITY;
        //let bVertex1: Vector;
        //let bVertex2: Vector;

        //let maxDotNeg: number = Number.NEGATIVE_INFINITY;
        //let secDotNeg: number = Number.NEGATIVE_INFINITY;
        //let aVertex1: Vector;
        //let aVertex2: Vector;

        //for (let i = 0; i < this.boundary.length; ++i) {
        //    for (let j = 0; j < this.boundary[i].length; ++j) {
        //        let dotPos = rayPos.normalize().dot(this.boundary[i][j].subtract(x).normalize());
        //        let dotNeg = rayNeg.normalize().dot(this.boundary[i][j].subtract(y).normalize());

        //        if (dotPos > maxDotPos) {
        //            secDotPos = maxDotPos;
        //            maxDotPos = dotPos;
        //            bVertex2 = bVertex1;
        //            bVertex1 = this.boundary[i][j];
        //        } else if (dotPos < maxDotPos && dotPos > secDotPos) {
        //            secDotPos = dotPos;
        //            bVertex2 = this.boundary[i][j];
        //        }

        //        if (dotNeg > maxDotNeg) {
        //            secDotNeg = maxDotNeg;
        //            maxDotNeg = dotNeg;
        //            aVertex2 = aVertex1;
        //            aVertex1 = this.boundary[i][j];
        //        } else if (dotNeg < maxDotNeg && dotNeg > secDotNeg) {
        //            secDotNeg = dotNeg;
        //            aVertex2 = this.boundary[i][j];
        //        }
        //    }
        //}

        //let b = this.rayCast(x, rayPos, bVertex1, bVertex2.subtract(bVertex1));
        //let a = this.rayCast(x, rayNeg, aVertex1, aVertex2.subtract(aVertex1));
    }

    /**
     * Computes the cross ratio (|ya|*|bx|) / (|xa|*|by|)
     */
    crossRatio(x: Vector, y: Vector): number {
        let chord = this.chord(x, y);
        let a = chord.v1;
        let b = chord.v2;

        // Make sure point ordering is correct
        if (a.subtract(x).norm() > a.subtract(y).norm()) {
            let t = a;
            a = b;
            b = t;
        }

        return (y.subtract(a).xy().norm() * b.subtract(x).xy().norm()) / (x.subtract(a).xy().norm() * b.subtract(y).xy().norm());
    }

    /**
     * Computes the Hilbert metric between p and q.
     */
    d(p: Vector, q: Vector): number {
        return 0.5 * Math.log(this.crossRatio(p, q));
    }

    modelToCanvas(p: Vector): Point {
        return new Point(this.drawScale * p.x() + this.drawOrigin.x, -this.drawScale * p.y() + this.drawOrigin.y);
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
        p5.strokeWeight(0.5);
        //p5.strokeWeight(0.5);
        //p5.stroke('black');
        p5.stroke(50, 168, 82);
        for (let i = 0; i < this.interior.length; ++i) {
            let pCanvas = this.modelToCanvas(this.interior[i].v1);
            let qCanvas = this.modelToCanvas(this.interior[i].v2);
            p5.line(pCanvas.x, pCanvas.y, qCanvas.x, qCanvas.y);
        }
        p5.strokeWeight(1);
        p5.stroke('black');
        for (let i = 0; i < this.boundary.length; ++i) {
            let pCanvas = this.modelToCanvas(this.boundary[i].v1);
            let qCanvas = this.modelToCanvas(this.boundary[i].v2);
            p5.line(pCanvas.x, pCanvas.y, qCanvas.x, qCanvas.y);
        }

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

    drawGeodesic(p5: P5, p: Vector, q: Vector): void {
        p5.stroke(0);
        p5.strokeWeight(1);

        let a = this.modelToCanvas(p);
        let b = this.modelToCanvas(q);

        p5.line(a.x, a.y, b.x, b.y);
    }

    /**
     * Performs a box walk to find the Hilbert bisector.
     */
    drawBisectorContinue(p5: P5, p: Vector, q: Vector, nextPoint: Point, coorient: Vector, bisectingPoints: Point[], drawOption: HilbertBisectorDrawOption, epsilon: number) {
        //let midpoint = nextPoint;
        for (let i = 0; i < 0.5 * this.drawScale; ++i) {
            let nextBox: [Point, Point] = [new Point(nextPoint.x - 10, nextPoint.y - 10), new Point(nextPoint.x + 10, nextPoint.y + 10)];
            let nextNextPoint = nextPoint;
            let nextNextNorm = 0;
            //let scale = 1 / Math.log(nextPoint.subtract(midpoint).norm());
            //if (scale > 1)
            //    scale = 1;

            for (let i = nextBox[0].x; i < nextBox[1].x; i += 0.5) {
                for (let j = nextBox[0].y; j < nextBox[1].y; j += 0.5) {
                    let rCanvas = new Point(i, j);
                    let rModel = this.canvasToModel(rCanvas);

                    let diff = Math.abs(this.d(p, rModel) - this.d(rModel, q));
                    if (drawOption == HilbertBisectorDrawOption.Epsilon)
                        p5.stroke('pink');
                    else {
                        let col = (0.5 + Math.atan(15 * diff) / Math.PI) * 255;
                        p5.stroke(col, 0, col);
                    }
                    p5.point(rCanvas.x, rCanvas.y);
                    p5.stroke('purple');

                    if (diff < epsilon) {
                        if (drawOption == HilbertBisectorDrawOption.Epsilon)
                            p5.point(rCanvas.x, rCanvas.y);
                        bisectingPoints.push(rCanvas);
                        let nr = rCanvas.subtract(nextPoint);
                        let signedNorm = Math.sign(coorient.dot(nr)) * nr.normSquared();
                        if (signedNorm > nextNextNorm) {
                            nextNextNorm = signedNorm;
                            nextNextPoint = rCanvas;
                        }
                    }
                }
            }

            //nextPoint = nextNextPoint.add(offset);
            nextPoint = nextNextPoint;
            epsilon -= epsilon / bisectingPoints.length;
        }
    }

    /**
     * Draws the Hilbert bisector between points p and q.
     * @param {number} epsilon - Error parameter for testing equidistance
     */
    drawBisector(p5: P5, p: Vector, q: Vector, drawOption: HilbertBisectorDrawOption, epsilon: number = 0.003): void {
        let pCanvas = this.modelToCanvas(p);
        let qCanvas = this.modelToCanvas(q);

        let bisectingPoints: Point[] = [];

        let pq = q.subtract(p);
        let coorient = Vector.fromList(-pq.y(), pq.x(), 1).normalizeXY();
        let midpoint: Point = null;

        p5.strokeWeight(1);
        p5.stroke('pink');

        let xMax = Math.max(pCanvas.x, qCanvas.x) + 1;
        let xMin = Math.min(pCanvas.x, qCanvas.x) - 1;
        let yMax = Math.max(pCanvas.y, qCanvas.y) + 1;
        let yMin = Math.min(pCanvas.y, qCanvas.y) - 1;

        for (let i = xMin; i < xMax && midpoint === null; i += 1) {
            for (let j = yMin; j < yMax && midpoint === null; j += 1) {
                let rCanvas = new Point(i, j);
                let rModel = this.canvasToModel(rCanvas);

                //p5.point(rCanvas.x, rCanvas.y);

                if (Math.abs(this.d(p, rModel) - this.d(rModel, q)) < epsilon) {
                    bisectingPoints.push(rCanvas);
                    midpoint = rCanvas;
                }
            }
        }

        this.drawBisectorContinue(p5, p, q, midpoint, coorient, bisectingPoints, drawOption, epsilon);
        this.drawBisectorContinue(p5, p, q, midpoint, coorient.negate(), bisectingPoints, drawOption, epsilon);

        p5.stroke('purple');
        //for (let i = 0; i < bisectingPoints.length; ++i) {
        //    p5.point(bisectingPoints[i].x, bisectingPoints[i].y);
        //}
    }

    cols = [];

    // This probably won't work right now
    tesselate(p5: P5, points: Vector[]): void {
        p5.strokeWeight(2);

        let len = this.cols.length;
        for (let i = 0; i < points.length - len; ++i) {
            this.cols.push([randInt(0, 255), randInt(0, 255), randInt(0, 255)]);
        }

        for (let x = 5; x <= this.drawOrigin.x + this.drawScale; x += 1) {
            for (let y = 5; y <= this.drawOrigin.y + this.drawScale; y += 1) {
                let p = this.canvasToModel(new Point(x, y));

                let minDistance = Number.POSITIVE_INFINITY;
                let col: [number, number, number] = [0, 0, 0];

                for (let i = 0; i < points.length; ++i) {
                    let distance = this.d(p, points[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        col = this.cols[i];
                    }
                }

                p5.stroke(...col);
                p5.point(x, y);
            }
        }

        for (let i = 0; i < points.length; ++i) {
            let p = this.modelToCanvas(points[i]);
            p5.stroke(255);
            p5.strokeWeight(3);
            p5.point(p.x, p.y);
        }
    }
}


export { MetricFunction, Model, DiskModel, PoincareModel, KleinModel, ConvexProjectiveModel, HilbertBisectorDrawOption };
