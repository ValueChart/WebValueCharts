/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 09:27:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-01 16:14:12
*/


import { Domain } 		from './Domain';


export class ContinuousDomain implements Domain {

	type: string;
	private minValue: number;
	private maxValue: number;
	unit: string;

	constructor(minValue?: number, maxValue?: number, unit?: string) {
		if (minValue !== undefined)
			this.minValue = minValue;
		if (maxValue !== undefined)
			this.maxValue = maxValue;

		if (unit)
			this.unit = unit;

		this.type = 'continuous';
	}

	setRange(minValue: number, maxValue: number): void {
		this.minValue = minValue;
		this.maxValue = maxValue;
	}

	getRange(): number[] {
		return [this.minValue, this.maxValue];
	}

	getMinValue(): number {
		return this.minValue;
	}

	getMaxValue(): number {
		return this.maxValue;
	}
}