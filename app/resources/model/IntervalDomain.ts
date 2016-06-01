/*
* @Author: aaronpmishkin
* @Date:   2016-06-01 11:59:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-01 12:29:07
*/

import { Domain } 			from './Domain';

export class IntervalDomain implements Domain {

	public type: string;
	private interval: number;
	private min: number;
	private max: number;

	constructor(min: number, max: number, interval: number) {
		this.type = "interval";
		this.interval = interval;
		this.min = min;
		this.max = max;
	}

	getInterval(): number {
		return this.interval;
	}

	setInterval(interval: number): void {
		this.interval = interval;
	}

	getRange(): number[] {
		return [this.min, this.max];
	}

	setRange(range: number[]): void {
		this.min = range[0];
		this.max = range[1];
	}

	getElements(): number[] {
		var elements: number[] = [];
		var currentElement: number = this.min;
		while (currentElement < this.max) {
			elements.push(currentElement);
			currentElement += this.interval;
		}
		elements.push(this.max);

		return elements;
	}
}