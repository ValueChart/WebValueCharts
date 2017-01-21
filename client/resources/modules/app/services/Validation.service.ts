/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-12-28 13:01:57
*/

// Import Angular Classes:
import { Injectable } 										from '@angular/core';

// Import Application Classes:
import { CurrentUserService }								from './CurrentUser.service';
import { ChartUndoRedoService }								from './ChartUndoRedo.service';
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

// Import Type Definitions:
import { ValueChartStateContainer }							from '../../../types/StateContainer.types';
import { ScoreFunctionRecord }								from '../../../types/Record.types';

/*
	This class stores the state of the active ValueChart and exposes this state to any component, directive, or service in the application
	that requires it. It also provides utility methods for retrieving specific data from a ValueChart object.

	TODO: Think of constraints that are built into create workflow that need to be checked here
*/

@Injectable()
export class ValueChartService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================



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

	validate(valueChart: ValueChart): boolean {
		return this.validateBasicInfo(valueChart) && this.validateObjectives(valueChart) 
			&& this.validateAlternatives(valueChart) && this.validateUsers(valueChart);
	}

	// ================================ Validate Basic Info ====================================

	validateBasicInfo(valueChart: ValueChart): boolean {
		return this.nameValid(valueChart) && this.passwordValid(valueChart);
	}


	/* 	
		@returns {boolean}
		@description 	Returns true iff the name contains at least one character 
						and only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	nameValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		return (valueChart.getName().search(regex) !== -1);
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the password contains at least one character and no spaces.
	*/
	passwordValid(valueChart: ValueChart) {
		let regex = new RegExp("^[^\\s]+$");
		return (valueChart.password.search(regex) !== -1);
	}


	// ================================ Validate Objectives ====================================

	validateObjectives(valueChart: ValueChart): boolean {
		return this.allObjectivesHaveNames(valueChart) && this.allObjectiveNamesValid(valueChart) && this.allObjectiveNamesUnique(valueChart) 
			&& this.hasPrimitiveObjectives(valueChart) && this.allAbstractObjectivesHaveChildren(valueChart) && this.categoryNamesValid(valueChart) 
			&& this.categoryNamesUnique(valueChart)&& this.atLeastTwoCategories(valueChart) && this.continuousComplete(valueChart) 
			&& this.intervalComplete(valueChart) && this.minLessThanMax(valueChart) && this.intervalOk(valueChart);
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Objective has a name that isn't the empty string.
	*/
	allObjectivesHaveNames(valueChart: ValueChart): boolean {
		return valueChart.getAllObjectivesByName().indexOf("") === -1;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Objective has a name that contains at least one character
						and only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	allObjectiveNamesValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		for (let name of valueChart.getAllObjectivesByName()) {
			if (name.search(regex) === -1) {
				return false;
			}
		}
		return true;
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
		@returns {boolean}
		@description 	Returns true iff there is at least one primitive Objective.
	*/
	hasPrimitiveObjectives(valueChart: ValueChart): boolean {
		return valueChart.getAllPrimitiveObjectives().length > 0;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every abstract Objective has at least one child.
	*/
	allAbstractObjectivesHaveChildren(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllObjectives()) {
			if (obj.objectiveType === 'abstract' && (<AbstractObjective>obj).getAllSubObjectives().length < 1)  {
				return false;
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every category name is valid (i.e., contains only alphanumeric characters).
	*/
	categoryNamesValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'categorical') {
				for (let category of (<CategoricalDomain>obj.getDomain()).getElements()) {
					if (category.search(regex) === -1) {
						return false;
					}
				}
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every category name within each categorical domain is unique.
	*/
	categoryNamesUnique(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'categorical' &&
				(<CategoricalDomain>obj.getDomain()).getElements().length !== (new Set((<CategoricalDomain>obj.getDomain()).getElements())).size) {
					return false;
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff each categorical domain has at least two categories.
	*/
	atLeastTwoCategories(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'categorical' &&
				(<CategoricalDomain>obj.getDomain()).getElements().length < 3) {
					return false;
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff each continuous domain has a min and max value.
	*/
	continuousComplete(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'continuous') {
				let dom = <ContinuousDomain>obj.getDomain();
				if (dom.getMaxValue() === undefined || dom.getMinValue() === undefined
					|| isNaN(dom.getMaxValue()) || isNaN(dom.getMinValue())) {
					return false;
				}
			}
		}
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff each interval domain has a min, max, and interval value.
	*/
	intervalComplete(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'interval') {
				let dom = <IntervalDomain>obj.getDomain();
				if (dom.getMaxValue() === undefined || dom.getMinValue() === undefined || dom.getInterval() === undefined
					|| isNaN(dom.getMaxValue()) || isNaN(dom.getMinValue()) || isNaN(dom.getInterval())) {
					return false;
				}
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff for each continuous and interval domain, the min is less than the max.
	*/
	minLessThanMax(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'continuous' || obj.getDomainType() === 'interval') {
				let dom = <ContinuousDomain>obj.getDomain();
				if (dom.getMinValue() >= dom.getMaxValue()) {
					return false;
				}
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff for each interval domain, the interval is less than the range (max - min).
	*/
	intervalOk(valueChart: ValueChart): boolean {
		for (let obj of valueChart.getAllPrimitiveObjectives()) {
			if (obj.getDomainType() === 'interval') {
				let dom = <IntervalDomain>obj.getDomain();
				if (dom.getInterval() >= (dom.getMaxValue() - dom.getMinValue()) || (dom.getInterval() <= 0)) {
					return false;
				}
			}
		}
		return true;
	}

	// ================================ Validate Alternatives ====================================

	validateAlternatives(valueChart: ValueChart): boolean {
		return this.hasAlternatives(valueChart) && this.allAlternativesHaveNames(valueChart) && this.allObjectiveNamesValid(valueChart)
			&& this.allAlternativeNamesUnique(valueChart) && this.allObjectivesHaveValues(valueChart) && this.allAlternativeValuesValid(valueChart)
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
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff every Alternative has a name that contains at least one character
						and only alphanumeric characters, spaces, hyphens, and underscores.
	*/
	allAlternativeNamesValid(valueChart: ValueChart): boolean {
		let regex = new RegExp("^[\\s\\w-,.]+$");
		for (let alt of valueChart.getAlternatives()) {
			if (alt.getName().search(regex) === -1) {
				return false;
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff all Alternatives names are unique after converting to ID format.
	*/
	allAlternativeNamesUnique(valueChart: ValueChart): boolean {
		let formattedNames = valueChart.getAllObjectivesByName().map(x => Formatter.nameToID(x));
		return formattedNames.length === (new Set(formattedNames)).size;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff a value has been set/selected in every Objective column for every Alternative.
	*/
	allObjectivesHaveValues(valueChart: ValueChart): boolean {
		for (let alt of valueChart.getAlternatives()) {
			for (let objname of valueChart.getAllPrimitiveObjectivesByName()) {
				if (alt.getObjectiveValue(objname) === undefined) {
					return false;
				}
			}
		}
		return true;
	}

	/* 	
		@returns {boolean}
		@description 	Returns true iff the values entered for every continuous Objective for every Alternative are within the set range.
	*/
	allAlternativeValuesValid(valueChart: ValueChart): boolean {
		for (let alt of valueChart.getAlternatives()) {
			for (let obj of valueChart.getAllPrimitiveObjectives()) {
				let objValue = alt.getObjectiveValue(obj.getName());
				if (obj.getDomainType() === 'continuous') {
					let dom: ContinuousDomain = <ContinuousDomain>obj.getDomain();
					if (objValue > dom.getMaxValue() || objValue < dom.getMinValue()) {
						return false;
					}
				}
				else if (obj.getDomainType() === 'interval') {
					let dom: IntervalDomain = <IntervalDomain>obj.getDomain();
					if (objValue > dom.getMaxValue() || objValue < dom.getMinValue()
						|| ((<number>objValue - dom.getMinValue()) % dom.getInterval()) !== 0 ) {
						return false;
					}
				}
				else {
					let dom: CategoricalDomain = <CategoricalDomain>obj.getDomain();
					if (dom.getElements().indexOf(<string>objValue) === -1 ) {
						return false;
					}
				}
			}
		}
		return true;
	}


	// ================================ Validate Users ====================================

	validateUsers(valueChart: ValueChart): boolean {
		for (let user of valueChart.getUsers()) {
			if (!this.validateScoreFunctions(user, valueChart) || !this.validateWeights(user)) {
				return false;
			}
		}
		return true;
	}

	validateScoreFunctions(user: User, valueChart: ValueChart): boolean {
		let scoreFunctionMap = user.getScoreFunctionMap();
		for (let objName of valueChart.getAllPrimitiveObjectivesByName()) {
			let scoreFunction = scoreFunctionMap.getObjectiveScoreFunction(objName);
      		if (scoreFunction.getScore(scoreFunction.bestElement) !== 1 || scoreFunction.getScore(scoreFunction.worstElement) !== 0) {
      			return false;
      		}
      		for (let element of scoreFunction.getAllElements()) {
      			if (scoreFunction.getScore(element) > 1 || scoreFunction.getScore(element) < 0) {
      				return false;
      			}
      		}
 		}
 		return true;
 	}


	validateWeights(user: User): boolean {
		return false;
	}
}

