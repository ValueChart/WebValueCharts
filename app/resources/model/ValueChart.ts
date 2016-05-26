/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 16:53:28
*/

import { Objective } 		from './Objective';
import { Alternative }		from './Alternative';
import { User } 			from './User';



export class ValueChart {
	private name: string;
	private description: string;
	private creator: string;
	private user: User;
	private objectives: Objective[];
	private alternatives: Alternative[];

	constructor(name: string, description: string, creator: string) {
		this.name = name;
		this.description = description;
		this.creator = creator;
		this.objectives = [];
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

	getObjectives(): Objective[] {
		return this.objectives;
	}

	addObjective(objective: Objective): void {
		if (this.objectives.indexOf(objective) === -1) {
			this.objectives.push(objective);
		}
	}

	removeObjective(objective: Objective): void {
		var objectiveIndex: number = this.objectives.indexOf(objective);
		if (objectiveIndex !== -1) {
			this.objectives.splice(objectiveIndex, 1);
		}
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