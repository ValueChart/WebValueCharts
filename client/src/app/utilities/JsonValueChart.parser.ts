/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 20:48:02
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-10 16:53:37
*/

// Import Model Classes:
import { ValueChart, ChartType } 											from '../../model';
import { User }																from '../../model';
import { WeightMap }														from '../../model';
import { Objective } 														from '../../model';
import { PrimitiveObjective } 												from '../../model';
import { AbstractObjective } 												from '../../model';
import { Alternative } 														from '../../model';
import { ScoreFunctionMap }													from '../../model';
import { ScoreFunction } 													from '../../model';
import { ContinuousScoreFunction } 											from '../../model';
import { DiscreteScoreFunction } 											from '../../model';
import { Domain } 															from '../../model';
import { IntervalDomain }													from '../../model';
import { ContinuousDomain } 												from '../../model';
import { CategoricalDomain } 												from '../../model';

/*
	This class parses ValueChart's that have been formatted as JSON objects into ValueChart objects. JSON ValueCharts are ValueCharts that have been formatted
	into JavaScript object literals, and are no longer proper instances of the ValueChart class. They have all of the data of a ValueChart
	object, but lack the class' methods, (because the prototype is no longer correct). Additionally, all the objects that are a part of a ValueChart
	(Objectives, Alternatives, Users, etc) are also object literals and not proper class instances in a JSON ValueChart. This converts these 
	object literals into proper class instances so that they can be used by the application.

	JSON is markup language that is used by WebValueCharts to communicate between the client and server. This means that JsonValueChartParser is 
	required to convert ValueChart and User literals sent by the server into ValueChart and user Objects that can be used by the client. Because
	the resources communicated between the client and server may not be complete, this class is capable of parsing incomplete ValueCharts and Users.
*/


export class JsonValueChartParser {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@param JsonValueChart - A JSON representation of a ValueChart. This representation does not have to be complete. This means it can be missing fields like users, alternatives, etc. Missing fields will be parsed.
		@returns {ValueChart}	- A ValueChart object parsed from the JSON representation provided. 
		@description	Parses a ValueChart from a JSON representation and into the proper class instances so that it can be used by the 
						application.
	*/
	public parseValueChart(JsonValueChart: any): ValueChart {
		var valueChart: ValueChart = new ValueChart(JsonValueChart.name, JsonValueChart.description, JsonValueChart.creator);

		// Copy over all the properties from the WeightMap that is being saved.
		valueChart._id = JsonValueChart._id;
		valueChart.password = JsonValueChart.password;
		let type = (JsonValueChart.type === 0) ? ChartType.Individual : ChartType.Group;
		valueChart.setType(type);

		if (JsonValueChart.rootObjectives !== undefined) {
			// Parse Root Objectives
			for (var i = 0; i < JsonValueChart.rootObjectives.length; i++) {
				valueChart.addRootObjective(this.parseObjective(JsonValueChart.rootObjectives[i]));
			}
		}
		
		var nameToIdMap = valueChart.getObjectiveNameToIdMap();

		if (JsonValueChart.alternatives !== undefined) {
			// Parse Alternatives
			for (var i = 0; i < JsonValueChart.alternatives.length; i++) {
				valueChart.addAlternative(this.parseAlternative(JsonValueChart.alternatives[i], nameToIdMap));
			}	
		}

		// Parse Users if they are defined.
		if (JsonValueChart.users !== undefined) {
			for (var i = 0; i < JsonValueChart.users.length; i++) {
				valueChart.setUser(this.parseUser(JsonValueChart.users[i], nameToIdMap));
			}
		} else {
			JsonValueChart.users = [];
		}

		return valueChart;
	}

	private parseObjective(jsonObjective: any): Objective {
		var objective: Objective;
		if (jsonObjective.objectiveType === 'abstract') {
			objective = new AbstractObjective(jsonObjective.name, jsonObjective.description);
			for (var i = 0; i < jsonObjective.subObjectives.length; i++) {
				jsonObjective.subObjectives[i] = this.parseObjective(jsonObjective.subObjectives[i]);
			}

			Object.assign(objective, jsonObjective);
		} else {
			objective = new PrimitiveObjective(jsonObjective.name, jsonObjective.description);

			jsonObjective.domain = this.parseDomain(jsonObjective.domain);

			if (jsonObjective.defaultScoreFunction !== undefined) {
				jsonObjective.defaultScoreFunction = this.parseScoreFunction(jsonObjective.defaultScoreFunction);
			}		

			Object.assign(objective, jsonObjective);
		}
		
		return objective;
	}

	private parseDomain(jsonDomain: any): Domain {
		var domain: Domain;

		if (jsonDomain.type === 'continuous') {
			domain = new ContinuousDomain();
		} else if (jsonDomain.type === 'categorical') {
			domain = new CategoricalDomain(jsonDomain.ordered);
		} else {
			domain = new IntervalDomain(jsonDomain.min, jsonDomain.max, jsonDomain.interval);
		}

		Object.assign(domain, jsonDomain);

		return domain;
	}

	private parseAlternative(jsonAlternative: any, nameToIdMap: {[objName: string]: string}): Alternative {
		var alternative: Alternative = new Alternative(jsonAlternative.name, jsonAlternative.description);
		alternative['id'] = jsonAlternative['id'];

		for (var i = 0; i < jsonAlternative.objectiveValues.length; i++) {
			var key = jsonAlternative.objectiveValues[i][0];
			
			// TODO: remove this check after database migration. It is needed for backward compatibility only.
			if (nameToIdMap[key]) { // if this is defined, then the key is the name 
				key = nameToIdMap[key]; // set key to be the Objective ID instead of the name
			}

			alternative.setObjectiveValue(key, jsonAlternative.objectiveValues[i][1]);
		}

		return alternative;
	}

	/*
		@param jsonUser - A JSON representation of a ValueChart User. 
		@param nameToIdMap - A map from Objective names to ids.
		@returns {User}	- A User object parsed from the JSON representation provided. 
		@description	Parses a User from a JSON representation and into the proper class instances so that it can be used by the 
						application. This method can be used to parse Users sent in responses from the WebValueCharts server.
	*/
	public parseUser(jsonUser: any, nameToIdMap?: {[objName: string]: string}): User {
		var user: User = new User(jsonUser.username);

		// Parse the weight map if it is defined.
		if (jsonUser.weightMap !== undefined) {
			jsonUser.weightMap = this.parseWeightMap(jsonUser.weightMap, nameToIdMap);
		}

		// Parse the score function map if it is defined.
		if (jsonUser.scoreFunctionMap !== undefined) {
			jsonUser.scoreFunctionMap = this.parseScoreFunctionMap(jsonUser.scoreFunctionMap, nameToIdMap);
		}

		Object.assign(user, jsonUser);

		return user;
	}

	private parseWeightMap(jsonWeightMap: any, nameToIdMap: {[objName: string]: string}): WeightMap {
		var weightMap: WeightMap = new WeightMap();

		for (var i = 0; i < jsonWeightMap.weights.length; i++) {
			var key = jsonWeightMap.weights[i][0];
			
			// TODO: remove this check after database migration. It is needed for backward compatibility only.
			if (nameToIdMap && nameToIdMap[key] !== undefined) { // if this is defined, then the key is the name 
				key = nameToIdMap[key]; // set key to be the Objective ID instead of the name
			}

			weightMap.setObjectiveWeight(key, jsonWeightMap.weights[i][1]);
		}

		return weightMap;
	}

	private parseScoreFunctionMap(jsonScoreFunctionMap: any, nameToIdMap: {[objName: string]: string}): ScoreFunctionMap {
		var scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();

		for (var i = 0; i < jsonScoreFunctionMap.scoreFunctions.length; i++) {
			var key = jsonScoreFunctionMap.scoreFunctions[i][0];
			
			// TODO: remove this check after database migration. It is needed for backward compatibility only.
			if (nameToIdMap && nameToIdMap[key] !== undefined) { // if this is defined, then the key is the name 
				key = nameToIdMap[key]; // set key to be the Objective ID instead of the name
			}

			scoreFunctionMap.setObjectiveScoreFunction(key, this.parseScoreFunction(jsonScoreFunctionMap.scoreFunctions[i][1]));
		}
		return scoreFunctionMap;
	}

	private parseScoreFunction(jsonScoreFunction: any): ScoreFunction {
		var scoreFunction: ScoreFunction;

		if (jsonScoreFunction.type === 'continuous') {
			scoreFunction = new ContinuousScoreFunction(jsonScoreFunction.minDomainValue, jsonScoreFunction.maxDomainValue);
		} else {
			scoreFunction = new DiscreteScoreFunction();
		}

		scoreFunction.immutable = jsonScoreFunction.immutable === true;

		for (var i = 0; i < jsonScoreFunction.elementScoreMap.length; i++) {
			scoreFunction.setElementScore(jsonScoreFunction.elementScoreMap[i][0], jsonScoreFunction.elementScoreMap[i][1]);
		}

		return scoreFunction;
	}
}