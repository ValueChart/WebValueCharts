/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 20:48:02
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-27 12:23:36
*/

// Model Classes
import { ValueChart } 														from '../model/ValueChart';
import { User }																from '../model/User';
import { WeightMap }														from '../model/WeightMap';
import { Objective } 														from '../model/Objective';
import { PrimitiveObjective } 												from '../model/PrimitiveObjective';
import { AbstractObjective } 												from '../model/AbstractObjective';
import { Alternative } 														from '../model/Alternative'; 
import { ScoreFunctionMap }													from '../model/ScoreFunctionMap';
import { ScoreFunction } 													from '../model/ScoreFunction';
import { ContinuousScoreFunction } 											from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 											from '../model/DiscreteScoreFunction';
import { Domain } 															from '../model/Domain';
import { IntervalDomain }													from '../model/IntervalDomain';
import { ContinuousDomain } 												from '../model/ContinuousDomain';
import { CategoricalDomain } 												from '../model/CategoricalDomain';

export class JsonValueChartParser {

	constructor() { }

	parseValueChart(jsonObject: any): ValueChart {

		var valueChart: ValueChart = new ValueChart(jsonObject.name, jsonObject.description, jsonObject.creator);
		// Copy over all the properties from the WeightMap that is being saved.

		// Parse Users
		for (var i = 0; i < jsonObject.users.length; i++) {
			jsonObject.users[i] = this.parseUser(jsonObject.users[i]);
		}
		
		// Parse Root Objectives
		for (var i = 0; i < jsonObject.rootObjectives.length; i++) {
			jsonObject.rootObjectives[i] = this.parseObjective(jsonObject.rootObjectives[i]);
		}

		for (var i = 0; i < jsonObject.alternatives.length; i++) {
			jsonObject.alternatives[i] = this.parseAlternative(jsonObject.alternatives[i]);
		}

		Object.assign(valueChart, jsonObject);


		return valueChart ;
	}

	parseObjective(jsonObject: any): Objective {
		var objective: Objective;
		if (jsonObject.objectiveType === 'abstract') {
			objective = new AbstractObjective(jsonObject.name, jsonObject.description, jsonObject.id);
			for (var i = 0; i < jsonObject.subObjectives.length; i++) {
				jsonObject.subObjectives[i] = this.parseObjective(jsonObject.subObjectives[i]);
			}

			Object.assign(objective, jsonObject);
		} else {
			objective = new PrimitiveObjective(jsonObject.name, jsonObject.description, jsonObject.id);

			jsonObject.domain = this.parseDomain(jsonObject.domain);

			Object.assign(objective, jsonObject);
		}

		return objective;
	}

	parseDomain(jsonObject: any): Domain {
		var domain: Domain;

		if (jsonObject.type === 'continuous') {
			domain = new ContinuousDomain();
		} else if (jsonObject.type === 'categorical') {
			domain = new CategoricalDomain(jsonObject.ordered);
		} else {
			domain = new IntervalDomain(jsonObject.min, jsonObject.max, jsonObject.interval);
		}

		Object.assign(domain, jsonObject);

		return domain;
	}

	parseAlternative(jsonObject: any): Alternative {
		var alternative: Alternative = new Alternative(jsonObject.name, jsonObject.description);

		for (var i = 0; i < jsonObject.objectiveValues.length; i++) {
			alternative.setObjectiveValue(jsonObject.objectiveValues[i][0], jsonObject.objectiveValues[i][1]); 
		}

		return alternative;
	}

	parseUser(jsonObject: any): User {
		var user: User = new User(jsonObject.username);

		jsonObject.weightMap = this.parseWeightMap(jsonObject.weightMap);
		jsonObject.scoreFunctionMap = this.parseScoreFunctionMap(jsonObject.scoreFunctionMap);

		Object.assign(user, jsonObject);

		return user;
	}

	parseWeightMap(jsonObject: any): WeightMap {
		var weightMap: WeightMap = new WeightMap();

		for (var i = 0; i < jsonObject.weights.length; i++) {
			weightMap.setObjectiveWeight(jsonObject.weights[i][0], jsonObject.weights[i][1]);
		}

		return weightMap;
	}

	parseScoreFunctionMap(jsonObject: any): ScoreFunctionMap {
		var scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();

		for (var i = 0; i < jsonObject.scoreFunctions.length; i++) {
			scoreFunctionMap.setObjectiveScoreFunction(jsonObject.scoreFunctions[i][0], this.parseScoreFunction(jsonObject.scoreFunctions[i][1])); 
		}
		return scoreFunctionMap;
	}

	parseScoreFunction(jsonObject: any): ScoreFunction {	
		var scoreFunction: ScoreFunction;

		if (jsonObject.type === 'continuous') {
			scoreFunction = new ContinuousScoreFunction(jsonObject.minDomainValue, jsonObject.maxDomainValue);
		} else {
			scoreFunction = new DiscreteScoreFunction();
		}

		for (var i = 0; i < jsonObject.elementScoreMap.length; i++) {
			scoreFunction.setElementScore(jsonObject.elementScoreMap[i][0], jsonObject.elementScoreMap[i][1]);
		}

		return scoreFunction;
	}



}