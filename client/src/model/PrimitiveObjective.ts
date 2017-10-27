/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 16:58:49
*/

// Import Model Classes:
import { Objective } 					from './Objective';
import { Domain } 						from './Domain';
import { CategoricalDomain } 			from './CategoricalDomain';
import { IntervalDomain } 				from './IntervalDomain';
import { ContinuousDomain } 			from './ContinuousDomain';
import { ScoreFunction } 				from './ScoreFunction';
import { DiscreteScoreFunction } 		from './DiscreteScoreFunction';
import { ContinuousScoreFunction } 		from './ContinuousScoreFunction';

import { Memento }				from './Memento';

// Import Utilities:
import * as Formatter		from '../app/utilities/Formatter';
import * as _ 				from 'lodash';

/*
	A PrimitiveObjective is a criteria used to evaluate Alternatives in a decision that cannot, or should not, be broken down 
	into further criteria. This is why it is called primitive. PrimitiveObjectives are a key component of a ValueChart. 
	They are assigned weights by users to rank their importance relative to other PrimitiveObjectives, and given user defined 
	score functions (see ScoreFunction below), which assign scores to every element in the PrimitiveObjective's domain. A 
	PrimitiveObjective's domain is the range of values that an Alternative may assign to that objective.
*/

export class PrimitiveObjective implements Objective {

	// ========================================================================================
	// 									Fields
	// ========================================================================================


	public objectiveType: string;					// The type of objective. This must always be 'primitive'.
	private name: string;							// The name of the objective.
	private id: string;								// The id of the objective. This field is used as the key for Alternatives, WeightMaps, and ScoreFunctionMaps. 
	private description: string;					// The description of the objective.
	private color: string;							// The color of the objective in a ValueChart.
	private domain: Domain;							// The domain of the objective. 
	private defaultScoreFunction: ScoreFunction;	// The default score function for all users.


	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	/*
		@param name - The name of the PrimitiveObjective.
		@param description - The description of the PrimitiveObjective.
		@returns {void}	
		@description	Constructs a new PrimitiveObjective. This constructor only initializes the basic fields of the PrimitiveObjective.
						A domain must be assigned separately using the getDomain method. The same goes for a color.
	*/
	constructor(name: string, description: string) {
		this.name = name;
		this.description = description;
		this.objectiveType = 'primitive';
		this.id = _.uniqueId(Formatter.nameToID(this.name) + '_');
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	getId(): string {
		return this.id;
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

	setColor(color: string): void {
		this.color = color;
	}

	getDomainType(): string {
		if (this.domain) {
			return this.domain.type;
		}
		else {
			return "";
		}
	}

	getDomain(): Domain {
		return this.domain;
	}

	setDomain(domain: Domain): void {
		this.domain = domain;
	}

	getDefaultScoreFunction(): ScoreFunction {
		if (this.defaultScoreFunction === undefined) {
			return this.getInitialScoreFunction(ScoreFunction.FLAT);
		}
		return this.defaultScoreFunction;
	}

	setDefaultScoreFunction(scoreFunction: ScoreFunction): void {
		this.defaultScoreFunction = scoreFunction;
	}

	/*
		@param type - The type of function (for now, one of: flat, positive linear, negative linear).
		@returns {ScoreFunction}
		@description	Creates and returns a new score function of the specified type for this PrimitiveObjective's domain.
	*/
	getInitialScoreFunction(type: string): ScoreFunction {
		let scoreFunction;
		if (this.getDomainType() === 'categorical' || this.getDomainType() === 'interval') {
			scoreFunction = new DiscreteScoreFunction();
			scoreFunction.initialize(type, (<CategoricalDomain | IntervalDomain>this.domain).getElements());
		}
		else {
			scoreFunction = new ContinuousScoreFunction((<ContinuousDomain>this.domain).getMinValue(),(<ContinuousDomain>this.domain).getMaxValue());
			scoreFunction.initialize(type);
		}
		return scoreFunction;
	}


	/*
		@returns {PrimitiveObjective} - A PrimitiveObjective that is an exact copy of this PrimitiveObjective.
		@description	Returns a copy (AKA a memento) of the PrimitiveObjective. This copy is stored in a different memory location and will not be changed if the original
						PrimitiveObjective is changed. This method should be used to create copies of a PrimitiveObjective when it needs to be preserved and stored.
	*/
	getMemento(): Memento {
		// Create a new PrimitiveObjective object.
		var primitiveObjectiveCopy: PrimitiveObjective = new PrimitiveObjective(this.name, this.description);
		// Copy over all the properties from the PrimitiveObjective that is being copied. Note that this does NOT create a new domain Objective, it merely preservers the reference.
		Object.assign(primitiveObjectiveCopy, this);

		return primitiveObjectiveCopy;
	}
}