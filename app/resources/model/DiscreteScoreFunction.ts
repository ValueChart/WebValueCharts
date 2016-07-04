/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-22 10:12:34
*/

import { Memento }				from './Memento';
import { ScoreFunction } 		from './ScoreFunction';



export class DiscreteScoreFunction extends ScoreFunction {

	public type: string;

	constructor() {
		super();
		this.elementScoreMap = new Map<string, number>();
		this.type = 'discrete';
	}

	getScore(domainElement: string): number {
		return this.elementScoreMap.get(domainElement);
	}

	setElementScore(domainElement: string, score: number): void {
		this.elementScoreMap.set(domainElement, score);
	}


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