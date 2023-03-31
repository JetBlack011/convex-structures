import {describe, expect, test} from '@jest/globals';
import {Matrix, Vector} from './linalg';

describe('Matrix', () => {
    let m = Matrix.identity(3);
    test('eigs', () => {
        let eigs = m.eigs();
        expect(JSON.stringify(eigs.values)).toBe('[1,1,1]');
        for (let i = 0; i < eigs.vectors.length; ++i) {
            expect(eigs.vectors[i].toString()).toBe(Vector.e(i, 3).toString());
        }
    });
});
