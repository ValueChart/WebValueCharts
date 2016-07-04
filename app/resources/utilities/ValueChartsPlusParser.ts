/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 11:15:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-29 11:48:43
*/

// Model Classes
import { IndividualValueChart } 											from '../model/IndividualValueChart';
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
import { ContinuousDomain } 												from '../model/ContinuousDomain';
import { CategoricalDomain } 												from '../model/CategoricalDomain';

export class ValueChartsPlusParser {

	constructor() { }

	parseValueChart(xmlDocument: Document): IndividualValueChart {

		var objectivesParentElement: Element = xmlDocument.querySelector('Criteria');	
		var alternativesParentElement: Element = xmlDocument.querySelector('Alternatives');
		var valueChartName: string = xmlDocument.querySelector('ValueCharts').getAttribute('problem');

		var valueChart: IndividualValueChart = new IndividualValueChart(valueChartName, '', '');	

		valueChart.setRootObjectives(this.parseObjectives(<Element[]> (<any> objectivesParentElement).children));

		var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();

		valueChart.setAlternatives(this.parseAlternatives((<any> alternativesParentElement).children, primitiveObjectives));

		valueChart.setUser(this.parseUser(xmlDocument, primitiveObjectives));

		this.setObjectiveColors(xmlDocument, primitiveObjectives);

		return valueChart;
	}
	
	parseObjectives(objectiveElements: Element[]): Objective[] {
		var parsedObjectives: Objective[] = [];

		for (var i: number = 0; i < objectiveElements.length; i++) {
			if (objectiveElements[i].getAttribute('type') === 'abstract') {
				parsedObjectives.push(this.parseAbstractObjective(objectiveElements[i]));
			} else if (objectiveElements[i].getAttribute('type') === 'primitive') {
				parsedObjectives.push(this.parsePrimitiveObjective(objectiveElements[i]));
			}
		}

		return parsedObjectives;
	}

	parseAbstractObjective(abstractObjectiveElement: Element): AbstractObjective {
		var name: string = abstractObjectiveElement.getAttribute('name');
		// The data files have no description for abstract objectives at the moment.
		var abstractObjective: AbstractObjective = new AbstractObjective(name, '');
		abstractObjective.setDirectSubObjectives(this.parseObjectives((<any> abstractObjectiveElement).children));
		
		return abstractObjective;
	}

	parsePrimitiveObjective(primitiveObjectiveElement: Element): PrimitiveObjective {
		var name: string = primitiveObjectiveElement.getAttribute('name');
		if (primitiveObjectiveElement.querySelector('Description'))
			var description: string = primitiveObjectiveElement.querySelector('Description').innerHTML;

		var primitiveObjective: PrimitiveObjective = new PrimitiveObjective(name, description);

		var domainElements = primitiveObjectiveElement.querySelector('Domain');

		if (domainElements.getAttribute('type') === 'continuous') {
			primitiveObjective.setDomain(this.parseContinuousDomain(domainElements));			
		} else {
			primitiveObjective.setDomain(this.parseCategoricalDomain(domainElements));	
		}

		return primitiveObjective;
	}

	parseContinuousDomain(domainElement: Element): ContinuousDomain {
		var minValue = +(<any> domainElement).children[0].getAttribute('x');
		var maxValue = +(<any>domainElement).children[(<any> domainElement).children.length - 1].getAttribute('x');

		return new ContinuousDomain(minValue, maxValue);
	}

	parseCategoricalDomain(domainElement: Element): CategoricalDomain {
		var categoricalDomain: CategoricalDomain = new CategoricalDomain(false);

		for (var i: number = 0; i < (<any> domainElement).children.length; i++) {
			categoricalDomain.addElement((<any> domainElement).children[i].getAttribute('x'));
		}

		return categoricalDomain;
	}

	parseUser(xmlDocument: Document, objectives: PrimitiveObjective[]): User {
		var user: User = new User('temp');
		user.setScoreFunctionMap(new ScoreFunctionMap());
		user.setWeightMap(new WeightMap());

		objectives.forEach((objective: PrimitiveObjective) => {
			var objectiveElement = xmlDocument.querySelector('Criterion[name=' + objective.getName() + ']');
			// The + here allows quick conversion from string to number
			user.getWeightMap().setObjectiveWeight(objective.getName(), +objectiveElement.getAttribute('weight'));
			var domainElement: any = objectiveElement.querySelector('Domain');

			var scoreFunction: ScoreFunction;

			if (domainElement.getAttribute('type') === 'continuous') {
				scoreFunction = new ContinuousScoreFunction();
			} else if (domainElement.getAttribute('type') === 'discrete') {
				scoreFunction = new DiscreteScoreFunction();
			}

			for (var i: number = 0; i < domainElement.children.length; i++) {
				let x: number | string;
				if (domainElement.getAttribute('type') === 'continuous') {
					x = +domainElement.children[i].getAttribute('x');
				} else if (domainElement.getAttribute('type') === 'discrete') {
					x = domainElement.children[i].getAttribute('x');
				}
				let y: number = +domainElement.children[i].getAttribute('y')
				scoreFunction.setElementScore(x, y);
			}

			user.getScoreFunctionMap().setObjectiveScoreFunction(objective.getName(), scoreFunction);
		});

		return user;
	}

	parseAlternatives(alternativeElements: Element[], objectives: PrimitiveObjective[]): Alternative[] {

		var alternatives: Alternative[] = [];

		for (var i: number = 0; i < alternativeElements.length; i++) {
			var element: any = alternativeElements[i];
			var description: string;

			if (element.querySelector('Description'))
				description = element.querySelector('Description').innerHTML;
			else
				description = '';
			let alternative: Alternative = new Alternative(element.getAttribute('name'), description);

			var valueElements: any = element.querySelectorAll('AlternativeValue');

			for (var j: number = 0; j < valueElements.length; j++) {
				let objectiveName: string = valueElements[j].getAttribute('criterion');
				let mappedValue: string | number = valueElements[j].getAttribute('value');
				let objectiveToMap: PrimitiveObjective = objectives.filter((currentObjective: PrimitiveObjective) => {
					return objectiveName === currentObjective.getName();
				})[0];

				if (objectiveToMap.getDomainType() === 'continuous') {
					mappedValue = +mappedValue;
				}

				alternative.setObjectiveValue(objectiveToMap.getName(), mappedValue);
			}
			alternatives.push(alternative);
		}

		return alternatives;
	}

	setObjectiveColors(xmlDocument: Document, objectives: PrimitiveObjective[]): void {
		objectives.forEach((objective: PrimitiveObjective) => {
			let color: Element = xmlDocument.querySelector('Color[name=' + objective.getName() + ']');
			objective.setColor('rgb(' + color.getAttribute('r') + ', ' + color.getAttribute('g') + ', ' + color.getAttribute('b') + ')');
		});
	}

}