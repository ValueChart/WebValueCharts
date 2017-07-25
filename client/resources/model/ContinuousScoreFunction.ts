/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 20:34:07
*/


// Import Model Classes:
import { Memento }				from './Memento';
import { ScoreFunction } 		from './ScoreFunction';
import { PrimitiveObjective } 	from './PrimitiveObjective';
import { ContinuousDomain } 	from './ContinuousDomain';

// The interface that all interpolation functions must be implement.
interface InterpolationStrategy {
	(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number): number
}

/*
	This class extends ScoreFunction to implement score functions for objectives with continuous domains. These score functions take a value
	from their associated objective's domain and convert it into a score based the score assignments the user has given to specific elements.
	For instance, if a user sets a score for element x, and for element y = x + i, then the ContinuousScoreFunction can use an interpolation 
	strategy to determine scores for domain elements between x and y. Currently, only a linear interpolation strategy has been defined. 
*/

export class ContinuousScoreFunction extends ScoreFunction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;										// The type of ScoreFunction. This is always 'continuous'.
	private maxDomainValue: number;								// The maximum domain value that the ContinuousScoreFunction covers.
	private minDomainValue: number;								// The minimum domain value that the ContinuousScoreFunction covers.
	private interpolationStrategy: InterpolationStrategy;		// The interpolation strategy currently used by the score function.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@param minDomainValue - Optional. The minimum domain value this ContinuousScoreFunction covers.
		@param maxDomainValue - Optional. The maximum domain value this ContinuousScoreFunction covers.
		@returns {void}	
		@description	Constructs a new ContinuousScoreFunction. This constructor initializes the type of the ScoreFunction to be 'continuous' and 
						uses the parent constructor to initialize the Map used internally to store scores. 
	*/
	constructor(minDomainValue?: number, maxDomainValue?: number) {
		super();

		this.type = 'continuous';

		this.minDomainValue = minDomainValue;
		this.maxDomainValue = maxDomainValue;

		this.interpolationStrategy = ContinuousScoreFunction.linearInterpolation;
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param type - The type of function (for now, one of: flat, positive linear, negative linear).
		@returns {void}	
		@description	Initializes the score function to a specified default.
	*/
	initialize(type: string) {
		this.elementScoreMap.clear();
		let min: number = this.minDomainValue;
		let max: number = this.maxDomainValue;
		let increment = (max - min) / 4.0;
		// Add three evenly-spaced points between min and max
		if (type === ScoreFunction.FLAT) {
			this.setElementScore(min, 0.5);
			this.setElementScore(min + increment, 0.5);
			this.setElementScore(min + 2 * increment, 0.5);
			this.setElementScore(min + 3 * increment, 0.5);
			this.setElementScore(max, 0.5);
		}
		else if (type === ScoreFunction.POSLIN) {
			let slope = 1.0 / (max - min);
			this.setElementScore(min, 0);
			this.setElementScore(min + increment, slope * increment);
			this.setElementScore(min + 2 * increment, slope * 2 * increment);
			this.setElementScore(min + 3 * increment, slope * 3 * increment);
			this.setElementScore(max, 1);
		}
		else if (type === ScoreFunction.NEGLIN) {
			let slope = 1.0 / (max - min);
			this.setElementScore(min, 1);
			this.setElementScore(min + increment, 1.0 - slope * increment);
			this.setElementScore(min + 2 * increment, 1.0 - slope * 2 * increment);
			this.setElementScore(min + 3 * increment, 1.0 - slope * 3 * increment);
			this.setElementScore(max, 0);
		}
		else {
			throw ("Unknown initial score function type");
		}	
	}

	/*
		@param domainElement - The domain element for which the score should be set.
		@param score - The score for the given domain element.
		@returns {void}	
		@description	Sets the given domain element to have the given score. This method will update the minDomainValue, and maxDomainValue fields
						if domainElement is less than, or greater than the the current values.
	*/
	setElementScore(domainElement: number, score: number): void {
		this.elementScoreMap.set(domainElement, score);
		if (domainElement > this.maxDomainValue || this.maxDomainValue === undefined)
			this.maxDomainValue = domainElement;
		if (domainElement < this.minDomainValue || this.minDomainValue === undefined)
			this.minDomainValue = domainElement;

		this.updateBestAndWorstElements();
	}

	/*
		@returns {number} - The user assigned score for the given domain element.	
		@description	This method determines the user assigned score for the given domain element. It does this in one of two ways:
							1) The domain element has already been mapped to a score in the elementScoreMap and the score can be retrieved using the element as a key.
							2) The domain element has not been mapped to a score, so the current interpolation strategy is used to interpolate the correct score 
							for the given domain element based on the two closes scores on either side of it that have been assigned values.
	*/
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
			// into the value function it is assumed that there is a specific function defined between them. This function is the 
			// interpolation strategy currently set.
			if (iteratorElement.value > belowElement && iteratorElement.value < domainElement) {
				belowElement = <number>+iteratorElement.value;
			}
			if (iteratorElement.value < aboveElement && iteratorElement.value > domainElement) {
				aboveElement = <number>+iteratorElement.value;
			}
			iteratorElement = elementIterator.next();
		}

		var start = { element: belowElement, score: this.elementScoreMap.get(belowElement) };
		var end = { element: aboveElement, score: this.elementScoreMap.get(aboveElement) };

		return this.interpolationStrategy(start, end, domainElement);
	};

	getMinDomainValue(): number {
		return this.minDomainValue;
	}

	getMaxDomainValue(): number {
		return this.maxDomainValue;
	}

	setMinDomainValue(min: number) {
		this.minDomainValue = min;
	}

	setMaxDomainValue(max: number) {
		this.maxDomainValue = max;
	}

	setInterpolationStrategy(strategy: InterpolationStrategy): void {
		this.interpolationStrategy = strategy;
	}


	// Interpolation functions:

	static linearInterpolation(start: { element: number, score: number }, end: { element: number, score: number }, elementToInterpolate: number): number {

		var slope = (end.score - start.score) / (end.element - start.element);
		var offset = start.score - (slope * start.element);

		return (slope * elementToInterpolate) + offset;
	}


	/*
		@returns {ContinuousScoreFunction} - A ContinuousScoreFunction that is an exact copy of this ContinuousScoreFunction.
		@description	Returns a copy (AKA a memento) of the ContinuousScoreFunction. This copy is stored in a different memory location and will not be changed if the original
						object is changed. This method should be used to create copies of ContinuousScoreFunctions when user scores needs to be preserved and stored.
	*/
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



