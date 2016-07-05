/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-05 12:36:05
*/

import { Objective } 															from './Objective';
import { PrimitiveObjective } 													from './PrimitiveObjective';
import { AbstractObjective } 													from './AbstractObjective';
import { Alternative }															from './Alternative';
import { User }																	from './User';
import { WeightMap }															from './WeightMap';
import { ScoreFunctionMap }														from './ScoreFunctionMap';
import { ScoreFunction }														from './ScoreFunction';
import { ContinuousScoreFunction }												from './ContinuousScoreFunction';
import { DiscreteScoreFunction }												from './DiscreteScoreFunction';


export class ValueChart {

	public type: string;
	private name: string;
	private description: string;
	private creator: string;
	private rootObjectives: Objective[];
	private alternatives: Alternative[];
	protected users: User[];
	private averageUser: User;

	constructor(name: string, description: string, creator: string, users?: User[]) {
		this.name = name;
		this.description = description;
		this.creator = creator;
		this.rootObjectives = [];
		this.alternatives = [];
		this.users = [];

		if (users) {
			this.users = users;
		}
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

	isIndividual(): boolean {
		return this.users.length === 1;
	}

	// Objective Related Methods:

	getRootObjectives(): Objective[] {
		return this.rootObjectives;
	}

	setRootObjectives(objectives: Objective[]): void {
		this.rootObjectives = objectives;
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

	// Alternative Related Methods:

	getAlternatives(): Alternative[] {
		return this.alternatives;
	}

	setAlternatives(alternatives: Alternative[]): void {
		this.alternatives = alternatives;
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

	getAlternativeValuesforObjective(objective: PrimitiveObjective): { value: (string | number), alternative: Alternative }[] {
		var alternativeValues: { value: (string | number), alternative: Alternative }[] = [];

		this.alternatives.forEach((alternative: Alternative) => {
			alternativeValues.push({ value: alternative.getObjectiveValue(objective.getName()), alternative: alternative });
		});

		return alternativeValues;
	}

	// User Relation Methods:

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

	getMaximumWeightMap(): WeightMap {
		if (this.users.length === 1)
			return this.users[0].getWeightMap();

		var primitiveObjectives: PrimitiveObjective[] = this.getAllPrimitiveObjectives();
		var combinedWeights: number[] = Array(primitiveObjectives.length).fill(0);
		var maximumWeightMap = new WeightMap();

		this.users.forEach((user: User) => {
			let normalizedUserWeights = user.getWeightMap().getObjectiveWeights(primitiveObjectives);
			for (var i = 0; i < normalizedUserWeights.length; i++) {
				if (combinedWeights[i] < normalizedUserWeights[i]) {
					combinedWeights[i] = normalizedUserWeights[i];
				}
			}
		});

		for (var i = 0; i < primitiveObjectives.length; i++) {
			maximumWeightMap.setObjectiveWeight(primitiveObjectives[i].getName(), combinedWeights[i]);
		}
		
		return maximumWeightMap;
	}

	getAverageUser(): User {
		this.calculateAverageUser();
		return this.averageUser;
	}

	calculateAverageUser(): void {
		if (this.users.length === 1) {
			this.averageUser = new User("AverageUser");
			this.averageUser.setWeightMap(this.users[0].getWeightMap());
			this.averageUser.setScoreFunctionMap(this.users[0].getScoreFunctionMap());
			return;
		}

		this.averageUser = new User("AverageUser");
		this.averageUser.setWeightMap(this.calculateAverageWeightMap()); 
		this.averageUser.setScoreFunctionMap(this.calculateAverageScoreFunctionMap());
	}

	calculateAverageWeightMap(): WeightMap {
		var primitiveObjectives: PrimitiveObjective[] = this.getAllPrimitiveObjectives();
		var combinedWeights: number[] = Array(primitiveObjectives.length).fill(0);
		var averageWeightMap = new WeightMap();

		this.users.forEach((user: User) => {
			let normalizedUserWeights = user.getWeightMap().getObjectiveWeights(primitiveObjectives);
			for (var i = 0; i < normalizedUserWeights.length; i++) {
				combinedWeights[i] += normalizedUserWeights[i];
			}
		});

		for (var i = 0; i < primitiveObjectives.length; i++) {
			let averageWeight = combinedWeights[i] / this.users.length;
			averageWeightMap.setObjectiveWeight(primitiveObjectives[i].getName(), averageWeight);
		}
		return averageWeightMap;
	}

	calculateAverageScoreFunctionMap(): ScoreFunctionMap {
		var averageScoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
		var primitiveObjectives: PrimitiveObjective[] = this.getAllPrimitiveObjectives();

		primitiveObjectives.forEach((objective: Objective) => {
			let scoreFunctions: ScoreFunction[] = [];
			this.users.forEach((user: User) => {
				let scoreFunction: ScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				scoreFunctions.push(scoreFunction);
			});
			let averageScoreFunction = this.getAverageScoreFunction(scoreFunctions, objective);
			averageScoreFunctionMap.setObjectiveScoreFunction(objective.getName(), averageScoreFunction);
		});

		return averageScoreFunctionMap;
	}

	getAverageScoreFunction(scoreFunctions: ScoreFunction[], objective: Objective): ScoreFunction {
		var averageScoreFunction: ScoreFunction;
		if (objective.objectiveType === 'continuous') {
			averageScoreFunction = new ContinuousScoreFunction();
		} else {
			averageScoreFunction = new DiscreteScoreFunction();
		}
		
		var elements: (string | number)[] = scoreFunctions[0].getAllElements();

		elements.forEach((element: string | number) => {
			let scoreTotal: number = 0;

			scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
				scoreTotal += scoreFunction.getScore(element);
			});

			averageScoreFunction.setElementScore(element, (scoreTotal / scoreFunctions.length));
		});

		return averageScoreFunction;
	}

}






