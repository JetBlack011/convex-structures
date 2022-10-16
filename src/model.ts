import P5 from "p5";

import {Point} from './utils';
import {Matrix, Vector, ComplexNumber, LinearTransformation, MobiusTransformation} from "./linalg";

/**
 * Represents a model of hyperbolic space. Classes which implement
 * this interface should provide a metric and know how to draw itself
 * on the canvas.
 */
interface Model {
    drawOrigin: Point;
    d(z: ComplexNumber, w: ComplexNumber): number;
    canvasToModel(p: Point): ComplexNumber;
    modelToCanvas(z: ComplexNumber): Point;
    draw(p5: P5): void;
    drawPoint(p5: P5, z: ComplexNumber): void;
    drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber): void;
}

abstract class DiskModel implements Model {
    drawOrigin: Point;
    drawRadius: number;

    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {number} drawRadius - The radius of the disk in the canvas
     */
    constructor(drawOrigin: Point, drawRadius: number) {
        this.drawOrigin = drawOrigin;
        this.drawRadius = drawRadius;
    }

    abstract d(z: ComplexNumber, w: ComplexNumber): number;

    /**
     * Convert a point in the canvas to a point in the model
     * @param {Point} p
     */
    canvasToModel(p: Point): ComplexNumber {
        let z = new ComplexNumber((p.x - this.drawOrigin.x) / this.drawRadius * 2, -(p.y - this.drawOrigin.y) / this.drawRadius * 2);

        return z;
    }

    /**
     * Convert a point in the model to a point in the canvas
     * @param {ComplexNumber} z
     */
    modelToCanvas(z: ComplexNumber): Point {
        return {x: z.Re * this.drawRadius / 2 + this.drawOrigin.x, y: -z.Im * this.drawRadius / 2 + this.drawOrigin.y};
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
     * @param {ComplexNumber} z - The point in D to draw, |z| < 1
     */
    drawPoint(p5: P5, z: ComplexNumber): void {
        p5.strokeWeight(10);
        let p = this.modelToCanvas(z);
        p5.point(p.x, p.y);
    }

    /**
     * Draw a geodesic between two points
     * @param {P5} p5 - the p5 instance to which we should draw
     * @param {ComplexNumber} z - The first point, |z| < 1
     * @param {ComplexNumber} w - The second point, |w| < 1
     */
    abstract drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber): void;
}

/**
 * The Poincaré disk model of hyperbolic space.
 */
class PoincareModel extends DiskModel {
    globalTransformation: MobiusTransformation;

    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {number} drawRadius - The radius of the disk in the canvas
     */
    constructor(drawOrigin: Point, drawRadius: number) {
        super(drawOrigin, drawRadius);
        this.globalTransformation = new MobiusTransformation();
        this.globalTransformation.setAsIdentity();
    }

    transfrom(globalTransformation: MobiusTransformation) {
        this.globalTransformation = globalTransformation;
    }

    private delta(z: ComplexNumber, w: ComplexNumber): number {
        return 2 * z.subtract(w).normSquared() / ((1 - z.normSquared()) * (1 - w.normSquared()));
    }

    private mod(n: number, m: number): number {
        return ((n % m) + m) % m;
    }

    /**
     * Hyperbolic distance between points p and q in D.
     * @param {ComplexNumber} z
     * @param {ComplexNumber} w
     */
    d(z: ComplexNumber, w: ComplexNumber): number {
        z = this.globalTransformation.T(z);
        w = this.globalTransformation.T(w);

        return Math.acosh(1 + this.delta(z, w));
    }

    /**
     * Draw a geodesic between two points
     * @param {P5} p5 - the p5 instance to which we should draw
     * @param {ComplexNumber} z - The first point, |z| < 1
     * @param {ComplexNumber} w - The second point, |w| < 1
     */
    drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber) {
        z = this.globalTransformation.T(z);
        w = this.globalTransformation.T(w);

        p5.strokeWeight(1);

        let u = z.normalize();
        let v = w.normalize();

        // If p and q are collinear, drawing a circle is hard; use a line instead
        if (u.equals(v) || u.equals(v.scale(-1))) {
            let p = this.modelToCanvas(z);
            let q = this.modelToCanvas(w);
            p5.line(p.x, p.y, q.x, q.y);
            return;
        }

        // Compute the center and radius of tangent circle
        let a = (z.Im * (w.Re**2 + w.Im**2 + 1) - w.Im * (z.Re**2 + z.Im**2 + 1)) / (z.Re * w.Im - z.Im * w.Re);
        let b = (w.Re * (z.Re**2 + z.Im**2 + 1) - z.Re * (w.Re**2 + w.Im**2 + 1)) / (z.Re * w.Im - z.Im * w.Re);

        let center = new ComplexNumber(-a / 2, -b / 2);
        let r = Math.sqrt(center.normSquared() - 1);

        let theta1 = this.mod(-Math.atan2(z.Im - center.Im, z.Re - center.Re), 2 * Math.PI);
        let theta2 = this.mod(-Math.atan2(w.Im - center.Im, w.Re - center.Re), 2 * Math.PI);

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
}

class KleinModel extends DiskModel {
    constructor(drawOrigin: Point, drawRadius: number) {
        super(drawOrigin, drawRadius);
    }

    private crossRatio(z: ComplexNumber, w: ComplexNumber): number {
        return 0;
    }

    d(z: ComplexNumber, w: ComplexNumber): number {
        return 0.5 * Math.log(this.crossRatio(z, w));
    }

    drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber): void {

    }
}

export {Vector, Model, PoincareModel};
