/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 11:15:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:11:39
*/

// Model Classes
import { ValueChart } 														from '../../../model/ValueChart';
import { User }																from '../../../model/User';
import { WeightMap }														from '../../../model/WeightMap';
import { Objective } 														from '../../../model/Objective';
import { PrimitiveObjective } 												from '../../../model/PrimitiveObjective';
import { AbstractObjective } 												from '../../../model/AbstractObjective';
import { Alternative } 														from '../../../model/Alternative';
import { ScoreFunctionMap }													from '../../../model/ScoreFunctionMap';
import { ScoreFunction } 													from '../../../model/ScoreFunction';
import { ContinuousScoreFunction } 											from '../../../model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 											from '../../../model/DiscreteScoreFunction';
import { Domain } 															from '../../../model/Domain';
import { IntervalDomain }													from '../../../model/IntervalDomain';
import { ContinuousDomain } 												from '../../../model/ContinuousDomain';
import { CategoricalDomain } 												from '../../../model/CategoricalDomain';

export class WebValueChartsParser {

	constructor() { }

	parseValueChart(xmlDocument: Document): ValueChart {
		var valueChart: ValueChart;

		var valueChartElement: Element = xmlDocument.querySelector('ValueCharts');

		var valueChartName: string = valueChartElement.getAttribute('name');
		var valueChartCreator: string = valueChartElement.getAttribute('creator');
		var valueChartDescription: string = valueChartElement.querySelector('Description').innerHTML;

		var usersParentElement: Element = valueChartElement.querySelector('Users');
		var users: User[] = this.parseUsers(usersParentElement);

		valueChart = new ValueChart(valueChartName, valueChartDescription, valueChartCreator, users);
		valueChart._id = valueChartElement.getAttribute('id');

		var chartStructureElement: Element = valueChartElement.querySelector('ChartStructure');
		var objectivesParentElement: Element = chartStructureElement.querySelector('Objectives');
		var alternativesParentElement: Element = chartStructureElement.querySelector('Alternatives');

		valueChart.setRootObjectives(this.parseObjectives(objectivesParentElement));
		valueChart.setAlternatives(this.parseAlternatives(alternativesParentElement, valueChart.getAllPrimitiveObjectives()));


		return valueChart;
	}

	// ValueChart Structure Parsing Functions:

	parseObjectives(objectivesParentElement: Element): Objective[] {
		var objectives: Objective[] = [];

		var objectiveElements: Element[] = (<any>objectivesParentElement).children;

		for (var i = 0; i < objectiveElements.length; i++) {
			let objectiveElement: Element = objectiveElements[i];
			let objective: Objective;

			let type: string = objectiveElement.getAttribute('type');
			let name: string = objectiveElement.getAttribute('name');
			let description: string = objectiveElement.querySelector('Description').innerHTML;

			if (type === 'abstract') {
				objective = new AbstractObjective(name, description);
				(<AbstractObjective>objective).setDirectSubObjectives(this.parseObjectives(objectiveElement));
			} else {
				let color: string = objectiveElement.getAttribute('color');
				objective = new PrimitiveObjective(name, description);
				(<PrimitiveObjective>objective).setColor(color);

				let domainElement: Element = objectiveElement.querySelector('Domain');

				(<PrimitiveObjective>objective).setDomain(this.parseDomain(domainElement));
			}
			objectives.push(objective);
		}

		return objectives;
	}

	parseDomain(domainElement: Element): Domain {
		var domain: Domain;

		var type: string = domainElement.getAttribute('type');
		if (type === 'continuous') {
			let min: number = +domainElement.getAttribute('min');
			let max: number = +domainElement.getAttribute('max');
			let unit: string = domainElement.getAttribute('unit');
			domain = new ContinuousDomain(min, max, unit);
		} else if (type === 'categorical') {
			let ordered: boolean = (domainElement.getAttribute('ordered') === 'true');
			domain = new CategoricalDomain(ordered)
		} else if (type === 'interval') {
			let min: number = +domainElement.getAttribute('min');
			let max: number = +domainElement.getAttribute('max');
			let interval: number = +domainElement.getAttribute('interval');

			domain = new IntervalDomain(min, max, interval);
		}

		return domain;
	}

	parseAlternatives(alternativesParentElement: Element, primitiveObjectives: PrimitiveObjective[]): Alternative[] {
		var alternatives: Alternative[] = [];

		var alternativeElements: NodeListOf<Element> = alternativesParentElement.querySelectorAll('Alternative');

		for (var i = 0; i < alternativeElements.length; i++) {
			let alternativeElement: Element = alternativeElements[i];

			let name: string = alternativeElement.getAttribute('name');
			let description: string = alternativeElement.querySelector('Description').innerHTML;

			let alternative: Alternative = new Alternative(name, description);

			let alternativeValueElements: NodeListOf<Element> = alternativeElement.querySelectorAll('AlternativeValue');

			for (var j = 0; j < alternativeValueElements.length; j++) {
				let alternativeValueElement: Element = alternativeValueElements[j];

				let objectiveName: string = alternativeValueElement.getAttribute('objective');
				let domainValue: string | number = alternativeValueElement.getAttribute('value');


				let correspondingObjective: PrimitiveObjective = primitiveObjectives.find((objective: PrimitiveObjective) => {
					return objective.getName() === objectiveName;
				});

				if (correspondingObjective.getDomainType() === 'categorical') {
					(<CategoricalDomain>correspondingObjective.getDomain()).addElement(<string>domainValue);
				} else if (correspondingObjective.getDomainType() === 'continuous') {
					domainValue = +domainValue;											// Convert the domain value to a number
				}
				alternative.setObjectiveValue(objectiveName, domainValue);
			}

			alternatives.push(alternative);
		}

		return alternatives;
	}

	// Preference Model Parsing Functions:

	parseUsers(usersParentElement: Element): User[] {
		var users: User[] = [];

		var userElements: NodeListOf<Element> = usersParentElement.querySelectorAll('User');

		for (var i = 0; i < userElements.length; i++) {
			let userElement: Element = userElements[i];

			let name: string = userElement.getAttribute('name');
			let user: User = new User(name);
			user.color = userElement.getAttribute('color');

			let weightsParentElement = userElement.querySelector('Weights');
			user.setWeightMap(this.parseWeightMap((weightsParentElement)))

			let scoreFunctionsParentElement = userElement.querySelector('ScoreFunctions');
			user.setScoreFunctionMap(this.parseScoreFunctionMap(scoreFunctionsParentElement));

			users.push(user);
		}

		return users;
	}

	parseWeightMap(weightsParentElement: Element): WeightMap {
		var weightMap: WeightMap = new WeightMap();

		var weightElements: NodeListOf<Element> = weightsParentElement.querySelectorAll('Weight');

		for (var i = 0; i < weightElements.length; i++) {
			let weightElement: Element = weightElements[i];
			let objectiveName: string = weightElement.getAttribute('objective');
			let weight: number = +weightElement.getAttribute('value');

			weightMap.setObjectiveWeight(objectiveName, weight);
		}

		return weightMap;
	}

	parseScoreFunctionMap(scoreFunctionsParentElement: Element): ScoreFunctionMap {
		var scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();

		var scoreFunctionElements: NodeListOf<Element> = scoreFunctionsParentElement.querySelectorAll('ScoreFunction');

		for (var i = 0; i < scoreFunctionElements.length; i++) {
			let scoreFunctionElement: Element = scoreFunctionElements[i];

			let objectiveName: string = scoreFunctionElement.getAttribute('objective');
			let scoreFunction: ScoreFunction = this.parseScoreFunction(scoreFunctionElement);

			scoreFunctionMap.setObjectiveScoreFunction(objectiveName, scoreFunction);
		}

		return scoreFunctionMap;
	}

	parseScoreFunction(scoreFunctionElement: Element): ScoreFunction {
		var scoreFunction: ScoreFunction;

		var type: string = scoreFunctionElement.getAttribute('type');
		if (type === 'continuous') {
			scoreFunction = new ContinuousScoreFunction();
		} else {
			scoreFunction = new DiscreteScoreFunction();
		}

		var scoresElement: NodeListOf<Element> = scoreFunctionElement.querySelectorAll('Score');

		for (var i = 0; i < scoresElement.length; i++) {
			let scoreElement: Element = scoresElement[i];

			let score: number = +scoreElement.getAttribute('value');
			let domainElement: string | number = scoreElement.getAttribute('domain-element');

			if (type === 'continuous')
				domainElement = +domainElement;	// Convert to number

			scoreFunction.setElementScore(domainElement, score);
		}

		return scoreFunction;
	}
}






