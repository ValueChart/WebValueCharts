/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 09:27:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 21:05:58
*/

// Import Model Classes:
import { Domain } 		from './Domain';


/*
	This class represents a continuous domain. An continuous domain is a domain that is densely includes every value between a minimum and maximum value.
	For example, a continuous domain [0,10] is a domain that includes 0, 10 and all possible values between them.
	Continuous domains are assigned scores by the ContinuousScoreFunction.
*/

export class ContinuousDomain implements Domain {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;			// The type of the domain. Should always be 'continuous'.
	private minValue: number;		// The minimum value of the domain. Inclusive.
	private maxValue: number;		// The maximum value of the domain. Inclusive.
	public unit: string;			// The unit of the domain. For example: dollars, meters, etc.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(minValue?: number, maxValue?: number, unit?: string) {
		if (minValue !== undefined)
			this.minValue = minValue;
		if (maxValue !== undefined)
			this.maxValue = maxValue;

		if (unit)
			this.unit = unit;

		this.type = 'continuous';
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

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