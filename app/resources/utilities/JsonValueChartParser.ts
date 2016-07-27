/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 20:48:02
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-26 22:09:02
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

		var users = jsonObject.users;
		jsonObject.users = [];

		var valueChart: ValueChart = new ValueChart(jsonObject.name, jsonObject.description, jsonObject.creator);
		// Copy over all the properties from the WeightMap that is being saved.
		
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

}