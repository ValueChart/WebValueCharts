/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-05 15:28:39
*/

import { ScoreFunction } 			from './ScoreFunction';


export class ScoreFunctionMap {
	
	private scoreFunctions: Map<string, ScoreFunction>;

	constructor() {
		this.scoreFunctions = new Map<string, ScoreFunction>();
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