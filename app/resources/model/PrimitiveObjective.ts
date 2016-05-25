/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 17:19:44
*/

import { Objective } from './Objective';
import { Domain } from './Domain';


export class PrimitiveObjective implements Objective {

	private name: string;
	private description: string;
	private color: string;

	private domain: Domain;

	constructor(name: string, description: string, domain: Domain) {
		this.name = name;
		this.description = description; 
		this.domain = domain;
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
}