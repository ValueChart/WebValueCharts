/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 11:15:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 17:06:11
*/

// Import Libraries
import * as _ 																from 'lodash';

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
	This class parses ValueCharts that have been formatted as XML documents into ValueChart class instances. It parses the ValueChart's alternatives,
	objectives (both abstract and primitive), and users into the proper class instances as a part of this process. This class is inflexible; it 
	expects all XML documents to be complete ValueCharts. It should be expanded to parse XML ValueCharts robustly and will completeness
	checking in the future.

	Note that XmlValueChartParser parses the WebValueCharts XML schema for a ValueChart ONLY. It cannot parse the ValueChartsPlus XML schema
	This is what the XmlLegacyValueChartParser class is for. Because the ValueChartsPlus XML schema is no longer in use, XmlValueChartParser
	is almost always the correct parser to use when handling XML ValueCharts. See the github wiki for more information about 
	the two different XML schemas, or the ValueChartPrototype.xml file for an example of the WebValueCharts XML schema.
*/

export class XmlValueChartParser {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param xmlDocument - A document object created by parsing an XML string using the DOMParser.parseFromString() method. Note that this
							must be a complete ValueChart xml document that satisfies the WebValueCharts XML schema.
		@returns {ValueChart}	- A ValueChart object parsed from the xmlDocument parameter. 
		@description	Parses a ValueChart from an XML document and into the proper class instances so that it can be used by the 
						application. ONLY this method should be called manually when parsing an XML ValueChart; the other methods in the file
						are public helpers.
	*/
	public parseValueChart(xmlDocument: Document): ValueChart {
		var valueChartElement: Element = xmlDocument.querySelector('ValueCharts');

		var valueChartName: string = valueChartElement.getAttribute('name');
		var valueChartCreator: string = valueChartElement.getAttribute('creator');
		var valueChartDescription: string = '';
		var descriptionElement = valueChartElement.querySelector('Description');

		if (descriptionElement)
			valueChartDescription = descriptionElement.innerHTML;

		var valueChart: ValueChart = new ValueChart(valueChartName, valueChartDescription, valueChartCreator);
		valueChart.password = valueChartElement.getAttribute('password');
		let type = (valueChartElement.getAttribute('type') === 'individual') ? ChartType.Individual : ChartType.Group;
		valueChart.setType(type);

		var chartStructureElement: Element = valueChartElement.querySelector('ChartStructure');
		if (chartStructureElement) {
			var objectivesParentElement: Element = chartStructureElement.querySelector('Objectives');
			var alternativesParentElement: Element = chartStructureElement.querySelector('Alternatives');
		}

		valueChart.setRootObjectives(this.parseObjectives(objectivesParentElement));
		valueChart.setAlternatives(this.parseAlternatives(alternativesParentElement, valueChart.getAllPrimitiveObjectives()));

		var usersParentElement: Element = valueChartElement.querySelector('Users');
		valueChart.setUsers(this.parseUsers(usersParentElement, valueChart.getObjectiveNameToIdMap()));

		return valueChart;
	}


	/*
		@param objectivesParentElement - The <Objectives> element from the XML document, or a <Objective> element with type="abstract".
		@returns {Objective[]}	- The root objectives of the ValueChart 
		@description	Parses the hierarchical structure of objectives from an XML document representing a ValueChart.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseObjectives(objectivesParentElement: Element): Objective[] {
		if (!objectivesParentElement)
			return;

		var objectives: Objective[] = [];

		var objectiveElements: Element[] = (<any>objectivesParentElement).children;

		for (var i = 0; i < objectiveElements.length; i++) {

			let objectiveElement: Element = objectiveElements[i];
			
			if (objectiveElement.tagName !== 'Objective')
				continue;

			let objective: Objective;

			let type: string = objectiveElement.getAttribute('type');
			let name: string = objectiveElement.getAttribute('name');

			let description: string = '';
			let descriptionElement = objectiveElement.querySelector('Description');
			if (descriptionElement)
				description = descriptionElement.innerHTML;

			if (type === 'abstract') {
				objective = new AbstractObjective(name, description);
				(<AbstractObjective>objective).setDirectSubObjectives(this.parseObjectives(objectiveElement));
			} else {			
				objective = new PrimitiveObjective(name, description);

				let color: string = objectiveElement.getAttribute('color');
				(<PrimitiveObjective>objective).setColor(color);

				let domainElement: Element = objectiveElement.querySelector('Domain');
				(<PrimitiveObjective>objective).setDomain(this.parseDomain(domainElement));

				let defaultScoreFunctionElement: Element = objectiveElement.querySelector('DefaultScoreFunction');
				if (defaultScoreFunctionElement) {
					(<PrimitiveObjective>objective).setDefaultScoreFunction(this.parseScoreFunction(defaultScoreFunctionElement));
				}
			}
			objectives.push(objective);
		}

		return objectives;
	}

	/*
		@param domainElement - The <Domain> element for one PrimitiveObjective in a ValueChart's XML document. This element contains the domain information for a single Objective.
		@returns {Domain}	- A domain object constructed from the information stored in the given <Domain> element.
		@description	Parses a <Domain> element to construct a Domain object of the right type for a Primitive Objective. 
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseDomain(domainElement: Element): Domain {
		if (!domainElement)
			return new CategoricalDomain(false);	// No Domain was provided; return an empty categorical domain.

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
			let categoryElements = domainElement.children;
			for (var i = 0; i < categoryElements.length; i++) {
				(<CategoricalDomain>domain).addElement(categoryElements[i].innerHTML);
			}
		} else if (type === 'interval') {
			let min: number = +domainElement.getAttribute('min');
			let max: number = +domainElement.getAttribute('max');
			let interval: number = +domainElement.getAttribute('interval');

			domain = new IntervalDomain(min, max, interval);
		}

		return domain;
	}

	/*
		@param alternativesParentElement - The <Alternatives> element from the ValueChart's XML document. This element contains all of the ValueChart's alternatives as children.
		@param primitiveObjectives - The array of primitiveObjective objects belonging to the ValueChart that is being parsed. These MUST correlate properly
									with the objective names in the <Alternative> elements being parsed.
		@returns {Alternative[]}	- An array of Alternative objects constructed from the children of The <Alternatives> element.
		@description	Parses an <Alternatives> element from a ValueChart's XML document to obtain the array of Alternatives belonging to the ValueChart.
						This method will also update the domains of the objectives in array of PrimitiveObjectives given as a parameter as it parses the
						alternatives. This updating is done in-place.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseAlternatives(alternativesParentElement: Element, primitiveObjectives: PrimitiveObjective[]): Alternative[] {
		if (!alternativesParentElement)
			return;

		var alternatives: Alternative[] = [];

		var alternativeElements: NodeListOf<Element> = alternativesParentElement.querySelectorAll('Alternative');

		for (var i = 0; i < alternativeElements.length; i++) {
			let alternativeElement: Element = alternativeElements[i];

			let name: string = alternativeElement.getAttribute('name');
			let descriptionElement = alternativeElement.querySelector('Description');
			let description: string = '';
			if (descriptionElement)
				description = descriptionElement.innerHTML;

			let alternative: Alternative = new Alternative(name, description);

			let alternativeValueElements: NodeListOf<Element> = alternativeElement.querySelectorAll('AlternativeValue');

			for (var j = 0; j < alternativeValueElements.length; j++) {
				let alternativeValueElement: Element = alternativeValueElements[j];

				let objectiveName: string = alternativeValueElement.getAttribute('objective');
				let domainValue: string | number = alternativeValueElement.getAttribute('value');

				let correspondingObjective: PrimitiveObjective = primitiveObjectives.find((objective: PrimitiveObjective) => {
 					return objective.getName() === objectiveName;
 				});
 				if (correspondingObjective.getDomainType() === 'continuous')
 					domainValue = +domainValue;

				alternative.setObjectiveValue(correspondingObjective.getId(), domainValue);
			}

			alternatives.push(alternative);
		}

		return alternatives;
	}

	/*
		@param usersParentElement - The <Users> element from the ValueChart's XML document. This element contains all of the ValueChart's users as children.
		@param nameToIdMap - A map from Objective names to ids.
		@returns {User[]}	- An array of User objects constructed from the children of The <Users> element.
		@description	Parses a <Users> element from a ValueChart's XML document to obtain the array of Users belonging to the ValueChart.
						This method will parse the ScoreFunctionMap, WeightMap, and ScoreFunctions of each <User> element that is a 
						child of the provided <Users> element to produce complete user objects.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseUsers(usersParentElement: Element, nameToIdMap: {[objName: string]: string}): User[] {
		if (!usersParentElement)
			return; 

		var users: User[] = [];

		var userElements: NodeListOf<Element> = usersParentElement.querySelectorAll('User');

		for (var i = 0; i < userElements.length; i++) {
			let userElement: Element = userElements[i];

			let name: string = userElement.getAttribute('name');
			let user: User = new User(name);
			user.color = userElement.getAttribute('color');

			let weightsParentElement = userElement.querySelector('Weights');
			user.setWeightMap(this.parseWeightMap(weightsParentElement, nameToIdMap));

			let scoreFunctionsParentElement = userElement.querySelector('ScoreFunctions');
			user.setScoreFunctionMap(this.parseScoreFunctionMap(scoreFunctionsParentElement, nameToIdMap));

			users.push(user);
		}

		return users;
	}

	/*
		@param weightsParentElement - The <Weights> element for one user in a ValueChart's XML document. This element contains all of a user's weights as child elements.
		@param nameToIdMap - A map from Objective names to ids.
		@returns {WeightMap}	- A WeightMap object created from the <Weight> elements that are children of the provided weightsParentElement.
		@description	Parses a <Weights> element from a ValueChart's XML document to obtain a WeightMap.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseWeightMap(weightsParentElement: Element, nameToIdMap: {[objName: string]: string}): WeightMap {
		if (!weightsParentElement)
			return; 

		var weightMap: WeightMap = new WeightMap();

		var weightElements: NodeListOf<Element> = weightsParentElement.querySelectorAll('Weight');

		for (var i = 0; i < weightElements.length; i++) {
			let weightElement: Element = weightElements[i];
			let objectiveName: string = weightElement.getAttribute('objective');
			let weight: number = +weightElement.getAttribute('value');

			weightMap.setObjectiveWeight(nameToIdMap[objectiveName], weight);
		}

		return weightMap;
	}

	/*
		@param scoreFunctionsParentElement - The <ScoreFunctions> element for one user in a ValueChart's XML document. This element contains all of a user's score functions as child elements.
		@param nameToIdMap - A map from Objective names to ids.
		@returns {ScoreFunctionMap}	- A ScoreFunctionMap object created by parsing the provided scoreFunctionsParentElement.
		@description	Parses a <ScoreFunctions> element from a ValueChart's XML document to obtain a ScoreFunctionMap. Note that the ScoreFunctions within
						the map are parsed as a part of this methods execution.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseScoreFunctionMap(scoreFunctionsParentElement: Element, nameToIdMap: {[objName: string]: string}): ScoreFunctionMap {
		if (!scoreFunctionsParentElement)
			return;

		var scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();

		var scoreFunctionElements: NodeListOf<Element> = scoreFunctionsParentElement.querySelectorAll('ScoreFunction');

		for (var i = 0; i < scoreFunctionElements.length; i++) {
			let scoreFunctionElement: Element = scoreFunctionElements[i];

			let objectiveName: string = scoreFunctionElement.getAttribute('objective');
			let scoreFunction: ScoreFunction = this.parseScoreFunction(scoreFunctionElement);

			scoreFunctionMap.setObjectiveScoreFunction(nameToIdMap[objectiveName], scoreFunction);
		}

		return scoreFunctionMap;
	}

	/*
		@param scoreFunctionsParentElement - A <ScoreFunction> element from the ValueChart's XML document. 
		@returns {ScoreFunction}	- A ScoreFunctionMap object created by parsing the provided scoreFunctionsParentElement.
		@description	Parses a <ScoreFunction> element from a ValueChart's XML document to obtain a ScoreFunction.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseScoreFunction(scoreFunctionElement: Element): ScoreFunction {
		if (!scoreFunctionElement)
			return; 
		
		var scoreFunction: ScoreFunction;

		var type: string = scoreFunctionElement.getAttribute('type');
		if (type === 'continuous') {
			scoreFunction = new ContinuousScoreFunction();
		} else {
			scoreFunction = new DiscreteScoreFunction();
		}

		var immutable: string = scoreFunctionElement.getAttribute('immutable');
		scoreFunction.immutable = immutable === 'true' ? true : false;

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






