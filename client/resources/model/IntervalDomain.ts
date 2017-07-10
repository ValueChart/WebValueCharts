/*
* @Author: aaronpmishkin
* @Date:   2016-06-01 11:59:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 21:03:52
*/

// Import Model Classes:
import { Domain } 			from './Domain';


/*
	This class represents an interval domain. An interval domain is a domain where each element
	is specified by a rule that increments a initial value until a maximum value is reached. For example, the start value of 0,
	increment value of 10, and maximum value of 100 define an interval domain that can be represented as {0,10,20,30,40,50,60,70,80,90,100}.
	Interval domains are assigned scores by the DiscreteScoreFunction.
*/

export class IntervalDomain implements Domain {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;			// The type of domain. This should always be 'interval'.
	private interval: number;		// The interval used to increment between the minimum and maximum domain values.
	private min: number;			// The minimum domain value.
	private max: number;			// The maximum domain value.
	private elements: string[];		// The collection of elements defined by the min, max, and interval values. Note that these must be stored 
									// as strings to work with the DiscreteScoreFunction. 

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(min: number, max: number, interval: number) {
		this.type = "interval";
		this.interval = interval;
		this.min = min;
		this.max = max;
		this.calculateElements();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	getInterval(): number {
		return this.interval;
	}

	getRange(): number[] {
		return [this.min, this.max];
	}

	getMinValue(): number {
		return this.min;
	}

	getMaxValue(): number {
		return this.max;
	}

	getElements(): string[] {
		return this.elements;
	}

	calculateElements(): void {
		var elements: string[] = [];
		if (this.interval > 0) {
			var currentElement: number = this.min;
			while (currentElement < this.max) {
				elements.push('' + currentElement);	// Convert the element into a string.
				currentElement += this.interval;
			}
			// Convert the element into a string.
			elements.push('' + this.max);
		}
		this.elements = elements;
	}
}