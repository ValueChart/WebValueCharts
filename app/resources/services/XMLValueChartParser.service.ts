/*
* @Author: aaronpmishkin
* @Date:   2016-05-31 11:04:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-31 18:05:30
*/
// Library Classes
import { Injectable } 				from '@angular/core';

// Model Classes
import { IndividualValueChart } 	from '../model/IndividualValueChart';
import { User }						from '../model/User';
import { WeightMap }				from '../model/WeightMap';
import { Objective } 				from '../model/Objective';
import { PrimitiveObjective } 		from '../model/PrimitiveObjective';
import { AbstractObjective } 		from '../model/AbstractObjective';
import { Alternative } 				from '../model/Alternative'; 
import { ScoreFunctionMap }			from '../model/ScoreFunctionMap';
import { ScoreFunction } 			from '../model/ScoreFunction';
import { ContinuousScoreFunction } 	from '../model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 	from '../model/DiscreteScoreFunction';
import { Domain } 					from '../model/Domain';
import { ContinuousDomain } 		from '../model/ContinuousDomain';
import { DiscreteDomain } 			from '../model/DiscreteDomain';


// @Injectable()
export class XMLValueChartParser {

	xmlDocParser: DOMParser;

	constructor() {
		this.xmlDocParser = new DOMParser();
	}

	parseValueChart(xmlString: string): IndividualValueChart {

		var xmlDocument: Document = this.xmlDocParser.parseFromString(xmlString, 'application/xml');
		var objectiveNodes: any = xmlDocument.querySelector('Criteria');	// Should probably rename the criteria tag to be objectives; 
		var alternativeNodes: any = xmlDocument.querySelector('Alternatives');
		var colorNodess: any = xmlDocument.querySelector('Colors');

		var valueChartName: string = xmlDocument.querySelector('ValueCharts').getAttribute('problem');

		// Description and Creator are not in the XML data files at the moment.
		var valueChart: IndividualValueChart = new IndividualValueChart(valueChartName, '', '');	
		valueChart.setRootObjectives(this.parseObjectives(objectiveNodes.children));
		var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();
		valueChart.setAlternatives(this.parseAlternatives(alternativeNodes, primitiveObjectives));
		valueChart.setUser(this.parseUser(xmlDocument, primitiveObjectives));

		return valueChart;
	}
	// It seems that the type must be declared as any because TypeScript does not recognize the attribute "children" on a DOM element.
	parseObjectives(objectiveNodes: any): Objective[] {
		var parsedObjectives: Objective[] = [];

		for (var i: number = 0; i < objectiveNodes.length; i++) {
			if (objectiveNodes[i].getAttribute('type') === 'abstract') {
				parsedObjectives.push(this.parseAbstractObjective(objectiveNodes[i]));
			} else if (objectiveNodes[i].getAttribute('type') === 'primitive') {
				parsedObjectives.push(this.parsePrimitiveObjective(objectiveNodes[i]));
			}
		}

		return parsedObjectives;
	}

	parseAbstractObjective(abstractObjectiveNodes: any): AbstractObjective {
		var name: string = abstractObjectiveNodes.getAttribute('name');
		// The data files have no description for abstract objectives at the moment.
		var abstractObjective: AbstractObjective = new AbstractObjective(name, '');
		abstractObjective.setDirectSubObjectives(this.parseObjectives(abstractObjectiveNodes.children));
		
		return abstractObjective;
	}

	parsePrimitiveObjective(primitiveObjectiveNodes: any): PrimitiveObjective {
		var name: string = primitiveObjectiveNodes.getAttribute('name');
		var description: string = primitiveObjectiveNodes.querySelector('Description').innerHTML;

		var primitiveObjective: PrimitiveObjective = new PrimitiveObjective(name, description);

		var domainNodes = primitiveObjectiveNodes.querySelector('Domain');

		if (domainNodes.getAttribute('type') === 'continuous') {
			primitiveObjective.setDomain(this.parseContinuousDomain(domainNodes));			
		} else {
			primitiveObjective.setDomain(this.parseDiscreteDomain(domainNodes));	
		}

		return primitiveObjective;
	}

	parseContinuousDomain(domainNodes: any): ContinuousDomain {
		var minValue = +domainNodes.children[0].getAttribute('x');
		var maxValue = +domainNodes.children[domainNodes.children.length - 1].getAttribute('x');

		return new ContinuousDomain(minValue, maxValue);
	}

	parseDiscreteDomain(domainNodes: any): DiscreteDomain {
		var discreteDomain: DiscreteDomain = new DiscreteDomain(false);

		for (var i: number = 0; i < domainNodes.children.length; i++) {
			discreteDomain.addElement(domainNodes.children[i].getAttribute('x'));
		}

		return discreteDomain;
	}

	parseUser(xmlDocument: Document, objectives: PrimitiveObjective[]): User {
		var user: User = new User('temp');
		user.setScoreFunctionMap(new ScoreFunctionMap());
		user.setWeightMap(new WeightMap());

		objectives.forEach((objective: PrimitiveObjective) => {
			var objectiveNode = xmlDocument.querySelector('Criterion[name=' + objective.getName() + ']');
			// The + here allows quick conversion from string to number
			user.getWeightMap().setObjectiveWeight(objective, +objectiveNode.getAttribute('weight'));
			var domainNode: any = objectiveNode.querySelector('Domain');

			var scoreFunction: ScoreFunction;

			if (domainNode.getAttribute('type') === 'continuous') {
				scoreFunction = new ContinuousScoreFunction();
			} else if (domainNode.getAttribute('type') === 'discrete') {
				scoreFunction = new DiscreteScoreFunction();
			}

			for (var i: number = 0; i < domainNode.children.length; i++) {
				let x: number | string = domainNode.children[i].getAttribute('x');
				let y: number = domainNode.children[i].getAttribute('y')
				scoreFunction.setElementScore(x, y);
			}

			user.getScoreFunctionMap().setObjectiveScoreFunction(objective, scoreFunction);
		});

		return user;
	}

	parseAlternatives(alternativeNodes: any, objectives: PrimitiveObjective[]): Alternative[] {

		var alternatives: Alternative[] = [];

		for (var i: number = 0; i < alternativeNodes.children.length; i++) {
			var node: any = alternativeNodes.children[i];
			let alternative: Alternative = new Alternative(node.getAttribute('name'), node.querySelector('Description').innerHTML);

			var valueNodes: any = node.querySelectorAll('AlternativeValue');

			for (var j: number = 0; j < valueNodes.length; j++) {
				let objectiveName: string = valueNodes[j].getAttribute('criterion');
				let mappedValue = valueNodes[j].getAttribute('value');
				let objectiveToMap: PrimitiveObjective = objectives.filter((currentObjective: PrimitiveObjective) => {
					return objectiveName === currentObjective.getName();
				})[0];

				if (objectiveToMap.getDomainType() === 'continuous') {
					mappedValue = +mappedValue;
				}

				alternative.setObjectiveValue(objectiveToMap, mappedValue);
			}
			alternatives.push(alternative);
		}

		return alternatives;
	}
}