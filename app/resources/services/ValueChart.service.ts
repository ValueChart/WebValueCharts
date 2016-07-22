/*
* @Author: aaronpmishkin
* @Date:   2016-06-03 10:09:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-12 13:40:19
*/

import { Injectable } 										from '@angular/core';

// Application Classes:
import { CurrentUserService }								from './CurrentUser.service';

// Model Classes
import { ValueChart }										from '../model/ValueChart';
import { Objective }										from '../model/Objective';
import { AbstractObjective }								from '../model/AbstractObjective';
import { PrimitiveObjective }								from '../model/PrimitiveObjective';
import { User }												from '../model/User';	
import { Alternative }										from '../model/Alternative';
import { WeightMap }										from '../model/WeightMap';
import { ScoreFunctionMap }									from '../model/ScoreFunctionMap';
import { ScoreFunction }									from '../model/ScoreFunction';
import { DiscreteScoreFunction }							from '../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }							from '../model/ContinuousScoreFunction';
import { CategoricalDomain }								from '../model/CategoricalDomain';
import { ContinuousDomain }									from '../model/ContinuousDomain';
	
// This class stores the state of a ValueChart and exposes this state to the renderer classes. Renderer classes are allowed to modify 
// this state as a way of initiating change detection. 

@Injectable()
export class ValueChartService {

	private valueChart: ValueChart;
	private primitiveObjectives: PrimitiveObjective[];

	constructor(private currentUserService: CurrentUserService) { }

	// Initialize Service fields based on the passed-in ValueChart.
	setValueChart(valueChart: ValueChart): void {
		this.valueChart = valueChart;
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	getValueChart(): ValueChart {
		return this.valueChart;
	}

	getUsers(): User[] {
		return this.valueChart.getUsers();
	}

	getNumUsers(): number {
		return this.valueChart.getUsers().length;
	}

	getAlternatives(): Alternative[] {
		return this.valueChart.getAlternatives();
	}

	setAlternatives(alts: Alternative[]): void {
		this.valueChart.setAlternatives(alts);
	}

	getNumAlternatives(): number {
		return this.valueChart.getAlternatives().length;
	}

	getRootObjectives(): Objective[] {
		return this.valueChart.getRootObjectives();
	}

	getPrimitiveObjectives(): PrimitiveObjective[] {
		return this.primitiveObjectives;
	}

	setPrimitivesObjectives(objs: PrimitiveObjective[]) {
		this.primitiveObjectives = objs;
	}

	resetPrimitiveObjectives() {
		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();
	}

	// This is either: a - the current user's WeightMap if the ValueChart has one user; b - a WeightMap where each objective weight is the maximum weight assigned to the objective by a user.
	getMaximumWeightMap(): WeightMap {
		return this.valueChart.getMaximumWeightMap();
	}

	getAlternativeValuesforObjective(obj: PrimitiveObjective) : { value: (string | number), alternative: Alternative }[] {
		return this.valueChart.getAlternativeValuesforObjective(obj);
	}

	isIndividual() {
		return this.valueChart.isIndividual();
	}

	getCurrentUser(): User {
		// Obviously we should have it so that two usernames are never the same.
		var user: User = this.valueChart.getUsers().filter((user: User) => {
			return user.getUsername() === this.currentUserService.getUsername();
		})[0];

		if (!user)
			user = this.valueChart.getUsers()[0];

		return user;
	}
	
	getElementsFromContinuousDomain(continouousDomain: ContinuousDomain): number[] {
		var range: number[] = continouousDomain.getRange()
		var increment = (range[1] - range[0]) / 4;
		var element = range[0];

		var elements: number[] = [];

		while (element <= range[1]) {

			elements.push(Math.round(element * 100) / 100);
			element += increment;
		}

		return elements;
	}

	getObjective(name: string): Objective {
		for (let obj of this.valueChart.getAllObjectives()) {
			if (obj.getName() === name) {
				return obj;
			}
		}
		throw "Objective not found";
	}

	getPrimitiveObjectivesByName(): string[] {
		let primObj: string[] = [];
		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
			primObj.push(obj.getName());	
		}
		return primObj;
	}

	// Create initial weight map for the Objective hierarchy with evenly distributed weights
	getInitialWeightMap(): WeightMap {
		let weightMap: WeightMap = new WeightMap();
    	this.initializeWeightMap(this.valueChart.getRootObjectives(),weightMap,1);
    	return weightMap;
	}

	// Recursively add entries to weight map
  	private initializeWeightMap(objectives: Objective[], weightMap: WeightMap, parentWeight: number) {
  		let weight = parentWeight * 1.0 / objectives.length;
  		for (let obj of objectives) {
  			weightMap.setObjectiveWeight(obj.getName(),weight);
  			if (obj.objectiveType === 'abstract') {
  				this.initializeWeightMap((<AbstractObjective>obj).getDirectSubObjectives(),weightMap,weight);
  			}	
  		}
  	}

  	// Set up initial ScoreFunctions
  	// Scores for categorical varaibles are evenly space between 0 and 1
  	getInitialScoreFunctionMap(): ScoreFunctionMap {
  		let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
  		for (let obj of this.valueChart.getAllPrimitiveObjectives()) {
  			let scoreFunction: ScoreFunction;
  			if (obj.getDomainType() === 'categorical') {
  				scoreFunction = new DiscreteScoreFunction();
  				let dom = (<CategoricalDomain>obj.getDomain()).getElements();
  				let increment = dom.length - 1 / 1.0;
  				let currentScore = 0;
  				for (let item of dom) {
  					scoreFunction.setElementScore(item, currentScore);
  					currentScore += increment;
  				}			
  			}
  			else {
  				let min = (<ContinuousDomain>obj.getDomain()).getMinValue();
  				let max = (<ContinuousDomain>obj.getDomain()).getMaxValue();
  				scoreFunction = new ContinuousScoreFunction(min,max);
  			}
  			scoreFunctionMap.setObjectiveScoreFunction(obj.getName(),scoreFunction);
  		}
  		return scoreFunctionMap;
  	}
}