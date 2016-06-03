/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 17:33:12
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 11:16:21
*/

import { Objective } 	from './Objective';
import { Domain } 		from './Domain';


export class AbstractObjective implements Objective {

	public objectiveType: string;
	private name: string;
	private description: string;
	private subObjectives: Objective[];

	constructor(name: string, description: string) {
		this.name = name;
		this.description = description;
		this.objectiveType = 'abstract';
		this.subObjectives = [];
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
	}

	getDescription(): string {
		return this.description;
	}

	setDescription(description: string): void {
		this.description = description;
	}

	setDirectSubObjectives(objectives: Objective[]): void {
		this.subObjectives = objectives;
	}

	addSubObjective(objective: Objective): void {
		this.subObjectives.push(objective);
	}

	removeSubObjective(objective: Objective): void {
		var objectiveIndex: number = this.subObjectives.indexOf(objective);
		if (objectiveIndex !== -1) {
			this.subObjectives.splice(objectiveIndex, 1);
		}
	}

	getDirectSubObjectives(): Objective[] {
		return this.subObjectives;
	}

	getAllSubObjectives(): Objective[] {
		var subObjectives: Objective[]  = [];
		this.subObjectives.forEach((objective: Objective) => {
			subObjectives.push(objective);
			if (objective.objectiveType === 'abstract') {
				Array.prototype.push.apply(subObjectives, (<AbstractObjective> objective).getAllSubObjectives());
			}
		});
		return subObjectives;
	}

	getAllPrimitiveSubObjectives(): Objective[] {
		var subObjectives: Objective[] = [];
		this.subObjectives.forEach((objective: Objective) => {
			subObjectives.push(objective);
			if (objective.objectiveType === 'abstract') {
				Array.prototype.push.apply(subObjectives, (<AbstractObjective>objective).getAllSubObjectives());
			}
		});

		subObjectives = subObjectives.filter((objective: Objective) => {
			return objective.objectiveType === 'primitive';
		});

		return subObjectives;
	}
}