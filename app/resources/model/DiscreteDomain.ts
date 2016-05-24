/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 14:24:15
*/


import { Domain } from './Domain'

export class DiscreteDomain implements Domain {

	public type: string;
	private ordered: boolean;
	private elements: string[];

	constructor(ordered: boolean) {	
		this.type = "discrete"; 
		this.ordered = ordered;
		this.elements = [];
	}

	getOrdered(): boolean {
		return this.ordered;
	}

	setOrdered(ordered: boolean): void {
		this.ordered = ordered;
	}

	// Should not allow you to add duplicate elements to the domain.
	addElement(element: string): void {
		var elementIndex: number = this.elements.indexOf(element);
		if (elementIndex  == -1) {
			this.elements.push(element);
		}
	}

	removeElement(element: string): void {
		var elementIndex: number = this.elements.indexOf(element);
		if (elementIndex  !== -1) {
			this.elements.splice(elementIndex, 1);
		}
	}

	getElements(): string[] {
		return this.elements;
	}
}