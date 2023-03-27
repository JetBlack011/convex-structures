import {describe, expect, test} from '@jest/globals';
import {Circle, Simplex} from './geometry';
import {Vector} from './linalg';

test('Cirucmcircle', () => {
    let d = (v1: Vector, v2: Vector) => v1.subtract(v2).norm();
    let s = new Simplex([
        Vector.fromList(0, 0, 1),
        Vector.fromList(0, 1, 1),
        Vector.fromList(1, 0, 1),
    ]);
    expect(s.circumcircle(d)).toBe([[.5, .5], 1/Math.sqrt(2)]);
});
