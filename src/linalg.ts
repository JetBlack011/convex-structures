import { inv, eigs as matheigs } from 'mathjs';

const EPSILON = 0.0001;

class Matrix {
    mat: number[][];
    rows: number;
    columns: number;

    static identity(n: number): Matrix {
        let mat = [];
        for (let i = 0; i < n; ++i) {
            mat.push([]);
            for (let j = 0; j < n; ++j) {
                mat[i].push(i == j ? 1 : 0);
            }
        }
        return new Matrix(mat);
    }

    static zeros(n: number, m: number): Matrix {
        let mat = [];
        for (let i = 0; i < n; ++i) {
            mat.push([]);
            for (let j = 0; j < m; ++j) {
                mat[i].push(0);
            }
        }
        return new Matrix(mat);
    }

    static fromMatrix(mat: Matrix) {
        return new Matrix(mat.mat);
    }

    static fromBasis(...e: Vector[]) {
        return new Matrix(
            e.map((v) => v.transpose().mat[0])
        ).transpose();
    }

    static E(i: number, j: number, n: number) {
        let result = Matrix.zeros(n, n);
        result.mat[i][j] = 1;
        return result;
    }

    constructor(mat: number[][]) {
        this.rows = mat.length;
        this.columns = this.rows == 0 ? 0 : mat[0].length;

        if (mat.length != this.rows || mat[0].length != this.columns)
            throw new Error("Number of rows and columns must match given matrix!");
        this.mat = mat;
    }

    /**
     * Get a matrix value, from its position
     * @param row Matrix line, from 0 to `rows`
     * @param col Matric column, from 0 to `columns`
     */
    at(row: number, col: number): number {
        return this.mat[row][col];
    }

    /**
     * Gets a cofactor matrix
     * @param row The row to omit in the matrix
     * @param col The column to omit in the matrix
     * @return The cofactor matrix sized (n-1)x(n-1)
     */
    getCofactor(row: number, col: number): Matrix {
        return new Matrix(this.mat
            .filter((_, i) => i !== row) // Remove the unnecessary row
            .map((c) => c.filter((_, i) => i !== col)));
    }

    /**
     * Computes the determinant of the matrix
     * @throws Error if the matrix is not squared
     */
    determinant(): number {
        let det = 0;
        let sign = 1;
        switch (this.rows) {
        case 1:
            det = this.mat[0][0];
            break;
        case 2:
            det = this.mat[0][0] * this.mat[1][1] - this.mat[1][0] * this.mat[0][1];
            break;
        default:
            for (let i = 0; i < this.rows; i++) {
                let minor = this.getCofactor(0, i);
                det += sign * this.at(0, i) * minor.determinant();
                sign = -sign;
            }
        }
        return det;
    }

    eigs(): {values: number[], vectors: Vector[]} {
        let eigs = matheigs(this.mat);
        let vectors: Vector[] = [];
        let values: number[] = [];
        eigs.vectors.forEach((v) => {
            let arr = [];
            v.forEach((n: number) => {
                arr.push([n]);
            });
            vectors.push(new Vector(arr));
        });
        eigs.values.forEach((lambda) => {
            values.push(lambda);
        });

        return {values: values, vectors: vectors};
    }

    /**
     * Computes a transposed the matrix
     * @return A new matrix sized (columns) x (rows)
     */
    transpose(): Matrix {
        let mat0 = [];
        for (let i = 0; i < this.columns; ++i)
            mat0.push([]);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j)
                mat0[j].push(this.mat[i][j]);
        }

        return new Matrix(mat0);
    }

    add(other: Matrix): Matrix {
        if (this.rows != other.rows || this.columns != other.columns)
            throw new Error("Dimension mismatch");

        let result = Matrix.zeros(this.rows, this.columns);
        for (let i = 0; i < result.rows; ++i) {
            for (let j = 0; j < result.columns; ++j) {
                result.mat[i][j] = this.at(i, j) + other.at(i, j);
            }
        }

        return result;
    }

    subtract(other: Matrix): Matrix {
        return this.add(other.negate());
    }

    inverse(): Matrix {
        return new Matrix(inv(this.mat)); // TODO: this is cringe
    }

    multiply(other: Matrix): Matrix {
        if (this.columns != other.rows)
            throw new Error("Dimension mismatch");

        let result = Matrix.zeros(this.rows, other.columns);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < other.columns; ++j) {
                result.mat[i][j] = 0;
                for (let k = 0; k < other.rows; ++k)
                    result.mat[i][j] += this.mat[i][k] * other.mat[k][j];
            }
        }

        return result;
    }

    scale(c: number): Matrix {
        let result = Matrix.zeros(this.rows, this.columns);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j)
                result.mat[i][j] = this.mat[i][j] * c;
        }

        return result;
    }

    negate(): Matrix {
        return this.scale(-1);
    }

    equals(other: Matrix, epsilon: number = 0): boolean {
        if (this.rows != other.rows || this.columns != other.columns)
            return false;

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j) {
                if (Math.abs(this.mat[i][j] - other.mat[i][j]) > epsilon)
                    return false;
            }
        }

        return true;
    }
}

class Vector extends Matrix {
    static fromMatrix(mat: Matrix): Vector {
        return new Vector(mat.mat);
   }

    static fromVector(v: Vector): Vector {
        return new Vector(v.mat);
    }

    static zeros(n: number): Vector {
        return Vector.fromMatrix(Matrix.zeros(n, 1));
    }

    static fromList(...arr: number[]) {
        let mat = [];
        for (let i = 0; i < arr.length; ++i)
            mat.push([arr[i]]);
        return new Vector(mat);
    }

    static e(i: number, n: number): Vector {
        let res = Vector.zeros(n);
        res.mat[i][0] = 1;
        return res;
    }

    constructor(mat: number[][]) {
        if (mat.length > 0 && mat[0].length > 1)
            throw new Error("Given matrix does not define a vector!");
        super(mat);
    }

    at(i: number) {
        return this.mat[i][0];
    }

    x(): number {
        return this.at(0);
    }

    y(): number {
        return this.at(1);
    }

    z(): number {
        return this.at(2);
    }

    xy(): Vector {
        return Vector.fromList(this.x(), this.y());
    }

    scale(c: number): Vector {
        return Vector.fromMatrix(super.scale(c));
    }

    negate(): Vector {
        return Vector.fromMatrix(super.negate());
    }

    add(other: Vector): Vector {
        return Vector.fromMatrix(super.add(other));
    }

    subtract(other: Vector): Vector {
        let res = Array(this.rows);
        for (let i = 0; i < this.rows; ++i) {
            res[i] = [this.mat[i][0] - other.mat[i][0]];
        }
        return new Vector(res);
    }

    cross(other: Vector): Vector {
        if (this.rows != 3 || other.rows != 3)
            throw new Error("Expected vectors with length 3");

        return Vector.fromList(
            this.at(1) * other.at(2) - this.at(2) * other.at(1),
            this.at(2) * other.at(0) - this.at(0) * other.at(2),
            this.at(0) * other.at(1) - this.at(1) * other.at(0)
        );
    }

    dot(other: Vector): number {
        return this.transpose().multiply(other).at(0, 0);
    }

    project(other: Vector): Vector {
        return this.normalize().scale(this.dot(other) / this.norm());
    }

    normSquared(): number {
        return this.dot(this);
    }

    norm(): number {
        return Math.sqrt(this.normSquared());
    }

    normalize(): Vector {
        return this.scale(1/this.norm());
    }

    homogenize(idx: number = this.rows - 1): Vector {
        let z = this.at(idx);

        if (z >= EPSILON) {
            let l: number[] = [];
            for (let i = 0; i < this.mat.length; ++i)
                l.push(this.at(i) / z);
            return Vector.fromList(...l);
        } else {
            this.mat[this.rows - 1][0] = 0;
            return this.normalize();
        }
    }

    equals(other: Vector, epsilon: number = 0): boolean {
        return super.equals(other, epsilon);
    }

    toString(): string {
        let res = "(";
        for (let i = 0; i < this.rows; ++i) {
            res += this.at(i);
            if (i != this.rows - 1)
                res += ', ';
        }
        res += ")";
        return res;
    }
}

class ComplexNumber {
    Re: number;
    Im: number;

    static fromVector(v: Vector): ComplexNumber {
        return new ComplexNumber(v.at(0), v.at(1));
    }

    constructor(Re: number, Im: number) {
        this.Re = Re;
        this.Im = Im;
    }

    negative(): ComplexNumber {
        return new ComplexNumber(-this.Re, -this.Im);
    }

    add(other: ComplexNumber): ComplexNumber {
        return new ComplexNumber(this.Re + other.Re, this.Im + other.Im);
    }

    subtract(other: ComplexNumber): ComplexNumber {
        return this.add(other.negative());
    }

    multiply(other: ComplexNumber): ComplexNumber {
        return new ComplexNumber(this.Re * other.Re + this.Im * other.Im, this.Re * other.Im + this.Im * other.Re);
    }

    divide(other: ComplexNumber): ComplexNumber {
        return new ComplexNumber((this.Re * other.Re + this.Im * other.Im) / (other.Re**2 + other.Im**2), (this.Im * other.Re - this.Re * other.Im) / (other.Re**2 + other.Im**2));
    }

    normalize(): ComplexNumber {
        let mod = this.modulus();
        return new ComplexNumber(this.Re / mod, this.Im / mod);
    }

    conjugate(): ComplexNumber {
        return new ComplexNumber(this.Re, -this.Im);
    }

    modulus(): number {
        return Math.sqrt(this.Re**2 + this.Im**2);
    }
}

interface Transformation {
    T(x: Vector): Vector;
    compose(other: Transformation): Transformation;
    inverse(): Transformation;
    clone(): Transformation;
}

class LinearTransformation implements Transformation {
    mat: Matrix;

    static identity(n: number): LinearTransformation {
        return LinearTransformation.fromMatrix(Matrix.identity(n));
    }

    static fromMatrix(mat: Matrix): LinearTransformation {
        return new LinearTransformation(mat.mat);
    }

    constructor(mat?: number[][]) {
        this.mat = new Matrix(mat);
    }

    T(v: Vector): Vector {
        return Vector.fromMatrix(this.mat.multiply(v));
    }

    compose(other: LinearTransformation): LinearTransformation {
        return LinearTransformation.fromMatrix(this.mat.multiply(other.mat));
    }

    inverse(): LinearTransformation {
        return LinearTransformation.fromMatrix(this.mat.inverse());
    }
    
    clone(): LinearTransformation {
        return LinearTransformation.fromMatrix(Matrix.fromMatrix(this.mat));
    }

    transpose(): LinearTransformation {
        return LinearTransformation.fromMatrix(this.mat.transpose());
    }
}

// TODO: Figure this out
class MobiusTransformation { //implements Transformation {
    a: ComplexNumber;
    b: ComplexNumber;
    c: ComplexNumber;
    d: ComplexNumber;

    static identity(): MobiusTransformation {
        let a = new ComplexNumber(1, 0);
        let b = new ComplexNumber(0, 0);
        let c = new ComplexNumber(0, 0);
        let d = new ComplexNumber(1, 0);
        return new MobiusTransformation(a, b, c, d);
    }

    constructor(a: ComplexNumber, b: ComplexNumber, c: ComplexNumber, d: ComplexNumber) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /**
     * z represents a complex number, hence is necessarily 2D
     */
    T(v: Vector): Vector {
        let z = ComplexNumber.fromVector(v);
        let result = z.multiply(this.a).add(this.b).divide(z.multiply(this.c).add(this.d));
        return new Vector([[result.Re], [result.Im]]);
    }

    /*
    compose(other: MobiusTransformation): MobiusTransformation {
        let a0 = this.a.multiply(other.a).add(this.b.multiply(other.c));
        let b0 = this.a.multiply(other.b).add(this.b.multiply(other.d));
        let c0 = this.c.multiply(other.a).add(this.d.multiply(other.c));
        let d0 = this.c.multiply(other.b).add(this.d.multiply(other.d));
        return new MobiusTransformation(a0, b0, c0, d0);
    }

    inverse(): MobiusTransformation {
        return new MobiusTransformation(this.d, this.b.negative(), this.c.negative(), this.a);
    }
    */
}

export {Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation, EPSILON};
