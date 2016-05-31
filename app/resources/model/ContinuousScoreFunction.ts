/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-31 15:31:36
*/

import { ScoreFunction } 		from './ScoreFunction';


interface InterpolationStrategy {
	(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number): number
}


export class ContinuousScoreFunction implements ScoreFunction {

	public type: string;
	private maxDomainValue: number;
	private minDomainValue: number;
	private elementScoreMap: Map<number, number>;
	private interpolationStrategy: InterpolationStrategy;

	constructor(minDomainValue?: number, maxDomainValue?: number) {
		this.type = 'continuous';
		
		this.minDomainValue = minDomainValue;
		this.maxDomainValue = maxDomainValue;
		this.elementScoreMap = new Map<number, number>();
		
		this.interpolationStrategy = ContinuousScoreFunction.linearInterpolation;
	}

	
	setElementScore(domainElement: number, score: number): void {
		this.elementScoreMap.set(domainElement, score);
		if (domainElement > this.maxDomainValue)
			this.maxDomainValue = domainElement;
		else if (domainElement < this.minDomainValue)
			this.minDomainValue = domainElement;
	}

	removeElement(domainElement: number): void {
		this.elementScoreMap.delete(domainElement);
	}

	getScore(domainElement: number): number {
		var score = this.elementScoreMap.get(domainElement); 
		if (score !== undefined) {
			return score;	// The value was in the mapping of domain elements to scores.
		} 
		var aboveElement: number = this.maxDomainValue;
		var belowElement: number = this.minDomainValue;

		var elementIterator = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number> = elementIterator.next();

		while (iteratorElement.done === false) {

		// Locate the nearest elements on either side of the current element that are defined. Because these have been inserted 
		// into the value function it is assumed that there is a specific function defined between them. Is this assumption wrong?
		// I believe that this works well for Linear Functions, but maybe not for more complex functions?
			if (iteratorElement.value > belowElement && iteratorElement.value < domainElement) {
				belowElement = iteratorElement.value;
			}
			if (iteratorElement.value < aboveElement && iteratorElement.value > domainElement) {
				aboveElement = iteratorElement.value;
			}
			iteratorElement = elementIterator.next();
		}


		var start = { element: belowElement, score: this.elementScoreMap.get(belowElement) };
		var end = { element: aboveElement, score: this.elementScoreMap.get(aboveElement) };

		return this.interpolationStrategy(start, end, domainElement);
	};


	setInterpolationStrategy(strategy: InterpolationStrategy): void {
		this.interpolationStrategy = strategy;
	}


	// Interpolation functions:

	static linearInterpolation(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number): number {

		var slope = (end.score - start.score) / (end.element - start.element);
		var offset = start.score - (slope * start.element);

		return (slope * elementToInterpolate) + offset;
	}


}



