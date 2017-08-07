/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 21:10:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-09 22:38:42
*/

// Import Node Libraries: 
import { expect }												from 'chai';

// Import Application Classes:
import { WebValueChartsParser }									from '../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Model Classes:
import { ValueChart }											from '../../../../client/resources/model/ValueChart';
import { Alternative }											from '../../../../client/resources/model/Alternative';
import { User } 												from '../../../../client/resources/model/User';
import { Objective } 											from '../../../../client/resources/model/Objective';
import { PrimitiveObjective } 									from '../../../../client/resources/model/PrimitiveObjective';
import { AbstractObjective } 									from '../../../../client/resources/model/AbstractObjective';
import { CategoricalDomain }									from '../../../../client/resources/model/CategoricalDomain';
import { ContinuousDomain }										from '../../../../client/resources/model/ContinuousDomain';
import { WeightMap } 											from '../../../../client/resources/model/WeightMap';
import { ScoreFunctionMap } 									from '../../../../client/resources/model/ScoreFunctionMap';
import { ContinuousScoreFunction } 								from '../../../../client/resources/model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 								from '../../../../client/resources/model/DiscreteScoreFunction';

// Import Test Data:
import { HotelChartData }										from '../../../testData/HotelChartData';



describe('WebValueChartsParser', () => {
	var valueChartParser: WebValueChartsParser;
	var xmlDocParser: DOMParser;
	var xmlDocument: Document;

	before(function() {
		valueChartParser = new WebValueChartsParser();
		xmlDocParser = new DOMParser();
		xmlDocument = xmlDocParser.parseFromString(HotelChartData, 'application/xml');
	});


	describe('parseScoreFunction(scoreFunctionElement: Element): ScoreFunction', () => {
		var areaScoreFunctionElement: Element;
		var areaObjectiveScores: any[]

		var sizeScoreFunctionElement: Element;
		var sizeObjectiveScores: any[];

		before(function() {
			areaScoreFunctionElement = xmlDocument.querySelector('ScoreFunction[objective=area]');
			areaObjectiveScores = [{domainElement: 'nightlife', score: 0}, {domainElement: 'beach', score: 0.5}, {domainElement: 'airport', score: 1}];

			sizeScoreFunctionElement = xmlDocument.querySelector('ScoreFunction[objective=size]');
			sizeObjectiveScores = [{domainElement: 200.0, score: 1}, {domainElement: 237.5, score: 0.8}, {domainElement: 275.0, score: 0.6}, {domainElement: 312.5, score: 0.4}, {domainElement: 350.0, score: 0}];
		});

		it('should correctly parse a continuous ScoreFunction from the XML document', () => {
			var areaScoreFunction = valueChartParser.parseScoreFunction(areaScoreFunctionElement);

			areaObjectiveScores.forEach((objectiveScore: any) => {
				expect(areaScoreFunction.getScore(objectiveScore.domainElement)).to.equal(objectiveScore.score);
			});
		});

		it('should correctly parse a discrete ScoreFunction from the XML document', () => {
			var sizeScoreFunction = valueChartParser.parseScoreFunction(sizeScoreFunctionElement);

			sizeObjectiveScores.forEach((objectiveScore: any) => {
				expect(sizeScoreFunction.getScore(objectiveScore.domainElement)).to.equal(objectiveScore.score);
			});
		});
	});

	describe('parseScoreFunctionMap(scoreFunctionsParentElement: Element): ScoreFunctionMap', () => {
		var scoreFunctionsParentElement: Element;
		var primitiveObjectiveNames: string[];

		before(function() {
			scoreFunctionsParentElement = xmlDocument.querySelector('ScoreFunctions');
			primitiveObjectiveNames = ['area', 'internet-access', 'rate', 'skytrain-distance', 'size'];
		});

		it('should parse ALL of the ScoreFuctions from the XML document', () => {
			var scoreFunctionMap: ScoreFunctionMap = valueChartParser.parseScoreFunctionMap(scoreFunctionsParentElement);

			expect(scoreFunctionMap.getAllScoreFunctions()).to.have.length(5);
		});

		it('should map one ScoreFunction to each PrimitiveObjective in the ValueChart', () => {
			var scoreFunctionMap: ScoreFunctionMap = valueChartParser.parseScoreFunctionMap(scoreFunctionsParentElement);

			primitiveObjectiveNames.forEach((objectiveName: string) => {
				expect(scoreFunctionMap.getObjectiveScoreFunction(objectiveName)).to.not.be.undefined;
			});
		});		
	});

	describe('parseWeightMap(weightsParentElement: Element): WeightMap', () => {
		var weightsParentElement: Element;
		var objectiveWeights: any[];
		
		before(function() {	
			weightsParentElement = xmlDocument.querySelector('Weights');
			objectiveWeights = [{objectiveName: 'area', weight: 0.2}, {objectiveName: 'internet-access', weight: 0.1}, {objectiveName: 'rate', weight: 0.3}, {objectiveName: 'skytrain-distance', weight: 0.2}, {objectiveName: 'size', weight: 0.2}];
		});

		it('should parse all of the weight tags, and map the correct weight to each objective in the ValueChart', () => {
			var weightMap: WeightMap = valueChartParser.parseWeightMap(weightsParentElement);

			objectiveWeights.forEach((objectiveWeight: any) => {
				expect(weightMap.getObjectiveWeight(objectiveWeight.objectiveName)).to.equal(objectiveWeight.weight);
			});
		});	
	});

	describe('parseUsers(usersParentElement: Element): User[]', () => {
		var usersParentElement: Element;
		var objectiveWeights: any[];
		var primitiveObjectiveNames: string[];

		before(function() {
			usersParentElement = xmlDocument.querySelector('Users');
			objectiveWeights = [{objectiveName: 'area', weight: 0.2}, {objectiveName: 'internet-access', weight: 0.1}, {objectiveName: 'rate', weight: 0.3}, {objectiveName: 'skytrain-distance', weight: 0.2}, {objectiveName: 'size', weight: 0.2}];
			primitiveObjectiveNames = ['area', 'internet-access', 'rate', 'skytrain-distance', 'size'];
		});	

		it('should parse the correct number of users from the XML document', () => {
			var users: User[] = valueChartParser.parseUsers(usersParentElement);
			expect(users).to.have.length(1);
		});

		it('should parse the users name from the XML document', () => {
			var user: User = valueChartParser.parseUsers(usersParentElement)[0];
			expect(user.getUsername()).to.equal('Aaron Mishkin');
		});

		it('should correctly parse each users WeightMap, and ScoreFunctionmap from the XMl document', () => {
			var user: User = valueChartParser.parseUsers(usersParentElement)[0];

			objectiveWeights.forEach((objectiveWeight: any) => {
				expect(user.getWeightMap().getObjectiveWeight(objectiveWeight.objectiveName)).to.equal(objectiveWeight.weight);
			});

			primitiveObjectiveNames.forEach((objectiveName: string) => {
				expect(user.getScoreFunctionMap().getObjectiveScoreFunction(objectiveName)).to.not.be.undefined;
			});
		});
	});

	describe('parseDomain(domainElement: Element): Domain', () => {
		var domainElement: Element;

		context('when the domain is categorical', () => {

			before(function() {
				domainElement = xmlDocument.querySelector('Objective[name=area]').querySelector('Domain');
			});

			it('should correctly parse the domain element in the XML document', () => {
				var domain: CategoricalDomain = <CategoricalDomain> valueChartParser.parseDomain(domainElement);

				expect(domain.type).to.equal('categorical');
				expect(domain.ordered).to.be.false;
			});
		});

		context('when the domain is continuous', () => {

			before(function() {
				domainElement = xmlDocument.querySelector('Objective[name=size]').querySelector('Domain');
			});

			it('should correctly parse the domain element in the XML document', () => {
				var domain: ContinuousDomain = <ContinuousDomain> valueChartParser.parseDomain(domainElement);

				expect(domain.type).to.equal('continuous');
				expect(domain.getMinValue()).to.equal(200.0);
				expect(domain.getMaxValue()).to.equal(350.0);
			});
		});
	});

	describe('parseObjectives(objectivesParentElement: Element): Objective[]', () => {
		var objectivesParentElement: Element;

		context('when the objectiveParentElement is the root objectives container element', () => {

			before(function() {
				objectivesParentElement = xmlDocument.querySelector('Objectives');
			});

			it('should parse the entire hierarchy of objectives from the XML document', () => {
				var rootObjectives: Objective[] = valueChartParser.parseObjectives(objectivesParentElement);

				expect(rootObjectives).to.have.length(1);
				expect (rootObjectives[0].getName()).to.equal('Hotel');

				var rootObjectiveChildren: Objective[] = (<AbstractObjective> rootObjectives[0]).getDirectSubObjectives();

				var locationObjective: AbstractObjective = <AbstractObjective> rootObjectiveChildren[0];
				expect(locationObjective.getName()).to.equal('location');
				expect(locationObjective.getDirectSubObjectives()).to.have.length(2);
				expect(locationObjective.objectiveType).to.equal('abstract');

				// Location Objective's Children

					var areaObjective: PrimitiveObjective = <PrimitiveObjective> locationObjective.getDirectSubObjectives()[0];
					expect(areaObjective.getName()).to.equal('area');
					expect(areaObjective.objectiveType).to.equal('primitive');
					expect(areaObjective.getDomainType()).to.equal('categorical');


					var skytrainDistanceObjective: PrimitiveObjective = <PrimitiveObjective> locationObjective.getDirectSubObjectives()[1];
					expect(skytrainDistanceObjective.getName()).to.equal('skytrain-distance');
					expect(skytrainDistanceObjective.objectiveType).to.equal('primitive');
					expect(skytrainDistanceObjective.getDomainType()).to.equal('continuous');


				var roomObjective: AbstractObjective = <AbstractObjective> rootObjectiveChildren[1];
				expect(roomObjective.getName()).to.equal('room');
				expect(roomObjective.getDirectSubObjectives()).to.have.length(2);
				expect(roomObjective.objectiveType).to.equal('abstract');

				// Room Objective's Children

					var sizeObjective: PrimitiveObjective = <PrimitiveObjective> roomObjective.getDirectSubObjectives()[0];
					expect(sizeObjective.getName()).to.equal('size');
					expect(sizeObjective.objectiveType).to.equal('primitive');
					expect(sizeObjective.getDomainType()).to.equal('continuous');


					var internetAccessObjective: PrimitiveObjective = <PrimitiveObjective> roomObjective.getDirectSubObjectives()[1];
					expect(internetAccessObjective.getName()).to.equal('internet-access');
					expect(internetAccessObjective.objectiveType).to.equal('primitive');
					expect(internetAccessObjective.getDomainType()).to.equal('categorical');


				var rateObjective: PrimitiveObjective = <PrimitiveObjective> rootObjectiveChildren[2];
				expect(rateObjective.getName()).to.equal('rate');
				expect(rateObjective.objectiveType).to.equal('primitive');

			});
		});


		describe('parseAlternatives(alternativesParentElement: Element, primitiveObjectives: PrimitiveObjective[]): Alternative[]', () => {
			var alternativesParentElement: Element;
			var valueChart: ValueChart;
			var primitiveObjectives: PrimitiveObjective[];

			var alternativeValues: any[];

			beforeEach(function() {
				var rootObjectives = valueChartParser.parseObjectives(xmlDocument.querySelector('Objectives'));
				valueChart = new ValueChart('','','');
				valueChart.setRootObjectives(rootObjectives);
				primitiveObjectives = valueChart.getAllPrimitiveObjectives();

				alternativesParentElement = xmlDocument.querySelector('Alternatives');

				alternativeValues = [
					{alternativeName: 'Sheraton', 		objectiveValues: [{objectiveName: 'area', value: 'nightlife'}, 	{objectiveName: 'internet-access', value: 'highspeed'}, {objectiveName: 'rate', value: 150.0}, {objectiveName: 'skytrain-distance', value: 7}, {objectiveName: 'size', value: 350.0}]}, 
					{alternativeName: 'BestWestern', 	objectiveValues: [{objectiveName: 'area', value: 'nightlife'}, 	{objectiveName: 'internet-access', value: 'highspeed'}, {objectiveName: 'rate', value: 100.0}, {objectiveName: 'skytrain-distance', value: 2}, {objectiveName: 'size', value: 200.0}]}, 
					{alternativeName: 'Hyatt', 			objectiveValues: [{objectiveName: 'area', value: 'beach'}, 		{objectiveName: 'internet-access', value: 'lowspeed'}, 	{objectiveName: 'rate', value: 200.0}, {objectiveName: 'skytrain-distance', value: 2}, {objectiveName: 'size', value: 275.0}]}, 
					{alternativeName: 'Marriott', 		objectiveValues: [{objectiveName: 'area', value: 'airport'}, 	{objectiveName: 'internet-access', value: 'lowspeed'}, 	{objectiveName: 'rate', value: 175.0}, {objectiveName: 'skytrain-distance', value: 9}, {objectiveName: 'size', value: 200.0}]}, 
					{alternativeName: 'HolidayInn',		objectiveValues: [{objectiveName: 'area', value: 'airport'}, 	{objectiveName: 'internet-access', value: 'none'}, 		{objectiveName: 'rate', value: 100.0}, {objectiveName: 'skytrain-distance', value: 1}, {objectiveName: 'size', value: 237.5}]}, 
					{alternativeName: 'Ramada', 		objectiveValues: [{objectiveName: 'area', value: 'beach'}, 		{objectiveName: 'internet-access', value: 'none'}, 		{objectiveName: 'rate', value: 125.0}, {objectiveName: 'skytrain-distance', value: 1}, {objectiveName: 'size', value: 312.5}]}
				]
			});

			it('should parse all of the alternatives from the XML document', () => {
				var alternatives: Alternative[] = valueChartParser.parseAlternatives(alternativesParentElement, primitiveObjectives);

				expect(alternatives).to.have.length(6);

				for (var i = 0; i < alternativeValues.length; i++) {
					expect(alternatives[i].getName()).to.equal(alternativeValues[i].alternativeName);

					alternativeValues[i].objectiveValues.forEach((objectiveValue: any) => {
						expect(alternatives[i].getObjectiveValue(objectiveValue.objectiveName)).to.equal(objectiveValue.value);
					});
				}
			});

		});

		context('when the objectiveParentElement is an abstract objective element', () => {

			before(function() {
				objectivesParentElement = xmlDocument.querySelector('Objective[name=location]');
			});

			it('should parse the hierarchy of objectives that are children of passed in abstract objective from the XML document', () => {
				var locationChildObjectives: Objective[] = valueChartParser.parseObjectives(objectivesParentElement);
				var areaObjective: Objective = locationChildObjectives[0];
				var skytrainDistanceObjective: Objective = locationChildObjectives[1];


				expect(locationChildObjectives).to.have.length(2);
				expect(areaObjective.getName()).to.equal('area');
				expect(areaObjective.objectiveType).to.equal('primitive');
				expect((<PrimitiveObjective> areaObjective).getDomainType()).to.equal('categorical');

				expect(skytrainDistanceObjective.getName()).to.equal('skytrain-distance');
				expect(skytrainDistanceObjective.objectiveType).to.equal('primitive');
				expect((<PrimitiveObjective> skytrainDistanceObjective).getDomainType()).to.equal('continuous');

			});
			
		});

	});

});



