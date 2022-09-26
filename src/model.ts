import P5 from "p5";

import {Point, Matrix, Vector, ComplexNumber, LinearTransformation, MobiusTransformation} from "./linalg";

interface Model {
    drawOrigin: Point;
    d(z: ComplexNumber, w: ComplexNumber): number;
    affineToModel(p: Point): ComplexNumber;
    modelToAffine(z: ComplexNumber): Point;
    draw(p5: P5): void;
    drawPoint(p5: P5, z: ComplexNumber): void;
    drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber): void;
}

class DiskModel implements Model {
    drawOrigin: Point;
    drawRadius: number;

    globalTransformation: MobiusTransformation;

    /**
     * @param {Point} drawOrigin - The point at which to draw the disk
     * @param {number} drawRadius - The radius of the disk in the canvas
     */
    constructor(drawOrigin: Point, drawRadius: number) {
        this.drawOrigin = drawOrigin;
        this.drawRadius = drawRadius;
        this.globalTransformation = new MobiusTransformation();
        this.globalTransformation.setAsIdentity();
    }

    transfrom(globalTransformation: MobiusTransformation) {
        this.globalTransformation = globalTransformation;
    }

    affineToModel(p: Point): ComplexNumber {
        let z = new ComplexNumber((p.x - this.drawOrigin.x) / this.drawRadius * 2, -(p.y - this.drawOrigin.y) / this.drawRadius * 2);

        //return this.globalTransformation.T(z);
        return z;
    }

    modelToAffine(z: ComplexNumber): Point {
        //z = this.globalTransformation.T(z);

        return {x: z.Re * this.drawRadius / 2 + this.drawOrigin.x, y: -z.Im * this.drawRadius / 2 + this.drawOrigin.y};
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
        //z = this.globalTransformation.T(z);
        //w = this.globalTransformation.T(w);

        return Math.acosh(1 + this.delta(z, w));
    }

    /**
     * Render the model in p5.
     * @param {P5} p5 - A reference to the canvas
     */
    draw(p5: P5) {
        p5.strokeWeight(1);
        p5.circle(this.drawOrigin.x, this.drawOrigin.y, this.drawRadius);
    }

    /**
     * Draw a point in the disk
     * @param {Point} p - The point in D to draw, -1 < ||p|| < 1
     */
    drawPoint(p5: P5, z: ComplexNumber): void {
        //z = this.globalTransformation.T(z);

        p5.strokeWeight(10);
        let p = this.modelToAffine(z);
        p5.point(p.x, p.y);
    }

    drawGeodesic(p5: P5, z: ComplexNumber, w: ComplexNumber) {
        //z = this.globalTransformation.T(z);
        //w = this.globalTransformation.T(w);

        p5.strokeWeight(1);

        let u = z.normalize();
        let v = w.normalize();

        // If p and q are collinear, drawing a circle is hard; use a line instead
        if (u.equals(v) || u.equals(v.scale(-1))) {
            let p = this.modelToAffine(z);
            let q = this.modelToAffine(w);
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

        if (this.mod(theta2 - theta1, 2 * Math.PI) > this.mod(theta1 - theta2, 2 * Math.PI)) {
            let temp = theta1;
            theta1 = theta2;
            theta2 = temp;
        }

        let affineCenter = this.modelToAffine(center);
        let affineR = r * this.drawRadius;

        // Draw geodesic arc between p and q
        p5.arc(affineCenter.x, affineCenter.y, affineR, affineR, theta1, theta2);
    }
}

export {Point, Vector, Model, DiskModel};
