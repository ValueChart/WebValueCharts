
import { Injectable } 										from '@angular/core';
import * as _												from 'lodash';

// Import Model Classes:
import { ValueChart }										from '../../../model/ValueChart';
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { AbstractObjective }								from '../../../model/AbstractObjective';
import { Alternative }										from '../../../model/Alternative';
import { Objective }										from '../../../model/Objective';
import { User }												from '../../../model/User';
import { CategoricalDomain }								from '../../../model/CategoricalDomain';
import { ContinuousDomain }									from '../../../model/ContinuousDomain';
import { ScoreFunction }									from '../../../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../../../model/DiscreteScoreFunction';

/*
	This class provides methods to update the ValueChart model to align with the Objectives.
*/

@Injectable()
export class UpdateValueChartService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public CREATOR_CHANGED: string = "The ValueChart owner has been changed to: ";
	public DESCRPTION_CHANGED: string = "The ValueChart's description has been changed to: ";
	public NAME_CHANGED: string = "The ValueChart's name has been changed to: ";
	public PASSWORD_CHANGED: string = "The ValueChart's password has been changed to: ";
	public TYPE_CHANGED: string = "The type of the ValueChart has been changed to: ";

	public ALTERNATIVE_ADDED: string = "A new alternative has been added to the ValueChart: "
	public ALTERNATIVE_REMOVED: string = "An alternative has been removed from the ValueChart: "
	public ALTERNATIVE_CHANGED: string = "An existing alternative has been modified: "

	public OBJECTIVE_ADDED: string = "A new objective has been added to the ValueChart: "
	public OBJECTIVE_REMOVED: string = "An objective has been removed from the ValueChart: "
	public OBJECTIVE_CHANGED: string = "An existing objective has been modified: "

	public BEST_WORST_OUTCOME_CHANGED: string = "The best/worst outcomes on some Objectives have changed. You may want to revisit your weights.";
	public SCORE_FUNCTIONS_RESET: string = "Your score functions for the following Objectives have been reset to default: ";
	public NEW_SCORE_FUNCTION_ELEMENTS: string = "New elements have been added to your score functions for the following Objectives: ";
	public NEW_OBJECTIVE_WEIGHTS: string = "The following Objectives have been added to your chart with weight 0: ";

	// ========================================================================================
	// 									Constructor
	// ========================================================================================
	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	updateValueChart(oldStructure: ValueChart, newStructure: ValueChart): string[] {
		var changeList: string[] = [];

		changeList = changeList.concat(this.updateBasicDetails(oldStructure, newStructure));
		changeList = changeList.concat(this.updateObjectives(oldStructure, newStructure));
		changeList = changeList.concat(this.updateAlternatives(oldStructure, newStructure));

		return changeList;
	}

	updateBasicDetails(oldStructure: ValueChart, newStructure: ValueChart): string[] {
		var changeList: string[] = [];

		if (oldStructure.getCreator() !== newStructure.getCreator()) {
			oldStructure.setCreator(newStructure.getCreator());
			changeList.push(this.CREATOR_CHANGED + newStructure.getCreator());
		}

		if (oldStructure.getDescription() !== newStructure.getDescription()) {
			oldStructure.setDescription(newStructure.getDescription());
			changeList.push(this.DESCRPTION_CHANGED + newStructure.getDescription());
		}

		if (oldStructure.getName() !== newStructure.getName()) {
			oldStructure.setName(newStructure.getName());
			changeList.push(this.NAME_CHANGED + newStructure.getName());
		}

		if (oldStructure.getType() !== newStructure.getType()) {
			oldStructure.setType(newStructure.getType());
			changeList.push(this.TYPE_CHANGED + newStructure.getType());
		}

		if (oldStructure.password !== newStructure.password) {
			oldStructure.password = newStructure.password;
			changeList.push(this.PASSWORD_CHANGED + newStructure.password);
		}

		oldStructure._id = newStructure._id;

		return changeList;
	}

	updateObjectives(oldStructure: ValueChart, newStructure: ValueChart): string[] {
		var changeList: string[] = [];
		var newObjectives = newStructure.getAllObjectives();
		var oldObjectives = oldStructure.getAllObjectives();

		// Get all alternatives in newStructure that are different from those in oldStructure. 
		var differences = _.differenceWith(newObjectives, oldObjectives, this.compareObjectives);
		
		differences.forEach((objective: Objective) => {
			let oldIndex = _.findIndex(oldObjectives, ['name', objective.getName()]);

			if (oldIndex === -1) {	// Was the objective in the old structure?
				changeList.push(this.OBJECTIVE_ADDED + objective.getName());
			} else {
				changeList.push(this.OBJECTIVE_CHANGED + objective.getName());
			}
		});

		// Get all objectives in the oldStructure that are not in the new structure (by the 'name' property).
		var deletedObjectives = _.differenceBy(oldObjectives, newObjectives, 'name');
		deletedObjectives.forEach((objective: Objective) => {
			changeList.push(this.OBJECTIVE_REMOVED + objective.getName());
		});

		oldStructure.setRootObjectives(newStructure.getRootObjectives());

		return changeList;
	}

	updateAlternatives(oldStructure: ValueChart, newStructure: ValueChart): string[] {
		var changeList: string[] = [];

		// Get all alternatives in newStructure that are different from those in oldStructure. 
		var differences = _.differenceWith(newStructure.getAlternatives(), oldStructure.getAlternatives(), this.compareAlternatives);
		
		differences.forEach((alternative: Alternative) => {
			if (_.findIndex(oldStructure.getAlternatives(), ['name', alternative.getName()]) === -1)		// Was the alternative in the old structure?
				changeList.push(this.ALTERNATIVE_ADDED + alternative.getName());
			else
				changeList.push(this.ALTERNATIVE_CHANGED + alternative.getName());
		});

		// Get all alternatives in the oldStructure that are not in the new structure (by the 'name' property).
		var deletedAlternatives = _.differenceBy(oldStructure.getAlternatives(), newStructure.getAlternatives(), 'name');
		deletedAlternatives.forEach((alternative: Alternative) => {
			changeList.push(this.ALTERNATIVE_REMOVED + alternative.getName());
		});

		oldStructure.setAlternatives(newStructure.getAlternatives());

		return changeList;
	}

	compareObjectives(a: Objective, b: Objective): boolean {
		if (a.objectiveType === 'primitive' || b.objectiveType === 'primitive')
			return _.isEqual(a, b);
		else {
			let aCopy = _.clone(a);
			let bCopy = _.clone(b);

			(<AbstractObjective> aCopy).setDirectSubObjectives([]);
			(<AbstractObjective> bCopy).setDirectSubObjectives([]);

			let fieldsSame = _.isEqual(aCopy, bCopy);	// Check if the immediate properties are the same.
			// Check (by name) to see if the children are the same.
			let childrenSame = _.differenceBy((<AbstractObjective> a).getDirectSubObjectives(), (<AbstractObjective> b).getDirectSubObjectives(), 'name').length === 0;

			return fieldsSame && childrenSame;
		}
	}

	compareAlternatives(a: Alternative, b: Alternative): boolean {
		let aCopy = _.cloneDeep(a);
		let bCopy = _.cloneDeep(b);

		let differentKeys = _.xor(a.getObjectiveKeys(), b.getObjectiveKeys());

		console.log(differentKeys);

		// Ignore new or removed values due to new or removed objectives.
		differentKeys.forEach((key: string) => {
			aCopy.setObjectiveValue(key, null);
			bCopy.setObjectiveValue(key, null);
		});

		return _.isEqual(aCopy, bCopy);
	}


 	// ================================ Clean-up Alternatives ====================================

	/*
		@returns {string[]}
		@description 	Repairs alternatives to align with the Objectives in the chart. 
	*/
	cleanUpAlternatives(valueChart: ValueChart) {
		let primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();
		let alternatives: Alternative[] = valueChart.getAlternatives();

		this.removeAlternativeEntries(primitiveObjectives, alternatives);
		this.clearAlternativeValues(primitiveObjectives, alternatives);
	}

	/*
		@returns {void}
		@description 	 Removes Alternative entries for Objectives that are not in the chart.
	*/
	removeAlternativeEntries(primitiveObjectives: PrimitiveObjective[], alternatives: Alternative[]) {
		let objNames = primitiveObjectives.map((objective: PrimitiveObjective) => { return objective.getName(); });

		for (let alt of alternatives) {
			for (let key of alt.getObjectiveKeys()) {
				if (objNames.indexOf(key) === -1) {
					alt.removeObjective(key);
				}
			}
		}
	}

	/*
		@returns {void}
		@description 	 Checks each Alternative's outcome on each Objective. Clears if no longer in range.
	*/
	clearAlternativeValues(primitiveObjectives: PrimitiveObjective[], alternatives: Alternative[]) {
		for (let obj of primitiveObjectives) {
			for (let alt of alternatives) {
				if (obj.getDomainType() === "continuous") {
					let dom = <ContinuousDomain>obj.getDomain();
					let altVal: number = Number(alt.getObjectiveValue(obj.getName()));
					if (isNaN(altVal) || altVal < dom.getMinValue() || altVal > dom.getMaxValue()) {
						alt.removeObjective(obj.getName());
					}
				}
				else {
					let altVal: string = String(alt.getObjectiveValue(obj.getName()));
					if ((<CategoricalDomain>obj.getDomain()).getElements().indexOf(altVal) === -1) {
						alt.removeObjective(obj.getName());
					}
				}
			}
		}
	}

 	// ================================ Clean-up Preferences ====================================

 	cleanUpPreferences(valueChart: ValueChart, users: User[]): string[] {
 		let warnings: string[] = [];

 		for (let user of users) {
 		  	warnings = warnings.concat(this.cleanUpUserPreferences(valueChart, user));
 		}

 		return warnings;
 	}

 	/*
		@returns {string[]}
		@description 	Removes all elements from the user's preference model that should not be there.
						This includes score functions and weights for non-existent Objectives and scores for non-existent domain elements.
						Resets score functions if any of the following have changed: domain type, min, max, interval.
	*/
	cleanUpUserPreferences(valueChart: ValueChart, user: User): string[] {
		let warnings: string[] = [];

		let primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();
		let resetScoreFunctions = [];
		let bestWorstChanged = false;
		this.removeScoreFunctions(primitiveObjectives, user);
		this.removeWeights(primitiveObjectives, user);
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
      		if (user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName())) {
      			let scoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName());
	      		if (obj.getDomainType() === 'categorical' && scoreFunction.type === 'discrete') {
			        this.removeScoreFunctionEntries(<CategoricalDomain>obj.getDomain(),<DiscreteScoreFunction>scoreFunction);
			    }
			    // Reset score functions if there were changes to any of the following: Domain type, min, max, or interval
				// It may be possible to do something more clever in the future that preserves parts of the previous score function
			    else {
			    	if (!_.isEqual(scoreFunction.getAllElements(), obj.getDefaultScoreFunction().getAllElements())) {
			    		user.getScoreFunctionMap().setObjectiveScoreFunction(obj.getName(), _.cloneDeep(obj.getDefaultScoreFunction()));
			    		resetScoreFunctions.push(obj.getName());
			    	}
			    }
			    if (this.checkBestWorstChanged(scoreFunction, user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName()))) {
			    	bestWorstChanged = true;
      			}
      		}
      	}

  		if (resetScoreFunctions.length > 0) {
    		warnings.push(this.SCORE_FUNCTIONS_RESET + resetScoreFunctions.join(", "));
    	}
    	// Only warn if some weights have already been set
    	if (bestWorstChanged && user.getWeightMap().getWeightTotal() !== 0) {
    		warnings.push((this.BEST_WORST_OUTCOME_CHANGED));
    	}

        warnings = warnings.concat(this.completePreferences(primitiveObjectives, user));

        return warnings;
	}

	/*
		@returns {void}
		@description 	Removes score functions for Objectives that are not in the chart.
	*/
	removeScoreFunctions(primitiveObjectives: PrimitiveObjective[], user: User) {
		let objNames = primitiveObjectives.map((objective: PrimitiveObjective) => { return objective.getName(); });

		for (let key of user.getScoreFunctionMap().getAllScoreFunctionKeys()) {
			if (objNames.indexOf(key) === -1) {
				user.getScoreFunctionMap().removeObjectiveScoreFunction(key);
			}
		}
	}

	/*
		@returns {void}
		@description 	Removes weights for Objectives that are not in the chart.
	*/
	removeWeights(primitiveObjectives: PrimitiveObjective[], user: User) {
		let objNames = primitiveObjectives.map((objective: PrimitiveObjective) => { return objective.getName(); });
		let error = 1e-8 * primitiveObjectives.length;
		let renormalize = user.getWeightMap().getWeightTotal() > 1 - error && user.getWeightMap().getWeightTotal() < 1 + error;

		var elementIterator: Iterator<string> = user.getWeightMap().getInternalWeightMap().keys();
		var iteratorElement: IteratorResult<string> = elementIterator.next();
		var size = 0;
		while (iteratorElement.done === false) {
			if (objNames.indexOf(<string>iteratorElement.value) === -1) {
            	user.getWeightMap().removeObjectiveWeight(<string>iteratorElement.value);
          	}
			iteratorElement = elementIterator.next();
			size++;
		}
		if (renormalize) {
			user.getWeightMap().normalize();
		}	
	}

	/*
		@returns {void}
		@description 	Removes non-existent domain elements from discrete score functions.
	*/
	removeScoreFunctionEntries(dom: CategoricalDomain, scoreFunction: DiscreteScoreFunction) {
		let elements = dom.getElements();
		var elementIterator: Iterator<number | string> = scoreFunction.getElementScoreMap().keys();
		var iteratorElement: IteratorResult<number | string> = elementIterator.next();
		while (iteratorElement.done === false) {
			if (elements.indexOf(<string>iteratorElement.value) === -1) {
            	scoreFunction.removeElement(<string>iteratorElement.value);
          	}
			iteratorElement = elementIterator.next();
		}
	}

	/*
		@returns {booleain}
		@description 	Checks if the best/worst elements of oldScoreFunction are the same as those of the current score function.
						Returns true iff they have changed.
	*/
	checkBestWorstChanged(oldScoreFunction: ScoreFunction, newScoreFunction: ScoreFunction): boolean {
		return (oldScoreFunction.bestElement !== newScoreFunction.bestElement || oldScoreFunction.worstElement !== newScoreFunction.worstElement);
	}

	// ================================ Complete Preferences ====================================

	
 	/*
		@returns {string[]}
		@description 	Adds missing elements to the user's preference model.
						This includes score functions and weights for all Objectives and scores for all domain elements.
	*/
	completePreferences(primitiveObjectives: PrimitiveObjective[], user: User): string[] {
		let warnings: string[] = [];

		warnings = warnings.concat(this.completeScoreFunctions(primitiveObjectives, user));
		// Only insert missing weights if all weights are already set
		let error = 1e-8 * primitiveObjectives.length;
		if (user.getWeightMap().getWeightTotal() > 1 - error && user.getWeightMap().getWeightTotal() < 1 + error) {
			warnings = warnings.concat(this.completeWeights(primitiveObjectives, user));
		}	

		return warnings;
	}

	/*
		@returns {string[]}
		@description 	Initializes and completes user's score functions to align with the Objectives in the chart.
	*/
	completeScoreFunctions(primitiveObjectives: PrimitiveObjective[], user: User): string[] {
		let warnings: string[] = [];

		let completed = [];
		for (let obj of primitiveObjectives) {
			// Make sure there is a score function for every Objective (initialized to default)
			// Also, set immutable score functions to be an exact replica of the default
      		if (!user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName())
      			|| obj.getDefaultScoreFunction().immutable) {
        		user.getScoreFunctionMap().setObjectiveScoreFunction(obj.getName(), _.cloneDeep(obj.getDefaultScoreFunction()));
     		}
     		else {
     			let scoreFunction = user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName());
     			// Make sure score functions are complete
	      		if (obj.getDomainType() === 'categorical' && scoreFunction.type === 'discrete') {
			        if (this.addMissingElements(<CategoricalDomain>obj.getDomain(),<DiscreteScoreFunction>scoreFunction)) {
			        	completed.push(obj.getName());
			        }
			    }
     		}
     	}
     	if (completed.length > 0) {
        	warnings.push(this.NEW_SCORE_FUNCTION_ELEMENTS + completed.join(", "));
        }

        return warnings;
	}

    /*
		@returns {boolean}
		@description 	Inserts missing domain elements into discrete score functions. Initializes scores to 0.5.
						Returns true iff new elements were inserted.
	*/
	addMissingElements(dom: CategoricalDomain, scoreFunction: DiscreteScoreFunction): boolean {
		let completed = false;
		let elements = dom.getElements();
        for (let elt of elements) {
			if (scoreFunction.getScore(elt) === undefined) {
				scoreFunction.setElementScore(elt, 0.5);
				completed = true;
			}
        }
        return completed;
	}

	/*
		@returns {string[]}
		@description 	Inserts missing Objective weights, initialized to 0 
	*/
	completeWeights(primitiveObjectives: PrimitiveObjective[], user: User): string[] {
		let warnings: string[] = [];

		let addedWeights = [];
		for (let obj of primitiveObjectives) {
      		if (user.getWeightMap().getObjectiveWeight(obj.getName()) === undefined) {
      			user.getWeightMap().setObjectiveWeight(obj.getName(), 0.0);
      			addedWeights.push(obj.getName())
      		}
      	}
      	if (addedWeights.length > 0) {
        	warnings.push(this.NEW_OBJECTIVE_WEIGHTS + addedWeights.join(", "));
        }

        return warnings;
	}
}