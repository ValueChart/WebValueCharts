/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-22 10:11:49
*/

import { Memento }				from './Memento';
import { ScoreFunction } 		from './ScoreFunction';


interface InterpolationStrategy {
	(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number): number
}


export class ContinuousScoreFunction extends ScoreFunction {

	public type: string;
	private maxDomainValue: number;
	private minDomainValue: number;
	private interpolationStrategy: InterpolationStrategy;

	constructor(minDomainValue?: number, maxDomainValue?: number) {
		super();

		this.type = 'continuous';
		
		this.minDomainValue = minDomainValue;
		this.maxDomainValue = maxDomainValue;

		this.interpolationStrategy = ContinuousScoreFunction.linearInterpolation;
	}
	
	setElementScore(domainElement: number, score: number): void {
		this.elementScoreMap.set(domainElement, score);
		if (domainElement > this.maxDomainValue || this.maxDomainValue === undefined)
			this.maxDomainValue = domainElement;
		if (domainElement < this.minDomainValue || this.minDomainValue === undefined)
			this.minDomainValue = domainElement;
	}

	getScore(domainElement: number): number {
		var score = this.elementScoreMap.get(domainElement); 

		if (score !== undefined) {
			return score;	// The value was in the mapping of domain elements to scores.
		} 
		var aboveElement: number = this.maxDomainValue;
		var belowElement: number = this.minDomainValue;

		var elementIterator: Iterator<number | string> = this.elementScoreMap.keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();

		while (iteratorElement.done === false) {

		// Locate the nearest elements on either side of the current element that are defined. Because these have been inserted 
		// into the value function it is assumed that there is a specific function defined between them. Is this assumption wrong?
		// I believe that this works well for Linear Functions, but maybe not for more complex functions?
			if (iteratorElement.value > belowElement && iteratorElement.value < domainElement) {
				belowElement = <number> +iteratorElement.value;
			}
			if (iteratorElement.value < aboveElement && iteratorElement.value > domainElement) {
				aboveElement = <number> +iteratorElement.value;
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

	getMemento(): ContinuousScoreFunction {
		var scoreFunctionCopy: ContinuousScoreFunction;

		// Create a new ScoreFunction object
		scoreFunctionCopy = new ContinuousScoreFunction();
		// Copy over the properties from the ScoreFunction that is being saved.
		Object.assign(scoreFunctionCopy, this);

		// Create a new internal map object.
		var internalMapCopy = new Map<number, number>();

		// Copy the internal map values we want to save to the new internal map.
		this.getElementScoreMap().forEach((value: number, key: number) => {
			internalMapCopy.set(key, value);
		});

		// Set the internal map to be the copy we just made. This is important, as otherwise the internal map in the new ScoreFunction will be
		// a reference to the internal map in the in-use ScoreFunction. This means that any further changes could overwrite our saved copy.
		scoreFunctionCopy.setElementScoreMap(internalMapCopy);

		return scoreFunctionCopy;
	}


}



