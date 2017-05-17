/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-17 16:12:48
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
	This class is the representation of all of a ValueChart's internal data. It uses the Alternative class to represent the decision options
	in a ValueChart, a hierarchical structure of of Objectives to represent criteria for the decision, and an array of Users to represent 
	user preferences. The ValueChart class is actually both a structural and preference class because of this array of users. A ValueChart 
	with one user is referred to as a "individual" ValueChart, while a ValueChart with multiple users is referred to as a "group" ValueChart.
	These ValueCharts sub-types are rendered differently by the ValueChartDirective, but data-wise differ only in the number of users. 
	A ValueChart with no users is a called a ValueChart structure and is used when new users join a ValueChart and require ONLY its structural 
	elements.
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

	private maximumWeightMap: WeightMap;

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
		@returns {string[]} - An array of the names of all objectives in the ValueChart. This array is NOT ordered.	
		@description	Parses the ValueChart's hierarchical objective structure to find every objective's name.
	*/
	getAllObjectivesByName(): string[] {
		var primObj: string[] = [];
		for (var obj of this.getAllObjectives()) {
			primObj.push(obj.getName());
		}
		return primObj;
	}

	/*
		@returns {string[]} - An array of the names of all primitive objectives in the ValueChart. This array is NOT ordered.	
		@description	Parses the ValueChart's hierarchical objective structure to find every primitive objective's name.
						This method is surprisingly useful considering WeightMaps, ScoreFunctionMaps, and alternatives use
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
		this.updateMaximumWeightMap();
	}

	setUser(newUser: User): void {
		var userIndex: number = this.users.findIndex((user: User) => {
			return newUser.getUsername() === user.getUsername();
		});

		if (userIndex === -1) {
			this.users.push(newUser);
		} else {
			this.users[userIndex] = newUser;
		}

		this.updateMaximumWeightMap();
	}

	removeUser(user: User): void {
		var index: number = this.users.indexOf(user);
		if (index !== -1) {
			this.users.splice(index, 1);
			this.updateMaximumWeightMap();
		}
	}

	/*
		@returns {WeightMap} - A WeightMap where each objective weight is the maximum weight assigned to that objective by any user in chart.
		@description	Iterates over the ValueChart's collection of users to determine the maximum weight assigned to each primitive objective
						by any user. These maximum weights are then inserted into a new WeightMap, the so called maximum WeightMap. If there is only
						one user the in ValueChart, that user's weight map is simply returned. If there are no users, the default weight map is returned.
						The maximum weight map is to determine label heights by the LabelRenderer, and row heights by the objective chart renderer.
	*/
	getMaximumWeightMap(): WeightMap {
		if (this.users.length === 0)
			return this.getDefaultWeightMap();

		if (this.users.length === 1)
			return this.users[0].getWeightMap();

		if (this.maximumWeightMap == undefined)
			this.updateMaximumWeightMap();

		return this.maximumWeightMap;
	}



	private updateMaximumWeightMap(): void {
		var primitiveObjectives: PrimitiveObjective[] = this.getAllPrimitiveObjectives();
		var combinedWeights: number[] = Array(primitiveObjectives.length).fill(0);
		
		if (this.maximumWeightMap == undefined)
			this.maximumWeightMap = new WeightMap();

		if (this.users) {
			this.users.forEach((user: User) => {
				if (user.getWeightMap()) {
				let objectiveWeights = user.getWeightMap().getObjectiveWeights(primitiveObjectives);
					for (var i = 0; i < objectiveWeights.length; i++) {
						if (combinedWeights[i] < objectiveWeights[i]) {
							combinedWeights[i] = objectiveWeights[i];
						}
					}
				}
			});

			for (var i = 0; i < primitiveObjectives.length; i++) {
				this.maximumWeightMap.setObjectiveWeight(primitiveObjectives[i].getName(), combinedWeights[i]);
			}
		}

	}

	/*
		@returns {WeightMap} - The default WeightMap.
		@description	Create a default weight map for the Objective hierarchy with evenly distributed weights
	*/
	getDefaultWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
		this.initializeDefaultWeightMap(this.getRootObjectives(), weightMap, 1);
		return weightMap;
	}

	/*
		@returns {void}
		@description	Helper method for getDefaultWeightMap(). Recursively add entries to the WeightMap.
	*/
	private initializeDefaultWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
		let weight = parentWeight * 1.0 / objectives.length;
		for (let obj of objectives) {
			if (obj.objectiveType === 'abstract') {
				this.initializeDefaultWeightMap((<AbstractObjective>obj).getDirectSubObjectives(), weightMap, weight);
			}
			else {
				weightMap.setObjectiveWeight(obj.getName(), weight);			
			}
		}
	}
}






