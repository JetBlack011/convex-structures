import P5 from "p5";
import { Point } from "./geometry";

function rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
    return Math.floor(rand(min, max));
}

function binarySearch(nums: number[], target: number): number {
    let left: number = 0;
    let right: number = nums.length - 1;
    let mid: number = 0;

    if (nums.length == 0 || target < nums[left])
        return -1;
    if (target > nums[right])
        return right;

    while (left <= right) {
        mid = Math.floor((left + right) / 2);

        if (nums[mid] === target) return mid;
        if (target < nums[mid]) right = mid - 1;
        else if (mid == left + 1) return mid;
        else left = mid + 1;
    }

    return mid;
}

class Stack<T> {
    private storage: T[] = [];

    push(item: T): void {
        this.storage.push(item);
    }

    pop(): T | undefined {
        return this.storage.pop();
    }

    peek(): T | undefined {
        return this.storage[this.size() - 1];
    }

    size(): number {
        return this.storage.length;
    }
}

export { rand, randInt, Stack, binarySearch };
