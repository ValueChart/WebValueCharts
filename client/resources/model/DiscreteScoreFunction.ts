/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 20:34:24
*/

import { Memento }				from './Memento';
import { ScoreFunction } 		from './ScoreFunction';
import { PrimitiveObjective } 	from './PrimitiveObjective';
import { CategoricalDomain } 	from './CategoricalDomain';
import { IntervalDomain } 		from './IntervalDomain';


/*
	This class extends ScoreFunction to implement score functions for objectives with discrete (interval and categorical) domains.
	The class is wrapper around a Map object that is used to map user scores to specific domain elements.
*/

export class DiscreteScoreFunction extends ScoreFunction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public type: string;	// The type of the ScoreFunction. Should always be 'discrete'.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() {
		super();
		this.type = 'discrete';
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param obj - The Primitive Objective for which to initialize the score function.
		@param type - The type of function (for now, one of: flat, positive linear, negative linear).
		@returns {void}	
		@description	Initializes the score function to a specified default for some objective.
	*/
	initialize(obj: PrimitiveObjective, type: string) {
		this.elementScoreMap.clear();
		let dom = (<CategoricalDomain | IntervalDomain>obj.getDomain()).getElements();
		if (type === ScoreFunction.FLAT) {
			for (let item of dom) {
				this.setElementScore(item, 0.5);
			}
		}
		else if (type === ScoreFunction.POSLIN) {
			let increment = 1.0 / (dom.length - 1);
			let currentScore = 0;
			for (let item of dom) {
				this.setElementScore(item, currentScore);
				currentScore += increment;
			}
		}
		else if (type === ScoreFunction.NEGLIN) {
			let increment = 1.0 / (dom.length - 1);
			let currentScore = 1;
			for (let item of dom) {
				this.setElementScore(item, currentScore);
				currentScore -= increment;
			}
		}
		else {
			throw ("Unknown initial score function type");
		}	
	}

	getScore(domainElement: string): number {
		return this.elementScoreMap.get(domainElement);
	}

	setElementScore(domainElement: string, score: number): void {
		this.elementScoreMap.set(domainElement, score);
		this.updateBestAndWorstElements(domainElement, score);
	}


	/*
		@returns {DiscreteScoreFunction} - A DiscreteScoreFunction that is an exact copy of this DiscreteScoreFunction.
		@description	Returns a copy (AKA a memento) of the DiscreteScoreFunction. This copy is stored in a different memory location and will not be changed if the original
						object is changed. This method should be used to create copies of DiscreteScoreFunctions when user scores needs to be preserved and stored.
	*/
	getMemento(): DiscreteScoreFunction {
		var scoreFunctionCopy: DiscreteScoreFunction;

		scoreFunctionCopy = new DiscreteScoreFunction();

		// Copy over the properties from the ScoreFunction that is being saved.
		Object.assign(scoreFunctionCopy, this);

		// Create a new internal map object.
		var internalMapCopy = new Map<string, number>();

		// Copy the internal map values we want to save to the new internal map.
		this.getElementScoreMap().forEach((value: number, key: string) => {
			internalMapCopy.set(key, value);
		});

		// Set the internal map to be the copy we just made. This is important, as otherwise the internal map in the new ScoreFunction will be
		// a reference to the internal map in the in-use ScoreFunction. This means that any further changes could overwrite our saved copy.
		scoreFunctionCopy.setElementScoreMap(internalMapCopy);

		return scoreFunctionCopy;
	}
}