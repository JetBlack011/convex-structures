import { inv } from 'mathjs';

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
        return new Matrix(n, n, mat);
    }

    static fromMatrix(mat: Matrix) {
        return new this(mat.rows, mat.columns, mat.mat);
    }

    constructor(rows: number, columns: number, mat?: number[][]) {
        this.rows = rows;
        this.columns = columns;

        if (typeof mat !== 'undefined') {
            if (mat.length != rows || mat[0].length != columns)
                throw new Error("Number of rows and columns must match given matrix!");
            this.mat = mat;
        } else {
            this.mat = new Array(rows);
            for (let i = 0; i < rows; ++i) {
                this.mat[i] = new Array(columns);
                for (let j = 0; j < columns; ++j) {
                    this.mat[i][j] = 0;
                }
            }
        }
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
        return new Matrix(this.rows - 1, this.columns - 1, this.mat
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

        return new Matrix(this.columns, this.rows, mat0);
    }

    inverse(): Matrix {
        return new Matrix(this.rows, this.columns, inv(this.mat)); // TODO: this is cringe
        //let det = this.determinant();
        //if (det === 0)
        //    throw new Error("Determinant cannot be 0!");

        //// Get cofactor matrix
        //let sign = -1;
        //let cofactor = new Matrix(this.rows, this.columns,
        //    this.mat.map((row, i) => row.map((_, j) => {
        //        sign *= -1;
        //        return sign * this.getCofactor(i, j).determinant();
        //    })));

        //// Transpose it
        //let transposedCofactor = cofactor.transpose();
        //// Compute inverse of transposed / determinant on each value
        //return new Matrix(this.rows, this.columns,
        //    this.mat.map((row, i) => row.map((_, j) => transposedCofactor.at(i, j) / det)));
    }

    multiply(other: Matrix): Matrix {
        if (this.columns != other.rows)
            throw new Error("Dimension mismatch");

        let result = new Matrix(this.rows, other.columns);

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
        let result = new Matrix(this.rows, this.columns);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j)
                result.mat[i][j] = this.mat[i][j] * c;
        }

        return result;
    }

    equals(other: Matrix): boolean {
        if (this.rows != other.rows || this.columns != other.columns)
            return false;

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j) {
                if (this.mat[i][j] != other.mat[i][j])
                    return false;
            }
        }

        return true;
    }
}

class Vector extends Matrix {
    static fromMatrix(mat: Matrix): Vector {
        return new Vector(mat.rows, mat.mat);
   }

    static fromVector(v: Vector) {
        return new Vector(v.rows, v.mat);
    }

    static fromList(...arr: number[]) {
        let mat = [];
        for (let i = 0; i < arr.length; ++i)
            mat.push([arr[i]]);
        return new Vector(arr.length, mat);
    }

    constructor(rows: number, mat?: number[][]) {
        super(rows, 1, mat);
    }

    at(i: number) {
        return super.at(i, 0);
    }

    scale(c: number): Vector {
        return new Vector(this.rows, super.scale(c).mat);
    }

    add(other: Vector): Vector {
        if (other.rows != this.rows)
            throw new Error("Dimension mismatch");

        let result = new Vector(this.rows);

        for (let i = 0; i < this.rows; ++i)
            result.mat[i][0] = this.at(i) + other.at(i);

        return result;
    }

    subtract(other: Vector): Vector {
        return this.add(other.scale(-1));
    }

    dot(other: Vector): number {
        return this.transpose().multiply(other).at(0, 0);
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
        let l: number[] = [];
        for (let i = 0; i < this.mat.length; ++i)
            l.push(this.at(i) / z);
        return Vector.fromList(...l);
    }

    equals(other: Vector): boolean {
        return super.equals(other);
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
        return new LinearTransformation(mat.rows, mat.columns, mat.mat);
    }

    constructor(rows: number, columns: number, mat?: number[][]) {
        this.mat = new Matrix(rows, columns, mat);
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

class MobiusTransformation implements Transformation {
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
        return new Vector(2, [[result.Re], [result.Im]]);
    }

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
}

export {Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation};
