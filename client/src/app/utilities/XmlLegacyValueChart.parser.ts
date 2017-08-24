/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 11:15:36
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:40:40
*/

// Import Model Classes:
import { ValueChart }														from '../../model';
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
import { ContinuousDomain } 												from '../../model';
import { CategoricalDomain } 												from '../../model';

/*
	This class parses ValueCharts that have been formatted as XML documents into ValueChart class instances. It parses the ValueChart's alternatives,
	objectives (both abstract and primitive), and users into the proper class instances as a part of this process. This class is inflexible; it 
	expects all XML documents to be complete ValueCharts. It should be expanded to parse XML ValueCharts robustly and will completeness
	checking in the future.

	XmlLegacyValueChartParser parses the ValueChartsPlus XML schema for a ValueChart ONLY. It cannot parse the WebValueCharts XML schema
	This is what the XmlValueChartParser class is for. The ValueChartsPlus XML schema for ValueCharts is no longer in use, and this class only
	exists to allow for "legacy" support of the old format. New ValueCharts should NOT be created in this format, and ValueChartParser should
	almost always be used instead of ValueChartLegacyParser.See the github wiki for more information about 
	the two different XML schemas, or the hotel.xml file for an example of the ValueChartsPlus XML schema.
*/

export class XmlLegacyValueChartParser {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param xmlDocument - A document object created by parsing an XML string using the DOMParser.parseFromString() method. Note that this
							must be a complete ValueChart xml document that satisfies the ValueChartsPlus XML schema.
		@returns {ValueChart}	- A ValueChart object parsed from the xmlDocument parameter. 
		@description	Parses a ValueChart from an XML document and into the proper class instances so that it can be used by the 
						application. ONLY this method should be called manually when parsing an XML ValueChart; the other methods in the file
						are public helpers.
	*/
	public parseValueChart(xmlDocument: Document): ValueChart {

		var objectivesParentElement: Element = xmlDocument.querySelector('Criteria');
		var alternativesParentElement: Element = xmlDocument.querySelector('Alternatives');
		var valueChartName: string = xmlDocument.querySelector('ValueCharts').getAttribute('problem');

		var valueChart: ValueChart = new ValueChart(valueChartName, '', '');

		valueChart.setRootObjectives(this.parseObjectives(<Element[]>(<any>objectivesParentElement).children));

		var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();

		valueChart.setAlternatives(this.parseAlternatives((<any>alternativesParentElement).children, primitiveObjectives));

		valueChart.setUsers([this.parseUser(xmlDocument, primitiveObjectives)]);

		this.setObjectiveColors(xmlDocument, primitiveObjectives);

		return valueChart;
	}


	/*
		@param objectiveElements - The <Criterion> elements that are direct children of the <Criteria> element in the ValueChart's XML document, 
									or the child <Criterion> elements of any abstract <Criterion>.
		@returns {Objective[]}	- The root objectives of the ValueChart 
		@description	Parses the hierarchical structure of objectives from an XML document representing a ValueChart.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseObjectives(objectiveElements: Element[]): Objective[] {
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

	/*
		@param abstractObjectiveElement - A <Criterion> element with type="abstract".
		@returns {AbstractObjective}	- An AbstractObjective object parsed from the given element. 
		@description	Parses an abstract objective element from a ValueChart's XML document, including all of the element's children. 
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseAbstractObjective(abstractObjectiveElement: Element): AbstractObjective {
		var name: string = abstractObjectiveElement.getAttribute('name');
		// The data files have no description for abstract objectives at the moment.
		var abstractObjective: AbstractObjective = new AbstractObjective(name, '');
		abstractObjective.setDirectSubObjectives(this.parseObjectives((<any>abstractObjectiveElement).children));

		return abstractObjective;
	}

	/*
		@param primitiveObjectiveElement - A <Criterion> element with type="primitive".
		@returns {PrimitiveObjective}	- An PrimitiveOjective object parsed from the given element. 
		@description	Parses an primitive objective element from a ValueChart's XML document.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parsePrimitiveObjective(primitiveObjectiveElement: Element): PrimitiveObjective {
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

	/*
		@param domainElement - The <Domain> element with type="continuous" for one PrimitiveObjective in a ValueChart's XML document. This element contains the domain information for a single Objective.
		@returns {ContinuousDomain}	- A ContinuousDomain object constructed from the information stored in the given <Domain> element.
		@description	Parses a <Domain> element to construct a ContinuousDomain object for a Primitive Objective. 
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseContinuousDomain(domainElement: Element): ContinuousDomain {
		var minValue = +(<any>domainElement).children[0].getAttribute('x');
		var maxValue = +(<any>domainElement).children[(<any>domainElement).children.length - 1].getAttribute('x');

		return new ContinuousDomain(minValue, maxValue);
	}

	/*
		@param domainElement - The <Domain> element with type="discrete" for one PrimitiveObjective in a ValueChart's XML document. This element contains the domain information for a single Objective.
		@returns {ContinuousDomain}	- A CategoricalDomain object constructed from the information stored in the given <Domain> element.
		@description	Parses a <Domain> element to construct a CategoricalDomain object for a Primitive Objective. 
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseCategoricalDomain(domainElement: Element): CategoricalDomain {
		var categoricalDomain: CategoricalDomain = new CategoricalDomain(false);

		for (var i: number = 0; i < (<any>domainElement).children.length; i++) {
			categoricalDomain.addElement((<any>domainElement).children[i].getAttribute('x'));
		}

		return categoricalDomain;
	}

	/*
		@param xmlDocument - A document object created by parsing an XML string using the DOMParser.parseFromString() method. Note that this
							must be a complete ValueChart xml document that satisfies the ValueChartsPlus XML schema.
		@param objectives - The array of primitiveObjective objects belonging to the ValueChart that is being parsed.
		@returns {User}	- A User object constructed from the preferences stored in the ValueChart's XMl document. 
		@description	Parses a User object form the preferences stored in the ValueChart's XMl document. Note that these preferences
						are not stored within a single element in the ValueChartsPlus schema, but rather are stored within the <Criterion> elements.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseUser(xmlDocument: Document, objectives: PrimitiveObjective[]): User {
		var user: User = new User('temp');
		user.setScoreFunctionMap(new ScoreFunctionMap());
		user.setWeightMap(new WeightMap());

		objectives.forEach((objective: PrimitiveObjective) => {
			var objectiveElement = xmlDocument.querySelector('Criterion[name="' + objective.getName() + '"]');
			// The + here allows quick conversion from string to number
			user.getWeightMap().setObjectiveWeight(objective.getId(), +objectiveElement.getAttribute('weight'));
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

			user.getScoreFunctionMap().setObjectiveScoreFunction(objective.getId(), scoreFunction);
		});

		return user;
	}

	/*
		@param alternativeElements - The <Alternative> elements from the ValueChart's XML document. 
		@param objectives - The array of primitiveObjective objects belonging to the ValueChart that is being parsed. These MUST correlate properly
									with the objective names in the <Alternative> elements being parsed.
		@returns {Alternative[]}	- An array of Alternative objects constructed from the children of the array of <Alternative> elements.
		@description	Parses the <Alternative> elements from a ValueChart's XML document to obtain the array of Alternatives belonging to the ValueChart.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public parseAlternatives(alternativeElements: Element[], objectives: PrimitiveObjective[]): Alternative[] {

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

				alternative.setObjectiveValue(objectiveToMap.getId(), mappedValue);
			}
			alternatives.push(alternative);
		}

		return alternatives;
	}

	/*
		@param xmlDocument - A document object created by parsing an XML string using the DOMParser.parseFromString() method. Note that this
							must be a complete ValueChart xml document that satisfies the ValueChartsPlus XML schema.
		@param objectives - The array of primitiveObjective objects belonging to the ValueChart that is being parsed.
		@returns {void}	- An array of Alternative objects constructed from the children of the array of <Alternative> elements.
		@description	Parses the objectives colors from the xmlDocument parameter and updates each objective in the array of 
						given PrimitiveObjectives to have its assigned color.
						Note that this method should NEVER be called manually. All parsing should be initiated using parseValueChart.
	*/
	public setObjectiveColors(xmlDocument: Document, objectives: PrimitiveObjective[]): void {
		objectives.forEach((objective: PrimitiveObjective) => {
			let color: Element = xmlDocument.querySelector('Color[name="' + objective.getName() + '"]');
			objective.setColor('rgb(' + color.getAttribute('r') + ', ' + color.getAttribute('g') + ', ' + color.getAttribute('b') + ')');
		});
	}

}