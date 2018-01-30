/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-06 14:01:46
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
import * as Formatter															from '../app/utilities/Formatter';

// Import Libraries:
import * as _																	from 'lodash';


/*
	This class is the representation of all of a ValueChart's internal data. It uses the Alternative class to represent the decision options
	in a ValueChart, a hierarchical structure of of Objectives to represent criteria for the decision, and an array of Users to represent 
	user preferences. The ValueChart class is actually both a structural and preference class because of this array of users. A ValueChart 
	with one user is referred to as a "individual" ValueChart, while a ValueChart with multiple users is referred to as a "group" ValueChart.
	These ValueCharts sub-types are rendered differently by the ValueChartDirective, but data-wise differ only in the number of users. 
	A ValueChart with no users is a called a ValueChart structure and is used when new users join a ValueChart and require ONLY its structural 
	elements.
*/

export enum ChartType { Individual, Group };

export class ValueChart {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private type: ChartType;
	private name: string;					// The name of the ValueChart.
	private fname: string;					// The name of the ValueChart formatted to remove spaces and special characters.
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
		this.fname = Formatter.nameToID(this.name);

		if (users) {
			this.users = users;
		}
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	// Note that methods that are simple getters/setters, or modifiers are not commented as they are self-explanatory.

	getType(): ChartType {
		return this.type;
	}

	setType(type: ChartType): void {
		this.type = type;
	}

	getFName(): string {
		return this.fname;
	}

	setFName(fname: string) {
		this.fname = fname;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
		this.fname = Formatter.nameToID(this.name);
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
		return this.type === ChartType.Individual;
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
		@returns {PrimitiveObjective[]}
		@description   Returns Objectives whose default score functions are mutable.
	*/
	getMutableObjectives(): PrimitiveObjective[] {
		return this.getAllPrimitiveObjectives().filter(obj => !obj.getDefaultScoreFunction().immutable);
	}

	/*   
		@returns {string[]}
		@description   Returns map from Objective ids to names.
	*/
	public getObjectiveIdToNameMap(): {[objID: string]: string} {
		let objectiveMap: {[objID: string]: string} = {};
		for (let obj of this.getAllPrimitiveObjectives()) {
			objectiveMap[obj.getId()] = obj.getName();
		}
		return objectiveMap;
	}

	/*   
		@returns {string[]}
		@description   Returns map from Objective names to ids.
	*/
	public getObjectiveNameToIdMap(): {[objName: string]: string} {
		let objectiveMap: {[objName: string]: string} = {};
		for (let obj of this.getAllPrimitiveObjectives()) {
			objectiveMap[obj.getName()] = obj.getId();
		}
		return objectiveMap;
	}

	/*   
		@returns {ValueChart}
		@description   Returns a shallow copy of the ValueChart containing no users.
	*/
	public getValueChartStructure(): ValueChart {
		let structure = new ValueChart(this.name, this.description, this.creator);
		structure.setAlternatives(this.alternatives);
		structure.setRootObjectives(this.rootObjectives);
		return structure;
	}

	// Alternative Related Methods:

	getAlternatives(): Alternative[] {
		return this.alternatives;
	}

	setAlternatives(alternatives: Alternative[]): void {
		this.alternatives = alternatives;
	}

	addAlternative(alternative: Alternative): void {
		if (this.alternatives.indexOf(alternative) === -1) {
			this.alternatives.push(alternative);
		}
	}

	removeAlternative(alternative: Alternative): void {
		var alternativeIndex: number = this.alternatives.indexOf(alternative);
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
			alternativeValues.push({ value: alternative.getObjectiveValue(objective.getId()), alternative: alternative });
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

	setUser(newUser: User): void {
		var userIndex: number = this.users.findIndex((user: User) => {
			return newUser.getUsername() === user.getUsername();
		});

		if (userIndex === -1) {
			this.users.push(newUser);
		} else {
			this.users[userIndex] = newUser;
		}
	}

	getUser(username: string): User{
		var user: User = this.users.filter((user: User) => {
			return user.getUsername() === username;
		})[0];

		return user;
	}

	isMember(username: string): boolean {
		return !_.isNil(this.getUser(username));
	}

	removeUser(userToDelete: User): void {
		var index: number = this.users.findIndex((currentUser: User) => {
				return userToDelete.getUsername() === currentUser.getUsername();
			});

		if (index !== -1) {
			this.users.splice(index, 1);
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
				weightMap.setObjectiveWeight(obj.getId(), weight);			
			}
		}
	}
}






