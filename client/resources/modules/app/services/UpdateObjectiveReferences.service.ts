
import { Injectable } 										from '@angular/core';
import * as _												from 'lodash';

// Import Model Classes:
import { ValueChart }										from '../../../model/ValueChart';
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { Alternative }										from '../../../model/Alternative';
import { User }												from '../../../model/User';
import { CategoricalDomain }								from '../../../model/CategoricalDomain';
import { ContinuousDomain }									from '../../../model/ContinuousDomain';
import { ScoreFunction }									from '../../../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../../../model/DiscreteScoreFunction';

/*
	This class provides methods to update the ValueChart model to align with the Objectives.
*/

@Injectable()
export class UpdateObjectiveReferencesService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

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


	updateValueChart(oldStructure: ValueChart, newStructure: ValueChart) {
		oldStructure.setCreator(newStructure.getCreator());
		oldStructure.setDescription(newStructure.getDescription());
		oldStructure.setName(newStructure.getName());
		oldStructure.setRootObjectives(newStructure.getRootObjectives());
		oldStructure.setAlternatives(newStructure.getAlternatives());
		oldStructure.password = newStructure.password;
		oldStructure._id = newStructure._id;
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
			for (let key in alt.getAllObjectiveValuePairs().keys()) {
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
					if (altVal < dom.getMinValue() || altVal > dom.getMaxValue()) {
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

 	cleanUpPreferences(valueChart: ValueChart, users: User[], showWarnings: boolean): User[] {
 		for (let user of users) {
 		  	user  = this.cleanUpUserPreferences(valueChart, user, showWarnings);
 		}

 		return users;
 	}

 	/*
		@returns {string[]}
		@description 	Removes all elements from the user's preference model that should not be there.
						This includes score functions and weights for non-existent Objectives and scores for non-existent domain elements.
						Resets score functions if any of the following have changed: domain type, min, max, interval.
	*/
	cleanUpUserPreferences(valueChart: ValueChart, user: User, showWarnings: boolean): User {
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
      	if (showWarnings) {
      		if (resetScoreFunctions.length > 0) {
        		toastr.warning(this.SCORE_FUNCTIONS_RESET + resetScoreFunctions.join(", "));
        	}
        	// Only warn if some weights have already been set
        	if (bestWorstChanged && user.getWeightMap().getWeightTotal() !== 0) {
        		toastr.warning(this.BEST_WORST_OUTCOME_CHANGED);
        	}
        }
        this.completePreferences(primitiveObjectives, user, showWarnings);

        return user;
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

		var elementIterator: Iterator<string> = user.getWeightMap().getInternalWeightMap().keys();
		var iteratorElement: IteratorResult<string> = elementIterator.next();
		while (iteratorElement.done === false) {
			if (objNames.indexOf(<string>iteratorElement.value) === -1) {
            	user.getWeightMap().removeObjectiveWeight(<string>iteratorElement.value);
          	}
			iteratorElement = elementIterator.next();
		}
		user.getWeightMap().normalize();
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
	completePreferences(primitiveObjectives: PrimitiveObjective[], user: User, showWarnings: boolean) {
		this.completeScoreFunctions(primitiveObjectives, user, showWarnings);
		// Only insert missing weights if all weights are already set
		if (user.getWeightMap().getWeightTotal() === 1) {
			this.completeWeights(primitiveObjectives, user, showWarnings);
		}	
	}

	/*
		@returns {string[]}
		@description 	Initializes and completes user's score functions to align with the Objectives in the chart.
	*/
	completeScoreFunctions(primitiveObjectives: PrimitiveObjective[], user: User, showWarnings: boolean) {
		let completed = [];
		for (let obj of primitiveObjectives) {
			// Make sure there is a score function for every Objective (initialized to default)
      		if (!user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getName())) {
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
     	if (showWarnings && completed.length > 0) {
        	toastr.warning(this.NEW_SCORE_FUNCTION_ELEMENTS + completed.join(", "));
        }
	}

    /*
		@returns {boolean}
		@description 	Inserts missing domain elements into discrete score functions. Initializes scores to 0.
						Returns true iff new elements were inserted.
	*/
	addMissingElements(dom: CategoricalDomain, scoreFunction: DiscreteScoreFunction): boolean {
		let completed = false;
		let elements = dom.getElements();
        for (let elt of elements) {
			if (scoreFunction.getScore(elt) === undefined) {
				scoreFunction.setElementScore(elt, 0);
				completed = true;
			}
        }
        return completed;
	}

	/*
		@returns {string[]}
		@description 	Inserts missing Objective weights, initialized to 0 
	*/
	completeWeights(primitiveObjectives: PrimitiveObjective[], user: User, showWarnings: boolean) {
		let addedWeights = [];
		for (let obj of primitiveObjectives) {
      		if (user.getWeightMap().getObjectiveWeight(obj.getName()) === undefined) {
      			user.getWeightMap().setObjectiveWeight(obj.getName(), 0.0);
      			addedWeights.push(obj.getName())
      		}
      	}
      	if (showWarnings && addedWeights.length > 0) {
        	toastr.warning(this.NEW_OBJECTIVE_WEIGHTS + addedWeights.join(", "));
        }
	}
}