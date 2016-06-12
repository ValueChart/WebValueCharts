/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-11 14:53:56
*/

import { ScoreFunction } 			from './ScoreFunction';


export class ScoreFunctionMap {
	
	private scoreFunctions: Map<string, ScoreFunction>;

	constructor() {
		this.scoreFunctions = new Map<string, ScoreFunction>();
	}

	getAllScoreFunctions(): ScoreFunction[] {
		var scoreFunctions: ScoreFunction[] = [];

		var scoreFunctionIterator: Iterator<ScoreFunction> = this.scoreFunctions.values();
		var iteratorElement: IteratorResult<ScoreFunction> = scoreFunctionIterator.next();

		while (iteratorElement.done === false) {

			scoreFunctions.push(iteratorElement.value);
			
			iteratorElement = scoreFunctionIterator.next();
		}

		return scoreFunctions;
	}

	getObjectiveScoreFunction(objectiveName: string): ScoreFunction {
		return this.scoreFunctions.get(objectiveName);
	}

	setObjectiveScoreFunction(objectiveName: string, ScoreFunction: ScoreFunction): void {
		this.scoreFunctions.set(objectiveName, ScoreFunction);
	}

	removeObjectiveScoreFunction(objectiveName: string): void {
		this.scoreFunctions.delete(objectiveName);
	}
}