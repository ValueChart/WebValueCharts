/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 09:32:09
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 16:31:59
*/

import { ValueChart }			from './ValueChart';
import { Objective } 			from './Objective';
import { Alternative }			from './Alternative';
import { User } 				from './User';
import { WeightMap } 			from './WeightMap';
import { PrimitiveObjective }	from './PrimitiveObjective';


export class GroupValueChart extends ValueChart {

	private users: User[];
	private averageUser: User;


	constructor(name: string, description: string, creator: string) {
		super(name, description, creator);
		this.users = [];
	}

	getUsers(): User[] {
		return this.users;
	}

	setUsers(users: User[]): void {
		this.users = users;
	}

	addUser(user: User): void {
		if (this.users.indexOf(user) === -1) {
			this.users.push(user);
		}
	}

	removeUser(user: User): void {
		var index: number = this.users.indexOf(user);
		if (index !== -1) {
			this.users.splice(index, 1);
		}
	}

	getAverageUser(): User {
		if (!this.averageUser) {
			this.calculateAverageUser();
		}
		return this.averageUser;
	}

	calculateAverageUser(): void {
		// TODO: fully implement this method. How do we implement average score functions?
		this.averageUser = new User("AverageUser");
		this.averageUser.setWeightMap(this.calculateAverageWeightMap()); 
	}

	calculateAverageWeightMap(): WeightMap {
		var primitiveObjectives: PrimitiveObjective[] = this.getAllPrimitiveObjectives();
		var combinedWeights: number[] = Array(primitiveObjectives.length).fill(0);
		var averageWeightMap = new WeightMap();

		this.users.forEach((user: User) => {
			var normalizedUserWeights = user.getWeightMap().getNormalizedWeights(primitiveObjectives);
			for (var i = 0; i < normalizedUserWeights.length; i++) {
				combinedWeights[i] += normalizedUserWeights[i];
			}
		});

		for (var i = 0; i < primitiveObjectives.length; i++) {
			var averageWeight = combinedWeights[i] / this.users.length;
			averageWeightMap.setObjectiveWeight(primitiveObjectives[i], averageWeight);
		}
		return averageWeightMap;
	}


}