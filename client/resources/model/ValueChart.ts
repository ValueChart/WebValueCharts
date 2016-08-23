/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:19:56
*/
	
// Import Model Classes:
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

// Import Utility Classes:
import * as Formatter															from '../modules/utilities/classes/Formatter';


/*
	This class is the representation of a ValueChart's internal data. It uses the Alternative class to represent the 
	decision options in a ValueChart, a hierarchical structure of of Objectives to represent criteria for the
	decision, and an array of Users to represent user preferences. A ValueChart with one user
	is referred to as a "individual" ValueChart, while a ValueChart with multiple users is referred to as a 
	"group" ValueChart. These ValueCharts sub-types are rendered differently by the ValueChartDirective, 
	but data-wise differ only in the number of users.
*/


export class ValueChart {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private name: string;					// The name of the ValueChart.
	private id: string;						// The name of the ValueChart formatted for use as a HTML id.
	private description: string;			// The description of the ValueChart.
	private creator: string;				// The username of the creator of the ValueChart.
	private rootObjectives: Objective[];	// The collection of root objectives for the ValueChart. This should almost always be a single abstract objective.
	private alternatives: Alternative[];	// The collection of alternatives for the ValueChart
	private users: User[];					// The collection of users in this ValueChart. One user means the ValueChart is an "individual" chart. More than ones means it is a "group" chart.

	public _id: string;						// The id of the ValueChart in the database. This field should ONLY be set if the ValueChart has been added to the database. 
	public password: string;				// The password to access this ValueChart.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@param name - The name of the ValueChart.
		@param description - The description of the ValueChart.
		@param creator - The username of the user who created the ValueChart.
		@param users - The collections of users in the ValueChart.
		@returns {void}	
		@description	Constructs a new ValueChart. This constructor only initializes the basic fields of the ValueChart.
						Alternatives, objectives, and possibly users must be set manually before the ValueChart is complete,
						and can be used. 
	*/
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

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// Note that methods that are simple getters/setters, or modifiers are not commented as they are self-explanatory.

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


	/*
		@returns {Objective[]} - An array of all objectives in the ValueChart. This array is NOT ordered.	
		@description	Parses the ValueChart's hierarchical objective structure to find every objective (both primitive and abstract).
	*/
	getAllObjectives(): Objective[] {
		var objectives: Objective[] = this.rootObjectives.slice();	// Slice clones the array and returns a reference to this clone.		
		for (var i: number = 0; i < this.rootObjectives.length; i++) {
			if (this.rootObjectives[i].objectiveType === 'abstract') {
				objectives = objectives.concat((<AbstractObjective>this.rootObjectives[i]).getAllSubObjectives()); // (<AbstractObjective> objective) is the casting syntax for TypeScript
			}
		}
		return objectives;
	}

	/*
		@returns {Objective[]} - An array of all primitive objectives in the ValueChart. This array is NOT ordered.	
		@description	Parses the ValueChart's hierarchical objective structure to find every primitive objective.
	*/
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

	/*
		@returns {string[]} - An array of the names of all primitive objectives in the ValueChart. This array is NOT ordered.	
		@description	Parses the ValueChart's hierarchical objective structure to find every primitive objective's name.
						This method is used surprisingly useful considering WeightMaps, ScoreFunctionMaps, and alternatives use
						objective names as keys.
	*/
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

	/*
		@returns {(string | number, alternative)[]} - An array of the given objective's domains values that are the consequences of Alternatives paired with the alternative.
		@description	Iterates over the ValueChart's collection of alternatives to retrieve the array of all alternative consequences for a
						give objective. The alternative is paired with its consequence in the array so that the connection between
						domain value and alternative is not lost.
	*/
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

	/*
		@returns {WeightMap} - A WeightMap where each objective weight is the maximum weight assigned to that objective by any user in chart.
		@description	Iterates over the ValueChart's collection of users to determine the maximum weight assigned to each primitive objective
						by any user. These maximum weights are then inserted into a new WeightMap, the so called maximum WeightMap. If there is only
						one user the in ValueChart, that user's weight map is simply returned. The maximum weight map is to determine label heights
						by the LabelRenderer, and row heights by the objective chart renderer.
	*/
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

	/*
		@returns {ValueChart} - A ValueChart with one user, whose ScoreFunctions and WeightMap are averages of the users in the current ValueChart. 
		@description	Computes the average user of the current ValueChart by averaging their weights and scores separately. The name of the average 
						ValueChart is the name of the current ValueChart, but with ' Average' added to it. This method is most often used to determine the 
						average of a group ValueChart for rendering by the ValueChartDirective.
	*/
	getAverageValueChart(): ValueChart {
		var averageValueChart: ValueChart = new ValueChart(this.name + ' Average', this.description, this.creator, [this.getAverageUser()]);
		averageValueChart.setRootObjectives(this.rootObjectives);
		averageValueChart.setAlternatives(this.alternatives);
		return averageValueChart;
	}

	/*
		@returns {User} - A user whose ScoreFunctions and WeightMap are averages of the users in the current ValueChart. 
		@description	Computes the average user of the current ValueChart by averaging their weights and scores separately. The name of the average 
						user is 'AverageUser'. This method is most often used to determine the average of a user for averaging a group ValueChart.
	*/
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

	/*
		@returns {WeightMap} - A WeightMap that is an average of the WeightMaps of the users in the current ValueChart. 
		@description	Computes the average weight of each objective in the ValueChart by iterating over each user's WeightMap.
	*/
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

	/*
		@returns {ScoreFunctionMap} - A ScoreFunctionMap whose ScoreFunctions are averages of the ScoreFunctions of the users in the current ValueChart. 
		@description	Computes the average ScoreFunction for each objective in the ValueChart by iterating over each user's ScoreFunction for that objective.
						These ScoreFunctions are then assigned to a new ScoreFuntionMap that is returned.
	*/
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

	/*
		@param scoreFunctions - An array of ScoreFunctions that are to be averaged into a new ScoreFunction. These score functions must be for the given objective.
		@param objective - A PrimitiveObjective whose ScoreFunctions are to be averaged. 
		@returns {ScoreFunctionMap} - A ScoreFunction that is an average of the given ScoreFunction
		@description	Computes the average ScoreFunction for the given objective in the ValueChart by iterating over the given ScoreFunction, which must be for that objective.
	*/
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






