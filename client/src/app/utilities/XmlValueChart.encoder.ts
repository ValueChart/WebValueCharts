/*
* @Author: aaronpmishkin
* @Date:   2016-06-30 16:45:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 17:06:36
*/

// Import Model Classes:
import { ValueChart } 														from '../../model';
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
	This class encodes an instance of the ValueChart class into an XML string using the WebValueCharts schema. It converts all aspects
	of a ValueChart into the proper XML representations including alternatives, the objective hierarchy, and users. XML ValueCharts
	can be exported as documents and saved locally by users with the intent of being used again later. Exporting ValueCharts that have
	been encoded as XML by this class is accomplished by the ExportValueChartComponent class. 

	See the wiki for more information about the WebValueCharts schema, or ValueChartPrototype.xml for an example of a ValueChart that
	has been encoded into XML.
*/

export class XmlValueChartEncoder {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private serializer: XMLSerializer;		// An instance of the built-in serializer class used to convert XML document objects into strings.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor() {
		this.serializer = new XMLSerializer();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param valueChart - The ValueChart object that is to be encoded into an XML string representation. 
		@returns {string} - An XML string representation of the given ValueChart.
		@description	Encodes a given ValueChart into an XML string. ONLY this method should be called manually when encoding a ValueChart to XML.
	*/
	public encodeValueChart(valueChart: ValueChart): string {
		var xmlDocument: XMLDocument = document.implementation.createDocument(null, null, null);	// Create a new XML document.

		// Set the XML version header.
		var xmlProcessingInstruction = xmlDocument.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8" standalone="no"');
		xmlDocument.appendChild(xmlProcessingInstruction);

		var valueChartElement: Element = this.convertValueChartIntoElement(valueChart, xmlDocument);	// Encode the entire ValueChart.
		xmlDocument.appendChild(valueChartElement);														// Append the ValueCHart element to the document.

		var valueChartXMLString: string = this.serializer.serializeToString(xmlDocument);	// Convert the XML document into a string.

		return valueChartXMLString;
	}

	/*
		@param valueChart - The ValueChart object whose User defined weights are to be encoded into a CSV string. 
		@returns {string} - A CSV string of the User defined weights from the given ValueChart.
		@description	Encodes the weights assigned by each User in the given ValueChart to each PrimitiveObjective as a
						CSV string. The first row of the string encodes the objectives names (used as columns). Each subsequent
						row encodes the weight assignments of one user in the given ValueChart.
	*/
	public encodeUserWeights(valueChart: ValueChart): string {
		var csvOutput: string = 'username,';	// The first column is username.
		var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();	

		primitiveObjectives.forEach((objective: PrimitiveObjective) => {
			csvOutput = csvOutput + objective.getName() + ',';	// The rest of the columns are objectives.
		});

		csvOutput = csvOutput + '\n';	// Add a return line character after the row of objective names.

		valueChart.getUsers().forEach((user: User) => {
			csvOutput = csvOutput + user.getUsername() + ',';	// Add the user's username to the CSV string in the first column.
			primitiveObjectives.forEach((objective: PrimitiveObjective) => {
				csvOutput = csvOutput + user.getWeightMap().getNormalizedObjectiveWeight(objective.getId()) + ',';	// Add the user's weights.
			});
			csvOutput = csvOutput + '\n'; // Add a return line character after each user's row.
		});

		return csvOutput;
	}

	/*
		@param valueChart - The ValueChart object that is to be encoded into an XML string representation. 
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@returns {Element} - An XML element representing the ValueChart that was provided. 
		@description	Encodes a ValueChart and all its fields as an XML element. 
	*/
	public convertValueChartIntoElement(valueChart: ValueChart, xmlDocument: XMLDocument): Element {
		var valueChartElement: Element = xmlDocument.createElement('ValueCharts');

		valueChartElement.setAttribute('name', valueChart.getName());
		valueChartElement.setAttribute('creator', valueChart.getCreator());
		valueChartElement.setAttribute('version', '2.0');
		
		let type = valueChart.isIndividual() ? 'individual' : 'group';
		valueChartElement.setAttribute('type', type);

		if (valueChart.password) {
			valueChartElement.setAttribute('password', valueChart.password);
		}

		let descriptionElement: Element = xmlDocument.createElement('Description');
		descriptionElement.innerHTML = valueChart.getDescription();
		valueChartElement.appendChild(descriptionElement);

		var chartStructureElement: Element = xmlDocument.createElement('ChartStructure');
		valueChartElement.appendChild(chartStructureElement);

		var objectivesParentElement: Element = xmlDocument.createElement('Objectives');
		chartStructureElement.appendChild(objectivesParentElement);

		// Encode the objective hierarchy.
		valueChart.getRootObjectives().forEach((objective: Objective) => {
			objectivesParentElement.appendChild(this.convertObjectiveIntoElement(objective, xmlDocument, valueChart.isIndividual()));
		});

		// Encode the alternatives.
		chartStructureElement.appendChild(this.convertAlternativesIntoElement(valueChart.getAlternatives(), xmlDocument, valueChart.getObjectiveIdToNameMap()));

		// Encode the users.
		valueChartElement.appendChild(this.convertUsersIntoElement(valueChart.getUsers(), xmlDocument, valueChart.getObjectiveIdToNameMap()));

		return valueChartElement;
	}

	/*
		@param objective - The Objective object that is to be encoded into an XML element. This may be either an AbstractObjective or a PrimitiveObjective. 
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param isIndividual - Whether this is an individual chart (as opposed to a group chart).
		@returns {Element} - An XML element representing the objective that was provided. 
		@description	Encodes an objective and all its fields (including any subobjectives) as an XML element. 
	*/
	public convertObjectiveIntoElement(objective: Objective, xmlDocument: XMLDocument, isIndividual: boolean): Element {
		var objectiveElement = xmlDocument.createElement('Objective');
		objectiveElement.setAttribute('name', objective.getName());
		objectiveElement.setAttribute('type', objective.objectiveType);
		
		let descriptionElement: Element = xmlDocument.createElement('Description');
		descriptionElement.innerHTML = objective.getDescription();
		objectiveElement.appendChild(descriptionElement);

		if (objective.objectiveType === 'abstract') {
			(<AbstractObjective>objective).getDirectSubObjectives().forEach((subObjective: Objective) => {
				objectiveElement.appendChild(this.convertObjectiveIntoElement(subObjective, xmlDocument, isIndividual));	// Recursively encode AbstractObjectives.
			});
		} else {
			objectiveElement.setAttribute('color', (<PrimitiveObjective>objective).getColor());
			objectiveElement.appendChild(this.convertDomainIntoElement((<PrimitiveObjective>objective).getDomain(), xmlDocument));
			if (!isIndividual) {
				objectiveElement.appendChild(this.convertScoreFunctionIntoElement((<PrimitiveObjective>objective).getDefaultScoreFunction(), objective.getName(), xmlDocument, true));
			}
		}
		return objectiveElement;
	}


	/*
		@param domain - The Domain object that is to be encoded into an XML element. This may be an instance of any of the Domain classes. 
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@returns {Element} - An XML element representing the Domain object that was provided. 
		@description	Encodes a Domain object and all its fields as an XML element. 
	*/
	public convertDomainIntoElement(domain: Domain, xmlDocument: XMLDocument): Element {
		var domainElement: Element = xmlDocument.createElement('Domain');
		domainElement.setAttribute('type', domain.type);

		if (domain.type === 'continuous') {
			if ((<ContinuousDomain>domain).unit) {
				domainElement.setAttribute('unit', (<ContinuousDomain>domain).unit);
			}
			domainElement.setAttribute('min', '' + (<ContinuousDomain>domain).getMinValue());
			domainElement.setAttribute('max', '' + (<ContinuousDomain>domain).getMaxValue());
		} else if (domain.type === 'categorical') {
			domainElement.setAttribute('ordered', '' + (<CategoricalDomain>domain).ordered);
			(<CategoricalDomain>domain).getElements().forEach((category: string) => {
				let categoryElement = xmlDocument.createElement('Category');
				categoryElement.innerHTML = category;
				domainElement.appendChild(categoryElement);
			});
		} else if (domain.type === 'interval') {
			domainElement.setAttribute('interval', '' + (<IntervalDomain>domain).getInterval());
			domainElement.setAttribute('min', '' + (<IntervalDomain>domain).getMinValue());
			domainElement.setAttribute('max', '' + (<IntervalDomain>domain).getMaxValue());
		}

		return domainElement;
	}

	/*
		@param alternatives - The array of Alternative objects that are to be encoded as XML elements.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param idToNameMap - A map from Objective ids to names.
		@returns {Element} - An XML element that is a parent of the XML elements representing the provided Alternative objects.
		@description	Encodes an array of Alternatives objects as XML elements. 
	*/
	public convertAlternativesIntoElement(alternatives: Alternative[], xmlDocument: XMLDocument, idToNameMap: {[objID: string]: string}): Element {
		var alternativesParentElement: Element = xmlDocument.createElement('Alternatives');

		alternatives.forEach((alternative: Alternative) => {
			let alternativeElement = xmlDocument.createElement('Alternative');
			alternativeElement.setAttribute('name', alternative.getName());

			let objectiveValuePairs: { objectiveId: string, value: string | number }[] = alternative.getAllObjectiveValuePairs();

			objectiveValuePairs.forEach((pair: { objectiveId: string, value: string | number }) => {
				let alternativeValueElement: Element = xmlDocument.createElement('AlternativeValue');

				alternativeValueElement.setAttribute('objective', idToNameMap[pair.objectiveId]);
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

	/*
		@param alternatives - The array of User objects that are to be encoded as XML elements.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param idToNameMap - A map from Objective ids to names.
		@returns {Element} - An XML element that is a parent of the XML elements representing the provided User objects.
		@description	Encodes an array of User objects as XML elements. This method encodes each Users WeightMap, ScoreFunctionMap and ScoreFunctions
						as a part of its execution.
	*/
	public convertUsersIntoElement(users: User[], xmlDocument: XMLDocument, idToNameMap: {[objID: string]: string}): Element {
		var usersParentElement: Element = xmlDocument.createElement('Users');

		users.forEach((user: User) => {
			let userElement: Element = xmlDocument.createElement('User');
			userElement.setAttribute('name', user.getUsername());
			if (user.color) {
				userElement.setAttribute('color', user.color);
			}
			userElement.appendChild(this.convertWeightMapIntoElement(user.getWeightMap(), xmlDocument, idToNameMap));	// Encode the User's WeightMap.
			userElement.appendChild(this.convertScoreFunctionMapIntoElement(user.getScoreFunctionMap(), xmlDocument, idToNameMap));  // Encode the User's ScoreFunctionMap (and all their ScoreFunctions).

			usersParentElement.appendChild(userElement);
		});

		return usersParentElement;
	}

	/*
		@param weightMap - The WeightMap object that is to be encoded as an XML element.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param idToNameMap - A map from Objective ids to names.
		@returns {Element} - An XML element that represents the given WeightMap. 
		@description	Encodes a WeightMap object as an XML element.
	*/
	public convertWeightMapIntoElement(weightMap: WeightMap, xmlDocument: XMLDocument, idToNameMap: {[objID: string]: string}): Element {
		var weightsParentElement: Element = xmlDocument.createElement('Weights');

		var map: Map<string, number> = weightMap.getInternalWeightMap();

		var mapIterator: Iterator<string> = map.keys();
		var iteratorElement: IteratorResult<string> = mapIterator.next();

		while (iteratorElement.done === false) {
			let weightElement: Element = xmlDocument.createElement('Weight');
			weightElement.setAttribute('objective', idToNameMap[iteratorElement.value]);
			weightElement.setAttribute('value', '' + weightMap.getNormalizedObjectiveWeight(iteratorElement.value));

			weightsParentElement.appendChild(weightElement);
			iteratorElement = mapIterator.next();
		}

		return weightsParentElement;
	}

	/*
		@param scoreFunctionMap - The ScoreFunctionMap object that is to be encoded as an XML element.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param idToNameMap - A map from Objective ids to names.
		@returns {Element} - An XML element that represents the given ScoreFunctionMap. 
		@description	Encodes a ScoreFunctionMap object as an XML element.
	*/
	public convertScoreFunctionMapIntoElement(scoreFunctionMap: ScoreFunctionMap, xmlDocument: XMLDocument, idToNameMap: {[objID: string]: string}): Element {
		var scoreFunctionsParentElement: Element = xmlDocument.createElement('ScoreFunctions');

		var scoreFunctionKeyPairs: { key: string, scoreFunction: ScoreFunction }[] = scoreFunctionMap.getAllKeyScoreFunctionPairs();

		scoreFunctionKeyPairs.forEach((pair: { key: string, scoreFunction: ScoreFunction }) => {
			let scoreFunctionElement = this.convertScoreFunctionIntoElement(pair.scoreFunction, idToNameMap[pair.key], xmlDocument, false);
			scoreFunctionsParentElement.appendChild(scoreFunctionElement);
		});

		return scoreFunctionsParentElement;
	}

	/*
		@param scoreFunction - The ScoreFunction object that is to be encoded as an XML element.
		@param objectiveName - The name of the PrimitiveObjective that the given ScoreFunction is associated with. This information is encoded along with the ScoreFunction object.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@param isDefault - Whether this is a default score function for an Objective.
		@returns {Element} - An XML element that represents the given ScoreFunction. 
		@description	Encodes a ScoreFunction object as an XML element.
	*/
	public convertScoreFunctionIntoElement(scoreFunction: ScoreFunction,  objectiveName: string, xmlDocument: XMLDocument, isDefault: boolean): Element {
		var elementName = isDefault ? "DefaultScoreFunction" : "ScoreFunction";
		var scoreFunctionElement: Element = xmlDocument.createElement(elementName);

		if (!isDefault) {
			scoreFunctionElement.setAttribute('objective', objectiveName);
		}		
		if (scoreFunction.immutable) {
			scoreFunctionElement.setAttribute('immutable', 'true');
		}
		scoreFunctionElement.setAttribute('type', scoreFunction.type);
		
		var domainValues: (string | number)[] = scoreFunction.getAllElements();
		domainValues.forEach((domainValue: string | number) => {
			scoreFunctionElement.appendChild(this.convertScoreIntoElement(domainValue, scoreFunction.getScore(domainValue), xmlDocument));
		});

		return scoreFunctionElement;
	}

	/*
		@param domainValue - The domain elemment to set the score for.
		@param score - The score value.
		@param xmlDocument - The XML document that is going to represent the ValueChart to encode. This is required by the method to create
								new elements. It is NOT modified.
		@returns {Element} - An XML element that represents the Score. 
		@description	Encodes a ScoreFunction object as an XML element.
	*/
	public convertScoreIntoElement(domainValue: string | number, score: number, xmlDocument: XMLDocument) {
		let scoreElement: Element = xmlDocument.createElement('Score');
		scoreElement.setAttribute('value', '' + score);
		scoreElement.setAttribute('domain-element', '' + domainValue);
		return scoreElement;
	}
}









