/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-08 12:57:06
*/


import { Domain } from './Domain'

export class CategoricalDomain implements Domain {

	public type: string;
	public ordered: boolean;
	private elements: string[];

	constructor(ordered: boolean) {
		this.type = "categorical";
		this.ordered = ordered;
		this.elements = [];
	}

	// Should not allow you to add duplicate elements to the domain.
	addElement(element: string): void {
		var elementIndex: number = this.elements.indexOf(element);
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