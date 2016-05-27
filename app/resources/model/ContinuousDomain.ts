/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 09:27:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 09:56:44
*/


import { Domain } 		from './Domain';


export class ContinuousDomain implements Domain {
	
	type: string;
	private minValue: number;
	private maxValue: number;

	constructor(minValue: number, maxValue: number) {
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.type = 'continuous';
	}

	setRange(minValue: number, maxValue: number) {
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