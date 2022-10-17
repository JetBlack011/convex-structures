class Matrix<T extends number | ComplexNumber> {
    mat: T[][];
    rows: number;
    columns: number;

    constructor(rows: number, columns: number, mat?: T[][]) {
        this.rows = rows;
        this.columns = columns;

        if (typeof mat !== 'undefined')
            this.mat = mat;
        else {
            this.mat = new Array(rows);
            for (let i = 0; i < rows; ++i) {
                this.mat[i] = new Array(columns);
                for (let j = 0; j < columns; ++j) {
                    this.mat[i][j] = 0; // ????
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
            .filter((v, i) => i !== row) // Remove the unnecessary row
            .map((c) => c.filter((v, i) => i !== col)));
    }

    /**
     * Computes the determinant of the matrix
     * @throws Error if the matrix is not squared
     */
    determinant(): number {
        let det = 0;
        let sign = 1;
        if (this.rows === 2) {
            det = this.mat[0][0] * this.mat[1][1] - this.mat[1][0] * this.mat[0][1];
        } else {
            for (let i = 0; i < this.rows; i++) {
                const minor = this.getCofactor(0, i);
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
        return new Matrix(this.columns, this.rows, new Array<number[]>(this.columns).fill([])
            .map((row, i) => new Array<number>(this.rows).fill(0).map((c, j) => this.at(j, i))));
    }

    inverse(): Matrix {
        const det = this.determinant();

        // Get cofactor matrix
        let sign = -1;
        const cofactor = new Matrix (this.rows, this.columns,
            this.mat.map((row, i) => row.map((val, j) => {
                sign *= -1;
                return sign * this.getCofactor(i, j).determinant();
            })));
        // Transpose it
        const transposedCofactor = cofactor.transpose();
        // Compute inverse of transposed / determinant on each value
        return new Matrix(this.rows, this.columns,
            this.mat.map((row, i) => row.map((val, j) => transposedCofactor.at(i, j) / det)));
    }

    /**
     * Sets the matrix as an identity matrix
     */
    setAsIdentity(): void {
        this.mat.forEach((row, i) => {
            row.forEach((c, j) => {
                this.mat[i][j] = i === j ? 1 : 0;
            });
        });
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

    equals(other: Vector): boolean {
        return super.equals(other);
    }
}

class ComplexNumber extends Vector {
    Re: number;
    Im: number;

    constructor(Re: number, Im: number) {
        super(2, [[Re], [Im]]);

        this.Re = Re;
        this.Im = Im;
    }

    add(other: ComplexNumber): ComplexNumber {
        let result = super.add(other);
        return new ComplexNumber(result.at(0), result.at(1));
    }

    subtract(other: ComplexNumber): ComplexNumber {
        let result = super.subtract(other);
        return new ComplexNumber(result.at(0), result.at(1));
    }

    multiply(other: ComplexNumber): ComplexNumber {
        return new ComplexNumber(this.Re * other.Re + this.Im * other.Im, this.Re * other.Im + this.Im * other.Re);
    }

    divide(other: ComplexNumber): ComplexNumber {
        return new ComplexNumber((this.Re * other.Re + this.Im * other.Im) / (other.Re**2 + other.Im**2), (this.Im * other.Re - this.Re * other.Im) / (other.Re**2 + other.Im**2));
    }

    normalize(): ComplexNumber {
        let result = super.normalize();
        return new ComplexNumber(result.at(0), result.at(1));
    }

    modulus(): number {
        return super.norm();
    }
}

interface Transformation {
    T(v: Vector): Vector;
    compose(other: Transformation): Transformation;
}

class LinearTransformation extends Matrix implements Transformation {
    constructor(rows: number, columns: number, mat?: number[][]) {
        super(rows, columns, mat);
    }

    T(v: Vector): Vector {
        return new Vector(v.rows, this.multiply(v).mat);
    }

    compose(other: LinearTransformation): Transformation {
        let result = this.multiply(other);
        return new LinearTransformation(result.rows, result.columns, result.mat);
    }
}

class MobiusTransformation extends Matrix<ComplexNumber> implements Transformation {
    a: ComplexNumber;
    b: ComplexNumber;
    c: ComplexNumber;
    d: ComplexNumber;

    constructor(a?: ComplexNumber, b?: ComplexNumber, c?: ComplexNumber, d?: ComplexNumber) {
        if (typeof a !== 'undefined')
            super(4, 4, [[a.Re, a.Im, b.Re, b.Im], [c.Re, c.Im, d.Re, d.Im]]);
        else
            super(4, 4);

        if (typeof a !== 'undefined')
            this.a = a;
        else
            this.a = new ComplexNumber(0, 0);

        if (typeof b !== 'undefined')
            this.b = b;
        else
            this.b = new ComplexNumber(0, 0);

        if (typeof c !== 'undefined')
            this.c = c;
        else
            this.c = new ComplexNumber(0, 0);

        if (typeof d !== 'undefined')
            this.d = d;
        else
            this.d = new ComplexNumber(0, 0);
    }

    /**
     * z represents a complex number, hence is necessarily 2D
     */
    T(z: ComplexNumber): ComplexNumber {
        return z.multiply(this.a).add(this.b).divide(z.multiply(this.c).add(this.d));
    }

    compose(other: MobiusTransformation): MobiusTransformation {
        let result = this.multiply(other);
        return new MobiusTransformation(
    }

    setAsIdentity() {
        super.setAsIdentity();
        this.a = new ComplexNumber(1, 0);
        this.b = new ComplexNumber(0, 0);
        this.c = new ComplexNumber(0, 0);
        this.d = new ComplexNumber(1, 0);
    }
}

export {Matrix, Vector, ComplexNumber, Transformation, LinearTransformation, MobiusTransformation};
