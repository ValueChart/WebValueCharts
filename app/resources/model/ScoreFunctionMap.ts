/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-01 14:07:31
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

	getAllKeyScoreFunctionPairs(): { key: string, scoreFunction: ScoreFunction }[] {
		var scoreFunctionKeyPairs: { key: string, scoreFunction: ScoreFunction }[] = [];

		var scoreFunctionIterator: Iterator<string> = this.scoreFunctions.keys();
		var iteratorElement: IteratorResult<string> = scoreFunctionIterator.next();

		while (iteratorElement.done === false) {
			scoreFunctionKeyPairs.push({ key: iteratorElement.value, scoreFunction: this.scoreFunctions.get(iteratorElement.value) });
			iteratorElement = scoreFunctionIterator.next();
		}

		return scoreFunctionKeyPairs;
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