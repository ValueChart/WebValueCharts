/*
* @Author: aaronpmishkin
* @Date:   2016-06-29 21:10:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-02 16:48:19
*/

// Import Node Libraries: 
import { expect }												from 'chai';

// Import Application Classes:
import { XmlValueChartParser }									from '../../../client/resources/modules/utilities/classes/XmlValueChartParser';

// Import Model Classes:
import { ValueChart }											from '../../../client/resources/model/ValueChart';
import { Alternative }											from '../../../client/resources/model/Alternative';
import { User } 												from '../../../client/resources/model/User';
import { Objective } 											from '../../../client/resources/model/Objective';
import { PrimitiveObjective } 									from '../../../client/resources/model/PrimitiveObjective';
import { AbstractObjective } 									from '../../../client/resources/model/AbstractObjective';
import { CategoricalDomain }									from '../../../client/resources/model/CategoricalDomain';
import { ContinuousDomain }										from '../../../client/resources/model/ContinuousDomain';
import { WeightMap } 											from '../../../client/resources/model/WeightMap';
import { ScoreFunctionMap } 									from '../../../client/resources/model/ScoreFunctionMap';
import { ContinuousScoreFunction } 								from '../../../client/resources/model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 								from '../../../client/resources/model/DiscreteScoreFunction';


/*

describe('XmlValueChartParser', () => {
	var valueChartParser: XmlValueChartParser;
	var xmlDocParser: DOMParser;
	var xmlDocument: Document;

	before(function() {
		valueChartParser = new XmlValueChartParser();
		xmlDocParser = new DOMParser();
		xmlDocument = xmlDocParser.parseFromString(XMLTestString, 'application/xml');
	});


	describe('parseScoreFunction(scoreFunctionElement: Element): ScoreFunction', () => {
		var areaScoreFunctionElement: Element;
		var areaObjectiveScores: any[]

		var sizeScoreFunctionElement: Element;
		var sizeObjectiveScores: any[];

		before(function() {
			areaScoreFunctionElement = xmlDocument.querySelector('ScoreFunction[objective=area]');
			areaObjectiveScores = [{domainElement: 'nightlife', score: 0.25}, {domainElement: 'beach', score: 0.5}, {domainElement: 'airport', score: 1}];

			sizeScoreFunctionElement = xmlDocument.querySelector('ScoreFunction[objective=size]');
			sizeObjectiveScores = [{domainElement: 200.0, score: 1}, {domainElement: 237.5, score: 0.8}, {domainElement: 275.0, score: 0.6}, {domainElement: 312.5, score: 0.4}, {domainElement: 350.0, score: 0.2}];
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

			it('should update the domains of the categorical objectives when alternatives are parsed', () => {

				primitiveObjectives.forEach((objective: PrimitiveObjective) => {
					if (objective.getDomainType() === 'categorical') {
						expect((<CategoricalDomain> objective.getDomain()).getElements()).to.have.length(0);
					}
				});

				var alternatives: Alternative[] = valueChartParser.parseAlternatives(alternativesParentElement, primitiveObjectives);

				primitiveObjectives.forEach((objective: PrimitiveObjective) => {
					if (objective.getDomainType() === 'categorical') {
						expect((<CategoricalDomain> objective.getDomain()).getElements()).to.not.have.length(0);
					}
				});

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



// Import Test Resources:
var XMLTestString: string = 
`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts name="Hotel" creator="Aaron Mishkin" version="2.0">
	<ChartStructure>
		<Objectives>
			<Objective name="Hotel" type="abstract">
	          	<Objective name="location" type="abstract">
	                <Objective name="area" type="primitive" color="#C0392B">
	                    <Domain type="categorical" ordered="false"/>
	                    <Description>
	                    	Description Information Goes Here
	                    </Description>
	                </Objective>
	                <Objective name="skytrain-distance" type="primitive" color="#7D3C98">
	                    <Domain type="continuous" unit="blocks" min="2.0" max="9.0"/>
	                    <Description>
	                    	Description Information Goes Here
	                    </Description>
	                </Objective>
	           </Objective>
	           <Objective name="room" type="abstract">
	                <Objective name="size" type="primitive" color="#2980B9">
	                    <Domain type="continuous" unit="sq-ft" min="200.0" max="350.0"/>
	                    <Description>
	                    	Description Information Goes Here
	                    </Description>
	                </Objective>
	                <Objective name="internet-access" type="primitive" color="#27AE60"> 
	                    <Domain type="categorical" ordered="false"/>
	                    <Description>
	                    	Description Information Goes Here
	                    </Description>
	                </Objective>
	           </Objective>
	           <Objective name="rate" type="primitive" color="#F1C40F">
	                <Domain type="continuous" unit="CAD" min="100.0" max="200.0"/>
	                <Description>
	                	Description Information Goes Here
	                </Description>
	           </Objective>
	      </Objective>
	    </Objectives>
	    <Alternatives>
	        <Alternative name="Sheraton">
	               <AlternativeValue objective="area" value="nightlife"/>
	               <AlternativeValue objective="internet-access" value="highspeed"/>
	               <AlternativeValue objective="rate" value="150.0"/>
	               <AlternativeValue objective="skytrain-distance" value="7.0"/>
	               <AlternativeValue objective="size" value="350.0"/>
	               <Description>Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
	        </Alternative>
	        <Alternative name="BestWestern">
	               <AlternativeValue objective="area" value="nightlife"/>
	               <AlternativeValue objective="internet-access" value="highspeed"/>
	               <AlternativeValue objective="rate" value="100.0"/>
	               <AlternativeValue objective="skytrain-distance" value="2.0"/>
	               <AlternativeValue objective="size" value="200.0"/>
	               <Description>Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>
	        </Alternative>
	        <Alternative name="Hyatt">
		           <AlternativeValue objective="area" value="beach"/>
		           <AlternativeValue objective="internet-access" value="lowspeed"/>
		           <AlternativeValue objective="rate" value="200.0"/>
		           <AlternativeValue objective="skytrain-distance" value="2.0"/>
		           <AlternativeValue objective="size" value="275.0"/>
		           <Description>Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>
         	</Alternative>
         	<Alternative name="Marriott">
	               <AlternativeValue objective="area" value="airport"/>
	               <AlternativeValue objective="internet-access" value="lowspeed"/>
	               <AlternativeValue objective="rate" value="175.0"/>
	               <AlternativeValue objective="skytrain-distance" value="9.0"/>
	               <AlternativeValue objective="size" value="200.0"/>
	               <Description>The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
          	</Alternative>
          	<Alternative name="HolidayInn">
	               <AlternativeValue objective="area" value="airport"/>
	               <AlternativeValue objective="internet-access" value="none"/>
	               <AlternativeValue objective="rate" value="100.0"/>
	               <AlternativeValue objective="skytrain-distance" value="1.0"/>
	               <AlternativeValue objective="size" value="237.5"/>
	               <Description>The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>
          	</Alternative>
          	<Alternative name="Ramada">
	               <AlternativeValue objective="area" value="beach"/>
	               <AlternativeValue objective="internet-access" value="none"/>
	               <AlternativeValue objective="rate" value="125.0"/>
	               <AlternativeValue objective="skytrain-distance" value="1.0"/>
	               <AlternativeValue objective="size" value="312.5"/>
	               <Description>1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>
          	</Alternative>
	    </Alternatives>
	</ChartStructure>
	<Users>
		<User name="Aaron Mishkin">
			<Weights>
				<Weight objective="area" value="0.2"/>
				<Weight objective="internet-access" value="0.1"/>
				<Weight objective="rate" value="0.3"/>
				<Weight objective="skytrain-distance" value="0.2"/>
				<Weight objective="size" value="0.2"/>
			</Weights>
			<ScoreFunctions>
				<ScoreFunction objective="area" type="discrete">
					<Score value="0.25" domain-element="nightlife"/>
					<Score value="0.5" domain-element="beach"/>
					<Score value="1" domain-element="airport"/>
				</ScoreFunction>
				<ScoreFunction objective="skytrain-distance" type="continuous">
					<Score value="1" domain-element="1.0"/>
					<Score value="0.6" domain-element="2.0"/>
					<Score value="0.2" domain-element="7.0"/>
					<Score value="0" domain-element="9.0"/>
				</ScoreFunction>
				<ScoreFunction objective="size" type="continuous">
					<Score value="1" domain-element="200.0"/>
					<Score value="0.8" domain-element="237.5"/>
					<Score value="0.6" domain-element="275.0"/>
					<Score value="0.4" domain-element="312.5"/>
					<Score value="0.2" domain-element="350.0"/>
				</ScoreFunction>
				<ScoreFunction objective="internet-access" type="discrete">
					<Score value="0" domain-element="none"/>
					<Score value="1" domain-element="highspeed"/>
					<Score value="0.5" domain-element="lowspeed"/>				
				</ScoreFunction>
				<ScoreFunction objective="rate" type="continuous">
					<Score value="1" domain-element="100.0"/>
					<Score value="0.75" domain-element="125.0"/>
					<Score value="0.5" domain-element="150.0"/>
					<Score value="0.25" domain-element="175.0"/>
					<Score value="0" domain-element="200.0"/>
				</ScoreFunction>
			</ScoreFunctions>
		</User>
	</Users>
</ValueCharts>`

*/

