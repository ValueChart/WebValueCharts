/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 13:24:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-19 11:41:23
*/

// Import Libraries:
import * as _ 							from 'lodash';

// Import Model Classes:
import { Alternative }					from '../model';
import { Objective }					from '../model';
import { AbstractObjective }			from '../model';
import { PrimitiveObjective }			from '../model';
import { ScoreFunction }				from '../model';

import { Memento }						from '../model';

export class AlternativesRecord implements Memento {

	public alternatives: Alternative[];

	constructor(alternatives: Alternative[]) {
		this.alternatives = _.cloneDeep(alternatives);
	}

	getMemento(): Memento {
		return new AlternativesRecord(this.alternatives);
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

	public objectiveId: string;
	public scoreFunction: ScoreFunction;

	constructor(objectiveId: string, scoreFunction: ScoreFunction) {
		this.objectiveId = objectiveId;
		this.scoreFunction = scoreFunction.getMemento();
	}

	getMemento(): ScoreFunctionRecord {
		return new ScoreFunctionRecord(this.objectiveId, this.scoreFunction);
	}
}
