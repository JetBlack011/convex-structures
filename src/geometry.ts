import {Matrix, Vector} from './linalg';
import {MetricFunction} from './model';

type Edge = [Vector, Vector];
type Circle = [Vector, number];

class Simplex {
    n: number;          // Dimension
    vertices: Vector[]; // Vertex list
    edges: Edge[];      // Edge list

    constructor(vertices: Vector[]) {
        this.n = vertices.length - 1;
        this.edges = [];
        for (let i = 0; i <= this.n; ++i)
            this.edges.push([vertices[i], vertices[(i + 1) % vertices.length]]);
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

        let M = new Matrix(this.vertices.length + 1, this.vertices.length + 1, mat);
        let Q = M.inverse();
        let barycentric_circumcenter = [];

        for (let i = 0; i <= this.n; ++i) {
            let s = 0;
            for (let j = 1; j <= this.n + 1; ++j)
                s += Q.at(0, j);
            barycentric_circumcenter.push(Q.at(0,i + 1) / s);
        }

        let circumcenter = new Vector(this.n + 1);
        circumcenter = circumcenter.scale(0);
        for (let i = 0; i <= this.n; ++i) {
            circumcenter = circumcenter.add(this.vertices[i].scale(barycentric_circumcenter[i]));
        }

        console.log(circumcenter);
        return [circumcenter, Math.sqrt(Q.at(0,0))];
    }
}

export {Edge, Circle, Simplex};
