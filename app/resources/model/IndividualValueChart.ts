/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 11:36:56
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 11:33:09
*/

import { ValueChart } 				from './ValueChart';
import { User }						from './User';
import { Objective } 				from './Objective';
import { PrimitiveObjective } 		from './PrimitiveObjective';
import { AbstractObjective } 		from './AbstractObjective';
import { Alternative }				from './Alternative';


export class IndividualValueChart extends ValueChart {

	user: User;

	constructor(name: string, description: string, creator: string) {
		super(name, description, creator);
		this.type = 'individual';
	}

	getUser(): User {
		return this.user;
	}

	setUser(user: User): void {
		this.user = user;
	}

}