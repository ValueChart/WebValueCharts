/*
* @Author: aaronpmishkin
* @Date:   2016-06-30 16:45:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-02 13:09:34
*/

// Model Classes
import { ValueChart } 														from '../model/ValueChart';
import { IndividualValueChart } 											from '../model/IndividualValueChart';
import { GroupValueChart } 													from '../model/GroupValueChart';
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


export class ValueChartXMLEncoder {

	serializer: XMLSerializer;


	constructor() { 
		this.serializer = new XMLSerializer();
	}

	encodeValueChart(valueChart: ValueChart): string {
		var xmlDocument: XMLDocument = document.implementation.createDocument(null, null, null);
		var xmlProcessingInstruction = xmlDocument.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8" standalone="no"');
		xmlDocument.appendChild(xmlProcessingInstruction);

		var valueChartElement: Element = this.convertValueChartIntoElement(valueChart, xmlDocument);
		xmlDocument.appendChild(valueChartElement);
		var valueChartXMLString: string = this.serializer.serializeToString(xmlDocument);
		
		return valueChartXMLString;
	}

	convertValueChartIntoElement(valueChart: ValueChart, xmlDocument: XMLDocument): Element {
		var valueChartElement: Element = xmlDocument.createElement('ValueCharts');

		valueChartElement.setAttribute('name', valueChart.getName());
		valueChartElement.setAttribute('creator', valueChart.getCreator());
		valueChartElement.setAttribute('version', '2.0');

		var chartStructureElement: Element = xmlDocument.createElement('ChartStructure');
		valueChartElement.appendChild(chartStructureElement);

		var objectivesParentElement: Element = xmlDocument.createElement('Objectives');
		chartStructureElement.appendChild(objectivesParentElement);

		valueChart.getRootObjectives().forEach((objective: Objective) => {
			objectivesParentElement.appendChild(this.convertObjectiveIntoElement(objective, xmlDocument));
		});	

		chartStructureElement.appendChild(this.convertAlternativesIntoElement(valueChart.getAlternatives(), xmlDocument));

		valueChartElement.appendChild(this.convertUsersIntoElement([(<IndividualValueChart> valueChart).getUser()], xmlDocument));

		return valueChartElement;
	}

	convertObjectiveIntoElement(objective: Objective, xmlDocument: XMLDocument): Element {
		var objectiveElement = xmlDocument.createElement('Objective');
		objectiveElement.setAttribute('name', objective.getName());
		objectiveElement.setAttribute('type', objective.objectiveType);

		if (objective.objectiveType === 'abstract') {
			(<AbstractObjective> objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				objectiveElement.appendChild(this.convertObjectiveIntoElement(subObjective, xmlDocument));
			});
		} else {
			objectiveElement.setAttribute('color', (<PrimitiveObjective> objective).getColor());
			objectiveElement.appendChild(this.convertDomainIntoElement((<PrimitiveObjective> objective).getDomain(), xmlDocument));

			let descriptionElement: Element = xmlDocument.createElement('Description');
			descriptionElement.innerHTML = objective.getDescription();
			objectiveElement.appendChild(descriptionElement);
		}

		return objectiveElement;
	}

	convertDomainIntoElement(domain: Domain, xmlDocument: XMLDocument): Element {
		var domainElement: Element = xmlDocument.createElement('Domain');
		domainElement.setAttribute('type', domain.type);

		if (domain.type === 'continuous') {
			domainElement.setAttribute('unit', (<ContinuousDomain> domain).unit);
			domainElement.setAttribute('min', '' + (<ContinuousDomain> domain).getMinValue());
			domainElement.setAttribute('max', '' + (<ContinuousDomain> domain).getMaxValue());
		} else if (domain.type === 'categorical') {
			domainElement.setAttribute('ordered', '' + (<CategoricalDomain> domain).ordered);
		} else if (domain.type === 'interval') {
			domainElement.setAttribute('interval', '' + (<IntervalDomain> domain).getInterval());
			domainElement.setAttribute('min', '' + (<IntervalDomain> domain).getMinValue());
			domainElement.setAttribute('max', '' + (<IntervalDomain> domain).getMaxValue());
		}

		return domainElement;
	}

	convertAlternativesIntoElement(alternatives: Alternative[], xmlDocument: XMLDocument): Element {
		var alternativesParentElement: Element = xmlDocument.createElement('Alternatives');

		alternatives.forEach((alternative: Alternative) => {
			let alternativeElement = xmlDocument.createElement('Alternative');
			alternativeElement.setAttribute('name', alternative.getName());

			let objectiveValuePairs: {objectiveName: string, value: string | number}[]  = alternative.getAllObjectiveValuePairs();

			objectiveValuePairs.forEach((pair: {objectiveName: string, value: string | number}) => {
				let alternativeValueElement: Element = xmlDocument.createElement('AlternativeValue');

				alternativeValueElement.setAttribute('objective', pair.objectiveName);
				alternativeValueElement.setAttribute('value', '' + pair.value);

				alternativeElement.appendChild(alternativeValueElement);
			});

			let descriptionElement: Element = xmlDocument.createElement('Description');
			descriptionElement.innerHTML = alternative.getDescription();
			alternativeElement.appendChild(descriptionElement);

			alternativesParentElement.appendChild(alternativeElement);
		});

		return alternativesParentElement;
	}

	convertUsersIntoElement(users: User[], xmlDocument: XMLDocument): Element {
		var usersParentElement: Element = xmlDocument.createElement('Users');

		users.forEach((user: User) => {
			let userElement: Element = xmlDocument.createElement('User');
			userElement.setAttribute('name', user.getUsername());
			userElement.appendChild(this.convertWeightMapIntoElement(user.getWeightMap(), xmlDocument));
			userElement.appendChild(this.convertScoreFunctionMapIntoElement(user.getScoreFunctionMap(), xmlDocument));

			usersParentElement.appendChild(userElement);
		});

		return usersParentElement;
	}

	convertWeightMapIntoElement(weightMap: WeightMap, xmlDocument: XMLDocument): Element {
		var weightsParentElement: Element = xmlDocument.createElement('Weights');

		var map: Map<string, number> = weightMap.getInternalWeightMap();

		var mapIterator: Iterator<string> = map.keys();
		var iteratorElement: IteratorResult<string> = mapIterator.next();

		while (iteratorElement.done === false) {
			let weightElement: Element = xmlDocument.createElement('Weight');
			weightElement.setAttribute('objective', iteratorElement.value);
			weightElement.setAttribute('value','' + weightMap.getNormalizedObjectiveWeight(iteratorElement.value));

			weightsParentElement.appendChild(weightElement);
			iteratorElement = mapIterator.next();
		}

		return weightsParentElement;
	}

	convertScoreFunctionMapIntoElement(scoreFunctionMap: ScoreFunctionMap, xmlDocument: XMLDocument): Element {
		var scoreFunctionsParentElement: Element = xmlDocument.createElement('ScoreFunctions');

		var scoreFunctionKeyPairs: {key: string, scoreFunction: ScoreFunction}[] = scoreFunctionMap.getAllKeyScoreFunctionPairs();	
		
		scoreFunctionKeyPairs.forEach((pair: {key: string, scoreFunction: ScoreFunction}) => {
			let scoreFunctionElement = this.convertScoreFunctionIntoElement(pair.scoreFunction, pair.key, xmlDocument);
			scoreFunctionsParentElement.appendChild(scoreFunctionElement);
		});

		return scoreFunctionsParentElement;
	}

	convertScoreFunctionIntoElement(scoreFunction: ScoreFunction, objectiveName: string, xmlDocument: XMLDocument): Element {
		var scoreFunctionElement: Element = xmlDocument.createElement('ScoreFunction');
		scoreFunctionElement.setAttribute('objective', objectiveName);
		scoreFunctionElement.setAttribute('type', scoreFunction.type);

		var domainValues: (string | number)[] = scoreFunction.getAllElements();

		domainValues.forEach((domainValue: string | number) => {
			let scoreElement: Element = xmlDocument.createElement('Score');

			scoreElement.setAttribute('value', '' + scoreFunction.getScore(domainValue));
			scoreElement.setAttribute('domain-element', '' + domainValue);

			scoreFunctionElement.appendChild(scoreElement);
		});

		return scoreFunctionElement;
	}
}









