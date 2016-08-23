/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 21:03:58
*/

// Import Model Classes:
import { Domain } from './Domain'

/*
	This class represents a categorical domain. A categorical domain is a domain where each element
	is separately specified (ex. Categorical domain Animals = {Snake, Horse, Dog}). This class is a wrapper around
	an array of strings used to store domain elements. The wrapper provides useful functionality for determine domain type,
	whether the domain is ordered, and adding/removing elements in a controlled way. Categorical domains are assigned scores
	by the DiscreteScoreFunction.
*/

export class CategoricalDomain implements Domain {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;				// The type of the domain. This should always be 'categorical'.
	public ordered: boolean;			// Whether the domain is ordered. For example: {best, middle, worst} would be an ordered categorical domain.
	private elements: string[];			// The array of domain elements.

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	constructor(ordered: boolean) {
		this.type = "categorical";
		this.ordered = ordered;
		this.elements = [];
	}

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	addElement(element: string): void {
		var elementIndex: number = this.elements.indexOf(element);
		// Prevent adding duplicate elements to the domain.
		if (elementIndex == -1) {
			this.elements.push(element);
		}
	}

	removeElement(element: string): void {
		var elementIndex: number = this.elements.indexOf(element);
		if (elementIndex !== -1) {
			this.elements.splice(elementIndex, 1);
		}
	}

	getElements(): string[] {
		return this.elements;
	}
}