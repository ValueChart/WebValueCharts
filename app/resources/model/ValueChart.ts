/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 11:14:07
*/

import { Objective } 				from './Objective';
import { PrimitiveObjective } 		from './PrimitiveObjective';
import { AbstractObjective } 		from './AbstractObjective';
import { Alternative }				from './Alternative';
import { User } 					from './User';



export class ValueChart {

	private name: string;
	private description: string;
	private creator: string;
	private user: User;
	private rootObjectives: Objective[];
	private alternatives: Alternative[];

	constructor(name: string, description: string, creator: string) {
		this.name = name;
		this.description = description;
		this.creator = creator;
		this.rootObjectives = [];
		this.alternatives = [];
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

	getCreator(): string {
		return this.creator;
	}

	setCreator(creator: string): void {
		this.creator = creator;
	}

	getUser(): User {
		return this.user;
	}

	setUser(user: User): void {
		this.user = user;
	}

	getRootObjectives(): Objective[] {
		return this.rootObjectives;
	}

	addRootObjective(objective: Objective): void {
		if (this.rootObjectives.indexOf(objective) === -1) {
			this.rootObjectives.push(objective);
		}
	}

	removeRootObjective(objective: Objective): void {
		var objectiveIndex: number = this.rootObjectives.indexOf(objective);
		if (objectiveIndex !== -1) {
			this.rootObjectives.splice(objectiveIndex, 1);
		}
	}

	getAllObjectives(): Objective[] {
		var objectives: Objective[] = this.rootObjectives.slice();	// Slice clones the array and returns a reference to this clone.		
		for (var i: number = 0; i < this.rootObjectives.length; i++) {
			if (this.rootObjectives[i].objectiveType === 'abstract') {
				objectives = objectives.concat((<AbstractObjective>this.rootObjectives[i]).getAllSubObjectives()); // (<AbstractObjective> objective) is the casting syntax for TypeScript
			}
		}
		return objectives;
	}

	getAllPrimitiveObjectives(): PrimitiveObjective[] {
		var primitiveObjectives: PrimitiveObjective[] = [];
		var objectives: Objective[];

		for (var i: number = 0; i < this.rootObjectives.length; i++) {
			if (this.rootObjectives[i].objectiveType === 'abstract') {
				// (<AbstractObjective> objective) is the casting syntax for TypeScript
				objectives = (<AbstractObjective>this.rootObjectives[i]).getAllSubObjectives();

				objectives = objectives.filter((value: Objective) => {
					return value.objectiveType === 'primitive';
				});

				primitiveObjectives = primitiveObjectives.concat(<PrimitiveObjective[]>objectives);
			
			} else {
				primitiveObjectives.push(<PrimitiveObjective> this.rootObjectives[i]);
			}
		}
		return primitiveObjectives;
	}

	getAlternatives(): Alternative[] {
		return this.alternatives;
	}

	addAlternative(alernative: Alternative): void {
		if (this.alternatives.indexOf(alernative) === -1) {
			this.alternatives.push(alernative);
		}
	}

	removeAlternative(alernative: Alternative): void {
		var alternativeIndex: number = this.alternatives.indexOf(alernative);
		if (alternativeIndex !== -1) {
			this.alternatives.splice(alternativeIndex, 1);
		}
	}
}