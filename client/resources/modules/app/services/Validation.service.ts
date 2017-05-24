// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Application Classes:
import *	as Formatter									from '../../utilities/classes/Formatter';

// Import Model Classes:
import { ValueChart }										from '../../../model/ValueChart';
import { Objective }										from '../../../model/Objective';
import { AbstractObjective }								from '../../../model/AbstractObjective';
import { PrimitiveObjective }								from '../../../model/PrimitiveObjective';
import { User }												from '../../../model/User';
import { Alternative }										from '../../../model/Alternative';
import { WeightMap }										from '../../../model/WeightMap';
import { ScoreFunctionMap }									from '../../../model/ScoreFunctionMap';
import { ScoreFunction }									from '../../../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }							from '../../../model/ContinuousScoreFunction';
import { CategoricalDomain }								from '../../../model/CategoricalDomain';
import { ContinuousDomain }									from '../../../model/ContinuousDomain';
import { IntervalDomain }									from '../../../model/IntervalDomain';

/*
	This class validates a ValueChart object to ensure that the data adheres to certain rules.

	It assumes that all data model fields are defined.
	It is the job of parsers to check that all required fields are present (e.g. every PrimitiveObjective has a Domain).
*/

@Injectable()
export class ValidationService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Move these?
	NAME_MISSING: string = "Chart must have a name.";
	NAME_INVALID: string = "Chart name contains disallowed characters.";
	PASSWORD_MISSING: string = "Chart must have a password.";
	PASSWORD_INVALID: string = "Chart password may not contain spaces."
	NO_PRIMITIVE_OBJECTIVES: string = "The chart must have at least one base Objective.";
	OBJECTIVE_NAMES_MISSING: string = "Every Objective must have a name.";
	OBJECTIVE_NAMES_NOT_UNIQUE: string = "Objective names must be unique.";
	OBJECTIVE_NAMES_INVALID: string = "The following Objective names contain disallowed characters: ";
	CHILDLESS_ABSTRACT_OBJECTIVE: string = "Every parent Objective must have at least one child. Please fix the following Objectives: ";
	CATEGORY_NAMES_INVALID: string = "Category names contain disallowed characters. Please change the following: ";
	TOO_FEW_CATEGORIES: string = "Categorical domains must have at least two categories. Please fix the following Objectives: ";
	CONT_DOMAIN_INCOMPLETE: string ="Continuous domains must have a min and a max. Please fix the following Objectives: ";
	INTERVAL_DOMAIN_INCOMPLETE: string = "Interval domains must have a min, max, and interval. Please fix the following Objectives: ";
	RANGE_INVALID: string = "Min must be less than max. Please fix the following Objectives: ";
	INTERVAL_INVALID: string = "Interval must be greater than 0 and less than max - min. Please fix the following Objectives: ";
	NO_ALTERNATIVES: string = "Chart must have at least one Alternative.";
	ALTERNATIVE_NAMES_MISSING: string = "Every Alternative must have a name.";
	ALTERNATIVE_NAMES_NOT_UNIQUE: string = "Alternative names must be unique.";
	ALTERNATIVE_NAMES_INVALID: string = "The following Alternative names contain disallowed characters: ";
	OBJECTIVE_OUTCOMES_MISSING: string = "You must select an outcome for every Objective on every Alternative. Please supply the following: ";
	OBJECTIVE_OUTCOMES_INVALID: string = "Objective outcomes must fall within the specified range. Please fix the following: ";
	SCORE_FUNCTIONS_MISSING: string = "Every user must define a score function for every Objective. The following pairs are missing: ";
	SCORE_FUNCTIONS_INCOMPLETE: string = "Every user must assign a score to every Objective outcome. The following pairs are incomplete: ";
	SCORE_FUNCTION_VALUE_INVALID: string = "Score function values must be between 0 and 1. The following Users need to fix their score functions for the specified Objectives: ";
	SCORE_FUNCTION_RANGE_INVALID: string = "The score function must assign a score of 0 and 1 to the worst and best outcomes, respectively.  The following Users need to fix their score functions for the specified Objectives: ";
	WEIGHTS_MISSING: string = "Every user must assign a weight to every Objective. The following pairs are missing: ";
	WEIGHTS_SUM_INVALID: string = "A user's weights must sum to 1. The following users need to fix their weights: ";
	WEIGHTS_RANGE_INVALID: string = "A user's weights must range from 0 to 1. The following users need to fix their weights: ";
	ALLOWED_CHARACTERS: string = "(Allowed: alphanumeric, spaces, underscores, hyphens, commas, and periods.)";


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to assign handlers to the Undo/Redo services event emitters in this
						method.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {

	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	validate(valueChart: ValueChart): string[] {
		return this.validateStructure(valueChart).concat(this.validateUsers(valueChart));
	}

	validateStructure(valueChart: ValueChart): string[] {
		return this.validateBasicInfo(valueChart).concat(this.validateObjectives(valueChart), this.validateAlternatives(valueChart));
	}

	validateUsers(valueChart: ValueChart): string[] {
		return this.validateScoreFunctions(valueChart).concat(this.validateWeights(valueChart));
	}

	// ================================ Validate Basic Info ====================================

	validateBasicInfo(valueChart: ValueChart): string[] {
		let errorMessages = [];
		if (!this.hasName(valueChart)) {
			errorMessages.push(this.NAME_MISSING);
		}
		if (!this.nameValid(valueChart)) {
			errorMessages.push(this.NAME_INVALID);
		}
		if (!this.hasPassword(valueChart)) {
			errorMessages.push(this.PASSWORD_MISSING);
		}
		if (!this.passwordValid(valueChart)) {
			errorMessages.push(this.PASSWORD_INVALID);
		}
		return errorMessages;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the name is non-empty.
	*/
	hasName(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		return (valueChart.getName() !== undefined && valueChart.getName() !== "");
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the name contains only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	nameValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]*$");
		return (valueChart.getName().search(regex) !== -1);
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the password is non-empty.
	*/
	hasPassword(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		return (valueChart.password !== undefined && valueChart.password !== "");
	}


	/* 	
		@returns {boolean}
		@description 	Returns true iff the password contains no spaces.
	*/
	passwordValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[^\\s]*$");
		return (valueChart.password.search(regex) !== -1);
	}


	// ================================ Validate Objectives ====================================

	validateObjectives(valueChart: ValueChart): string[] {
		let errorMessages = [];
		if (!this.hasPrimitiveObjectives(valueChart)) {
			errorMessages.push(this.NO_PRIMITIVE_OBJECTIVES);
		}
		if (!this.allObjectivesHaveNames(valueChart)) {
			errorMessages.push(this.OBJECTIVE_NAMES_MISSING);
		}
		if (!this.allObjectiveNamesUnique(valueChart)) {
			errorMessages.push(this.OBJECTIVE_NAMES_NOT_UNIQUE);
		}
		let invalidNames = this.invalidObjectiveNames(valueChart);
		if (invalidNames.length > 0) {
			errorMessages.push(this.OBJECTIVE_NAMES_INVALID.concat(invalidNames.join(', ')));
		}
		let childless = this.childlessAbstractObjectives(valueChart);
		if (childless.length > 0) {
			errorMessages.push(this.CHILDLESS_ABSTRACT_OBJECTIVE.concat(childless.join(', ')));
		}
		let invalidCats = this.invalidCategoryNames(valueChart);
		if (invalidCats.length > 0) {
			errorMessages.push(this.CATEGORY_NAMES_INVALID.concat(invalidCats.join('; ')));
		}
		let tooFewCats = this.fewerThanTwoCategories(valueChart);
		if (tooFewCats.length > 0) {
			errorMessages.push(this.TOO_FEW_CATEGORIES.concat(tooFewCats.join(', ')));
		}
		let contIncomplete = this.continuousIncomplete(valueChart);
		if (contIncomplete.length > 0) {
			errorMessages.push(this.CONT_DOMAIN_INCOMPLETE.concat(contIncomplete.join(', ')));
		}
		let intervalIncomplete = this.intervalIncomplete(valueChart);
		if (intervalIncomplete.length > 0) {
			errorMessages.push(this.INTERVAL_DOMAIN_INCOMPLETE.concat(intervalIncomplete.join(', ')));
		}
		let rangeInvalid = this.rangeInvalid(valueChart);
		if (rangeInvalid.length > 0) {
			errorMessages.push(this.RANGE_INVALID.concat(rangeInvalid.join(', ')));
		}
		let intervalInvalid = this.intervalInvalid(valueChart);
		if (intervalInvalid.length > 0) {
			errorMessages.push(this.INTERVAL_INVALID.concat(intervalInvalid.join(', ')));
		}
		return errorMessages;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff there is at least one primitive Objective.
	*/
	hasPrimitiveObjectives(valueChart: ValueChart): boolean {
		return valueChart.getAllPrimitiveObjectives().length > 0;
	}


	/* 	
		@returns {boolean}
		@description 	Returns true iff every Objective has a name that isn't the empty string.
	*/
	allObjectivesHaveNames(valueChart: ValueChart): boolean{
		return valueChart.getAllObjectivesByName().indexOf("") === -1;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff all Objective names are unique after converting to ID format.
	*/
	allObjectiveNamesUnique(valueChart: ValueChart): boolean {
		let formattedNames = valueChart.getAllObjectivesByName().map(x => Formatter.nameToID(x));
		return formattedNames.length === (new Set(formattedNames).size);
	}	

	/* 	
		@returns {string[]}
		@description 	Returns list of invalid Objective names.
						(Names may only contain alphanumeric characters, spaces, hyphens, and underscores.)
	*/
	invalidObjectiveNames(valueChart: ValueChart): string[] {
		let objectives = [];
		let regex = new RegExp("^[\\s\\w-,.]*$");
		for (let name of valueChart.getAllObjectivesByName()) {
			if (name.search(regex) === -1) {
				objectives.push(name);
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of childless abstract Objectives.
	*/
	childlessAbstractObjectives(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllObjectives()) {
			if (obj.objectiveType === 'abstract' && (<AbstractObjective>obj).getAllSubObjectives().length < 1)  {
				objectives.push(obj.getName());
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with invalid category names.
	*/
	invalidCategoryNames(valueChart: ValueChart): string[] {
		let objectives = [];
		let regex = new RegExp("^[\\s\\w-,.]+$");
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			let cats = [];
			if (obj.getDomainType() === 'categorical') {
				for (let category of (<CategoricalDomain>obj.getDomain()).getElements()) {
					if (category.search(regex) === -1) {
						cats.push(obj.getName());
					}
				}
			}
			if (cats.length > 0) {
				objectives.push(obj.getName() + ": " + cats.join(', '));
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with fewer than two categories.
	*/
	fewerThanTwoCategories(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'categorical' &&
				(<CategoricalDomain>obj.getDomain()).getElements().length < 2) {
					objectives.push(obj.getName());
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with incomplete continuous domains.
	*/
	continuousIncomplete(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'continuous') {
				let dom = <ContinuousDomain>obj.getDomain();
				if (dom.getMaxValue() === undefined || dom.getMinValue() === undefined
					|| isNaN(dom.getMaxValue()) || isNaN(dom.getMinValue())) {
					objectives.push(obj.getName());
				}
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with incomplete interval domains.
	*/
	intervalIncomplete(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'interval') {
				let dom = <IntervalDomain>obj.getDomain();
				if (dom.getMaxValue() === undefined || dom.getMinValue() === undefined || dom.getInterval() === undefined
					|| isNaN(dom.getMaxValue()) || isNaN(dom.getMinValue()) || isNaN(dom.getInterval())) {
					objectives.push(obj.getName());
				}
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with invalid range (min must be less than max).
	*/
	rangeInvalid(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'continuous' || obj.getDomainType() === 'interval') {
				let dom = <ContinuousDomain>obj.getDomain();
				if (dom.getMinValue() >= dom.getMaxValue()) {
					objectives.push(obj.getName());
				}
			}
		}
		return objectives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns the names of Objectives with an invalid interval.
	*/
	intervalInvalid(valueChart: ValueChart): string[] {
		let objectives = [];
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'interval') {
				let dom = <IntervalDomain>obj.getDomain();
				if (dom.getInterval() >= (dom.getMaxValue() - dom.getMinValue()) || (dom.getInterval() <= 0)) {
					objectives.push(obj.getName());
				}
			}
		}
		return objectives;
	}

	// ================================ Validate Alternatives ====================================

	validateAlternatives(valueChart: ValueChart): string[] {
		let errorMessages = [];
		if (!this.hasAlternatives(valueChart)) {
			errorMessages.push(this.NO_ALTERNATIVES);
		}
		if (!this.allAlternativesHaveNames(valueChart)) {
			errorMessages.push(this.ALTERNATIVE_NAMES_MISSING);
		}
		if (!this.allAlternativeNamesUnique(valueChart)) {
			errorMessages.push(this.ALTERNATIVE_NAMES_NOT_UNIQUE);
		}
		let invalidNames = this.invalidAlternativeNames(valueChart);
		if (invalidNames.length > 0) {
			errorMessages.push(this.ALTERNATIVE_NAMES_INVALID.concat(invalidNames.join(', ')));
		}
		let missingOutcomes = this.missingObjectiveOutcomes(valueChart);
		if (missingOutcomes.length > 0) {
			errorMessages.push(this.OBJECTIVE_OUTCOMES_MISSING.concat(missingOutcomes.join('; ')));
		}
		let invalidOutcomes = this.invalidOutcomes(valueChart);
		if (invalidOutcomes.length > 0) {
			errorMessages.push(this.OBJECTIVE_OUTCOMES_INVALID.concat(invalidOutcomes.join('; ')));
		}
		return errorMessages;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff there is at least one Alternative.
	*/
	hasAlternatives(valueChart: ValueChart): boolean {
		return valueChart.getAlternatives().length > 0;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Alternative has a name that isn't the empty string.
	*/
	allAlternativesHaveNames(valueChart: ValueChart): boolean {
		for (let alt of valueChart.getAlternatives()) {
			if (alt.getName() === "") {
				return false;
			}
		}
		return true
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff all Alternatives names are unique after converting to ID format.
	*/
	allAlternativeNamesUnique(valueChart: ValueChart): boolean {
		let alternatives = [];
		for (let alt of valueChart.getAlternatives()) {
			alternatives.push(alt.getName());
		}
		let formattedNames = alternatives.map(x => Formatter.nameToID(x));
		return formattedNames.length === (new Set(formattedNames)).size;
	}

	/* 	
		@returns {string[]}
		@description 	Returns list of invalid Alternative names.
						(Names may only contain alphanumeric characters, spaces, hyphens, and underscores.)
	*/
	invalidAlternativeNames(valueChart: ValueChart): string[] {
		let alternatives = [];
		let regex = new RegExp("^[\\s\\w-,.]*$");
		for (let alt of valueChart.getAlternatives()) {
			if (alt.getName().search(regex) === -1) {
				alternatives.push(alt.getName());
			}
		}
		return alternatives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns names of Alternatives that are missing outcomes on at least one Objective.
	*/
	missingObjectiveOutcomes(valueChart: ValueChart): string[] {
		let alternatives = [];
		for (let alt of valueChart.getAlternatives()) {
			let objectives: string[] = [];
			for (let objname of valueChart.getAllPrimitiveObjectivesByName()) {
				if (alt.getObjectiveValue(objname) === undefined) {
					objectives.push(objname);
				}
			}
			if (objectives.length > 0) {
				alternatives.push(alt.getName() + ": " + objectives.join(', '));
			}
		}
		return alternatives;
	}

	/* 	
		@returns {string[]}
		@description 	Returns true iff the values entered for every continuous Objective for every Alternative are within the set range.
	*/
	invalidOutcomes(valueChart: ValueChart): string[] {
		let alternatives = [];
		for (let alt of valueChart.getAlternatives()) {
			let objectives = [];
			for (let obj of valueChart.getAllPrimitiveObjectives()) {
				let objValue = alt.getObjectiveValue(obj.getName());
				if (objValue !== undefined) {
					if (obj.getDomainType() === 'continuous') {
						let dom: ContinuousDomain = <ContinuousDomain>obj.getDomain();
						if (<number>objValue > dom.getMaxValue() || <number>objValue < dom.getMinValue()) {
							objectives.push(obj.getName());
						}
					}
					else if (obj.getDomainType() === 'interval') {
						let dom: IntervalDomain = <IntervalDomain>obj.getDomain();
						if (<number>objValue > dom.getMaxValue() || <number>objValue < dom.getMinValue()
							|| ((<number>objValue - dom.getMinValue()) % dom.getInterval()) !== 0 ) {
							objectives.push(obj.getName());
						}
					}
					else if (obj.getDomainType() === 'categorical') {
						let dom: CategoricalDomain = <CategoricalDomain>obj.getDomain();
						if (dom.getElements().indexOf(<string>objValue) === -1 ) {
							objectives.push(obj.getName());
						}
					}					
				}
			}
			if (objectives.length > 0) {
				alternatives.push(alt.getName() + ": " + objectives.join(', '));
			}
		}
		return alternatives;
	}


	// ================================ Validate ScoreFunctions ====================================

	validateScoreFunctions(valueChart: ValueChart): string[] {
		let errorMessages = [];
		let missingScoreFunctions = this.missingScoreFunctions(valueChart);
		if (missingScoreFunctions.length > 0) {
			errorMessages.push(this.SCORE_FUNCTIONS_MISSING.concat(missingScoreFunctions.join('; ')));
		}
		let incompleteScoreFunctions = this.incompleteScoreFunctions(valueChart);
		if (incompleteScoreFunctions.length > 0) {
			errorMessages.push(this.SCORE_FUNCTIONS_INCOMPLETE.concat(incompleteScoreFunctions.join('; ')));
		}
		let invalidScoreFunctionValues = this.invalidScoreFunctionValues(valueChart);
		if (invalidScoreFunctionValues.length > 0) {
			errorMessages.push(this.SCORE_FUNCTION_VALUE_INVALID.concat(invalidScoreFunctionValues.join('; ')));
		}
		let invalidScoreFunctionRange = this.invalidScoreFunctionRange(valueChart);
		if (invalidScoreFunctionRange.length > 0) {
			errorMessages.push(this.SCORE_FUNCTION_RANGE_INVALID.concat(invalidScoreFunctionRange.join('; ')));
		}
		return errorMessages;
	}

	missingScoreFunctions(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let objectives = [];
			let scoreFunctionMap = user.getScoreFunctionMap();
			for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
				if (scoreFunctionMap === undefined || scoreFunctionMap.getObjectiveScoreFunction(objName) === undefined) {
					objectives.push(objName);
				}
			}
			if (objectives.length > 0) {
				users.push(user.getUsername() + ": " + objectives.join(', '));
			}
		}
		return users;
	}

	incompleteScoreFunctions(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let objectives = [];
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				for (let obj of valueChart.getAllPrimitiveObjectives()) {
					if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
						let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(obj.getName());
						if (scoreFunction) {
							let elements = [] ;
							for (let elt of (<CategoricalDomain>obj.getDomain()).getElements()) {
			      				if (scoreFunction.getScore(elt) === undefined) {
			      					elements.push(elt);
			      				}
			      			}
			      			if (elements.length > 0) {
			      				objectives.push(obj.getName());
			      			}
						}	
					}	
				}
			}
			if (objectives.length > 0) {
				users.push(user.getUsername() + ": " + objectives.join(', '));
			}
		}
		return users;
	}

	invalidScoreFunctionValues(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let objectives = [];
				for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
					let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);	
					if (scoreFunction) {
						let elements = [] ;
						for (let elt of scoreFunction.getAllElements()) {
			      			if (scoreFunction.getScore(elt) > 1 || scoreFunction.getScore(elt) < 0) {
			      				elements.push(elt);
			      			}
		      			}
		      			if (elements.length > 0) {
			      			objectives.push(objName);
			      		}
		      		}	
				}
				if (objectives.length > 0) {
					users.push(user.getUsername() + ": " + objectives.join(', '));
				}
			}
		}
		return users;
	}

	invalidScoreFunctionRange(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let scoreFunctionMap = user.getScoreFunctionMap();
			if (scoreFunctionMap) {
				let objectives = [];
				for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
					let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
					if (scoreFunction) {	
						if (scoreFunction.getScore(scoreFunction.bestElement) !== 1 || scoreFunction.getScore(scoreFunction.worstElement) !== 0) {
		      				objectives.push(objName);
		      			}
	      			}
				}
				if (objectives.length > 0) {
					users.push(user.getUsername() + ": " + objectives.join(', '));
				}
			}
		}
		return users;
	}

 	// ================================ Validate Weights ====================================


	validateWeights(valueChart: ValueChart): string[] {
		let errorMessages = [];
		let missingWeights = this.missingWeights(valueChart);
		if (missingWeights.length > 0) {
			errorMessages.push(this.WEIGHTS_MISSING.concat(missingWeights.join('; ')));
		}
		let invalidWeightSum = this.invalidWeightSum(valueChart);
		if (invalidWeightSum.length > 0) {
			errorMessages.push(this.WEIGHTS_SUM_INVALID.concat(invalidWeightSum.join(', ')));
		}
		let invalidWeightRange = this.invalidWeightSum(valueChart);
		if (invalidWeightRange.length > 0) {
			errorMessages.push(this.WEIGHTS_RANGE_INVALID.concat(invalidWeightRange.join('; ')));
		}
		return errorMessages;
	}

	missingWeights(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let weightMap = user.getWeightMap();
			let objectives = [];
			for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
				if (weightMap === undefined || weightMap.getObjectiveWeight(objName) === undefined) {
					objectives.push(objName);
				}
			}
			if (objectives.length > 0) {
				users.push(user.getUsername() + ": " + objectives.join(', '));
			}	
		}
		return users;
	}

	invalidWeightSum(valueChart: ValueChart): string[] {
		let users = [];
		let objs = valueChart.getAllPrimitiveObjectivesByName();
		let error = 1e-3 * objs.length;
		for (let user of valueChart.getUsers()) {
			let weightMap = user.getWeightMap();
			if (weightMap) {
				if (weightMap.getWeightTotal() < 1 - error || weightMap.getWeightTotal() > 1 + error) {
					users.push(user.getUsername());
				}
			}
		}
		return users;
	}

	invalidWeightRange(valueChart: ValueChart): string[] {
		let users = [];
		for (let user of valueChart.getUsers()) {
			let weightMap = user.getWeightMap();
			if (weightMap) {
				let objectives = [];
				for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
					if (weightMap.getObjectiveWeight(objName) < 0 || weightMap.getObjectiveWeight(objName) > 1) {
						objectives.push(objName);
					}
				}
				if (objectives.length > 0) {
					users.push(user.getUsername() + ": " + objectives.join(', '));
				}
			}
		}
		return users;
	}
}

