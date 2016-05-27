/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 10:20:53
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 16:10:40
*/

import { ScoreFunction } 			from './ScoreFunction';
import { PrimitiveObjective } 		from './PrimitiveObjective';


export class ScoreFunctionMap {
	
	private scoreFunctions: Map<PrimitiveObjective, ScoreFunction>;

	constructor() {
		this.scoreFunctions = new Map<PrimitiveObjective, ScoreFunction>();
	}

	getObjectiveScoreFunction(objective: PrimitiveObjective): ScoreFunction {
		return this.scoreFunctions.get(objective);
	}

	setObjectiveScoreFunction(objective: PrimitiveObjective, ScoreFunction: ScoreFunction): void {
		this.scoreFunctions.set(objective, ScoreFunction);
	}

	removeObjectiveScoreFunction(objective: PrimitiveObjective): void {
		this.scoreFunctions.delete(objective);
	}
}