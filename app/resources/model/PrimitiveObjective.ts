/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 14:15:50
*/

import { Objective } 	from './Objective';
import { Domain } 		from './Domain';

import { Memento }				from './Memento';


export class PrimitiveObjective implements Objective {

	public objectiveType: string;
	private name: string;
	private description: string;
	private color: string;
	private domain: Domain;

	constructor(name: string, description: string) {
		this.name = name;
		this.description = description; 
		this.objectiveType = 'primitive';
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

	getColor(): string {
		return this.color;
	}

	setColor(color: string):void {
		this.color = color;
	}

	getDomainType(): string {
		return this.domain.type;
	}

	getDomain(): Domain {
		return this.domain;
	}

	setDomain(domain: Domain):void {
		this.domain = domain;
	}

	getMemento(): Memento {
		// Create a new PrimitiveObjective object.
		var primitiveObjectiveCopy: PrimitiveObjective = new PrimitiveObjective(this.name, this.description);
		// Copy over all the properties from the PrimitiveObjective that is being copied. Note that this does NOT create a new domain Objective, it merely preservers the reference.
		Object.assign(primitiveObjectiveCopy, this);

		return primitiveObjectiveCopy;
	}
}