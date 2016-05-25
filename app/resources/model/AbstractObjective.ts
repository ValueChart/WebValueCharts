/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 17:33:12
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 17:47:44
*/

import { Objective } from './Objective';
import { Domain } from './Domain';


export class AbstractObjective implements Objective {

	public objectiveType: string;
	private name: string;
	private description: string;
	private subObjectives: Objective[];

	constructor(name: string, description: string) {
		this.name = name;
		this.description = description;
		this.objectiveType = 'abstract';
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
		var subObjectives = [];
		this.subObjectives.forEach((objective: Objective) => {
			subObjectives.push(objective);
			if (objective.objectiveType === 'abstract') {
				Array.prototype.push.apply(subObjectives, getAllSubObjectives(objective));
			}
		});
		return subObjectives;
	}
}