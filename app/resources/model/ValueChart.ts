/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-21 15:28:47
*/
	
import * as Formatter															from '../utilities/Formatter';

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

	private id: string;
	private name: string;
	private description: string;
	private creator: string;
	private rootObjectives: Objective[];
	private alternatives: Alternative[];
	private users: User[];

	public _id: string;
	public password: string;

	constructor(name: string, description: string, creator: string, users?: User[]) {
		this.name = name;
		this.description = description;
		this.creator = creator;
		this.rootObjectives = [];
		this.alternatives = [];
		this.users = [];
		this.id = Formatter.nameToID(this.name);

		if (users) {
			this.users = users;
		}
	}

	getId(): string {
		return this.id;
	}

	setId(id: string) {
		this.id = id;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
		this.id = Formatter.nameToID(this.name);
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
				primitiveObjectives.push(<PrimitiveObjective>this.rootObjectives[i]);
			}
		}
		return primitiveObjectives;
	}

	getAllPrimitiveObjectivesByName(): string[] {
		var primObj: string[] = [];
		for (var obj of this.getAllPrimitiveObjectives()) {
			primObj.push(obj.getName());
		}
		return primObj;
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
			let objectiveWeights = user.getWeightMap().getObjectiveWeights(primitiveObjectives);
			for (var i = 0; i < objectiveWeights.length; i++) {
				if (combinedWeights[i] < objectiveWeights[i]) {
					combinedWeights[i] = objectiveWeights[i];
				}
			}
		});

		for (var i = 0; i < primitiveObjectives.length; i++) {
			maximumWeightMap.setObjectiveWeight(primitiveObjectives[i].getName(), combinedWeights[i]);
		}

		return maximumWeightMap;
	}

	getAverageValueChart(): ValueChart {
		var averageValueChart: ValueChart = new ValueChart(this.name + ' Average', this.description, this.creator, [this.getAverageUser()]);
		averageValueChart.setRootObjectives(this.rootObjectives);
		averageValueChart.setAlternatives(this.alternatives);
		return averageValueChart;
	}

	getAverageUser(): User {
		var averageUser: User = new User('Average User');

		if (this.users.length === 1) {
			averageUser = new User("AverageUser");
			averageUser.setWeightMap(this.users[0].getWeightMap());
			averageUser.setScoreFunctionMap(this.users[0].getScoreFunctionMap());
			return;
		}

		averageUser = new User("AverageUser");
		averageUser.setWeightMap(this.calculateAverageWeightMap());
		averageUser.setScoreFunctionMap(this.calculateAverageScoreFunctionMap());

		return averageUser;
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

		primitiveObjectives.forEach((objective: PrimitiveObjective) => {
			let scoreFunctions: ScoreFunction[] = [];
			this.users.forEach((user: User) => {
				let scoreFunction: ScoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(objective.getName());
				scoreFunctions.push(scoreFunction);
			});
			let averageScoreFunction = this.calculateAverageScoreFunction(scoreFunctions, objective);
			averageScoreFunctionMap.setObjectiveScoreFunction(objective.getName(), averageScoreFunction);
		});

		return averageScoreFunctionMap;
	}

	calculateAverageScoreFunction(scoreFunctions: ScoreFunction[], objective: PrimitiveObjective): ScoreFunction {
		var averageScoreFunction: ScoreFunction;
		if (objective.getDomainType() === 'continuous') {
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






