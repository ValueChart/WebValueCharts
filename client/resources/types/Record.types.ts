/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 13:24:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 14:28:39
*/

// Model Classes
import { Alternative }					from '../model/Alternative';
import { Objective }					from '../model/Objective';
import { AbstractObjective }			from '../model/AbstractObjective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { ScoreFunction }				from '../model/ScoreFunction';

import { Memento }						from '../model/Memento';

export class AlternativeOrderRecord implements Memento {

	public alternativeIndexMap: any;

	constructor(alternatives: Alternative[]) {
		this.alternativeIndexMap = {};

		alternatives.forEach((alternative: Alternative, index: number) => {
			this.alternativeIndexMap[alternative.getName()] = index;
		});
	}

	getMemento(): Memento {
		return this;
	}
}

export class ObjectivesRecord implements Memento {

	public rootObjectives: Objective[];

	constructor(rootObjectives: Objective[]) {
		this.rootObjectives = [];

		rootObjectives.forEach((objective: Objective) => {
			this.rootObjectives.push(<Objective>objective.getMemento());
		});
	}

	getMemento(): Memento {
		return new ObjectivesRecord(this.rootObjectives);
	}

}

export class ScoreFunctionRecord implements Memento {

	public objectiveName: string;
	public scoreFunction: ScoreFunction;

	constructor(objectiveName: string, scoreFunction: ScoreFunction) {
		this.objectiveName = objectiveName;
		this.scoreFunction = scoreFunction.getMemento();
	}

	getMemento(): ScoreFunctionRecord {
		return new ScoreFunctionRecord(this.objectiveName, this.scoreFunction);
	}
}
