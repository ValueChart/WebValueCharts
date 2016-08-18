/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 17:33:12
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 12:21:06
*/

import { Objective } 			from './Objective';
import { PrimitiveObjective }	from './PrimitiveObjective';
import { Domain } 				from './Domain';

import { Memento }				from './Memento';


export class AbstractObjective implements Objective {

	public objectiveType: string;
	private name: string;
	private id: string;
	private description: string;
	private subObjectives: Objective[];

	constructor(name: string, description: string, id?: string) {
		this.name = name;
		this.description = description;
		this.objectiveType = 'abstract';
		this.subObjectives = [];
		this.id = id;

		if (id === undefined)
			this.id = name;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
	}

	getId(): string {
		return this.id;
	}

	setId(id: string) {
		this.id = id;
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
		var subObjectives: Objective[] = [];
		this.subObjectives.forEach((objective: Objective) => {
			subObjectives.push(objective);
			if (objective.objectiveType === 'abstract') {
				Array.prototype.push.apply(subObjectives, (<AbstractObjective>objective).getAllSubObjectives());
			}
		});
		return subObjectives;
	}

	getAllPrimitiveSubObjectives(): PrimitiveObjective[] {
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

		return <PrimitiveObjective[]>subObjectives;
	}

	getMemento(): Memento {
		// Create a new AbstractObjective object.
		var abstractObjectiveCopy: AbstractObjective = new AbstractObjective(this.name, this.description, this.id);
		// Copy over all the properties from the AbstractObjective that is being copied. Note that this does NOT create a new domain Objective, it merely preservers the reference.
		Object.assign(abstractObjectiveCopy, this);
		var subObjectives: Objective[] = []

		// Create copies of each of the child objectives.
		for (var i = 0; i < this.subObjectives.length; i++) {
			subObjectives[i] = <Objective>this.subObjectives[i].getMemento();
		}

		abstractObjectiveCopy.setDirectSubObjectives(subObjectives);

		return abstractObjectiveCopy
	}
}