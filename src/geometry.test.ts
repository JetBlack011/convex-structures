import {describe, expect, test} from '@jest/globals';
import {Point, Circle, Edge, Simplex} from './geometry';
import {Vector} from './linalg';

describe('Edge', () => {
    let v1 = Vector.fromList(1,2,3);
    let v2 = Vector.fromList(4,5,6);
    let v3 = Vector.fromList(1,1,1);
    test('Constructor', () => {
        let e = new Edge(v1, v2);
        expect(e.v1.equals(v1)).toBeTruthy();
        expect(e.v2.equals(v2)).toBeTruthy();
    });

    test('equals', () => {
        let e1 = new Edge(v1, v2);
        let e2 = new Edge(v1, v2);
        let e3 = new Edge(v2, v1);
        let e4 = new Edge(v1, v3);
        expect(e1.equals(e1)).toBeTruthy();
        expect(e1.equals(e2)).toBeTruthy();
        expect(e1.equals(e3)).toBeTruthy();
        expect(e1.equals(e4)).toBeFalsy();
        expect(e3.equals(e4)).toBeFalsy();
    });

    test('toString', () => {
        let e = new Edge(v1, v2);
        expect(e.toString()).toBe('[(1, 2, 3), (4, 5, 6)]');
    });

    test('hash', () => {
        let e = new Edge(v1, v2);
        expect(e.hash()).toBe('1245');
    });
})

describe('Point', () => {
    let p = new Point(0, 1);
    let p1 = new Point(0, 1);
    let p2 = new Point(2, 3);
    let v = Vector.fromList(-2, -2, 1);

    test('Constructor', () => {
        expect(p.x).toBe(0);
        expect(p.y).toBe(1);
    });

    test('subtract', () => {
        expect(p.subtract(p2).equals(v)).toBeTruthy();
    });

    test('equals', () => {
        expect(p.equals(p)).toBeTruthy();
        expect(p.equals(p1)).toBeTruthy();
        expect(p.equals(p2)).toBeFalsy();
    });

    test('add', () => {
        expect(p2.add(v).equals(p)).toBeTruthy();
    });
});

describe('Simplex', () => {
    let vertices = [Vector.fromList(0, 0, 1), Vector.fromList(1, 0, 1), Vector.fromList(0, 1, 1)];
    let s = new Simplex(vertices);

    test('Constructor', () => {
        expect(s.n).toBe(2);
        expect(s.edges.reduce((acc: boolean, e, i) => {
            acc = acc && e.equals(new Edge(vertices[i], vertices[(i+1) % 3]));
            return acc;
        }, true)).toBeTruthy();
    });
});

//test('Cirucmcircle', () => {
//    let d = (v1: Vector, v2: Vector) => v1.subtract(v2).norm();
//    let s = new Simplex([
//        Vector.fromList(0, 0, 1),
//        Vector.fromList(0, 1, 1),
//        Vector.fromList(1, 0, 1),
//    ]);
//    expect(s.circumcircle(d)).toBe([[.5, .5], 1/Math.sqrt(2)]);
//});
