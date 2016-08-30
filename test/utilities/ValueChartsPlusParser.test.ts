/*
* @Author: aaronpmishkin
* @Date:   2016-05-31 15:56:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 13:06:06
*/
// Import Node Libraries:
import { expect }												from 'chai';

// Application Classes:
import { ValueChartLegacyParser }								from '../../client/resources/modules/utilities/classes/XmlValueChartLegacyParser';


// Model Classes:
import { ValueChart }											from '../../client/resources/model/ValueChart';
import { Alternative }											from '../../client/resources/model/Alternative';
import { User } 												from '../../client/resources/model/User';
import { Objective } 											from '../../client/resources/model/Objective';
import { PrimitiveObjective } 									from '../../client/resources/model/PrimitiveObjective';
import { AbstractObjective } 									from '../../client/resources/model/AbstractObjective';
import { CategoricalDomain }									from '../../client/resources/model/CategoricalDomain';
import { ContinuousDomain }										from '../../client/resources/model/ContinuousDomain';
import { WeightMap } 											from '../../client/resources/model/WeightMap';
import { ScoreFunctionMap } 									from '../../client/resources/model/ScoreFunctionMap';
import { ContinuousScoreFunction } 								from '../../client/resources/model/ContinuousScoreFunction';
import { DiscreteScoreFunction } 								from '../../client/resources/model/DiscreteScoreFunction';

// Test Resources:
var XMLTestString: string = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<ValueCharts problem=\"Hotel\">\n     <Colors>\n          <Color b=\"94\" g=\"102\" name=\"area\" r=\"1\"/>\n          <Color b=\"207\" g=\"169\" name=\"skytrain-distance\" r=\"103\"/>\n          <Color b=\"13\" g=\"0\" name=\"size\" r=\"103\"/>\n          <Color b=\"28\" g=\"26\" name=\"internet-access\" r=\"227\"/>\n          <Color b=\"79\" g=\"196\" name=\"rate\" r=\"254\"/>\n     </Colors>\n     <Criteria>\n          <Criterion name=\"Hotel\" type=\"abstract\">\n               <Criterion name=\"location\" type=\"abstract\">\n                    <Criterion name=\"area\" type=\"primitive\" weight=\"0.46\">\n                         <Domain type=\"discrete\">\n                              <DiscreteValue x=\"nightlife\" y=\"0.5\"/>\n                              <DiscreteValue x=\"beach\" y=\"1.0\"/>\n                              <DiscreteValue x=\"airport\" y=\"0.0\"/>\n                         </Domain>\n                         <Description name=\"area\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Area&lt;/h1&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: near nightlife&lt;/li&gt;\n                                   &lt;li&gt;Best Western: near nightlife&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: on the beach&lt;/li&gt;\n                                   &lt;li&gt;Marriott: near airport&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: near airport&lt;/li&gt;\n                                   &lt;li&gt;Ramada: on the beach&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n                    <Criterion name=\"skytrain-distance\" type=\"primitive\" weight=\"0.09\">\n                         <Domain type=\"continuous\" unit=\"blocks\">\n                              <ContinuousValue x=\"1.0\" y=\"1.0\"/>\n                              <ContinuousValue x=\"3.0\" y=\"0.75\"/>\n                              <ContinuousValue x=\"5.0\" y=\"0.5\"/>\n                              <ContinuousValue x=\"7.0\" y=\"0.25\"/>\n                              <ContinuousValue x=\"9.0\" y=\"0.0\"/>\n                         </Domain>\n                         <Description name=\"skytrain-distance\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Distance to Skytrain station&lt;/h1&gt;\n                                   &lt;h3&gt;unit: blocks&lt;/h3&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: 7&lt;/li&gt;\n                                   &lt;li&gt;Best Western: 2&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: 2&lt;/li&gt;\n                                   &lt;li&gt;Marriott: 9&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: 1&lt;/li&gt;\n                                   &lt;li&gt;Ramada: 1&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n               </Criterion>\n               <Criterion name=\"room\" type=\"abstract\">\n                    <Criterion name=\"size\" type=\"primitive\" weight=\"0.04\">\n                         <Domain type=\"continuous\" unit=\"sq-ft\">\n                              <ContinuousValue x=\"200.0\" y=\"0.0\"/>\n                              <ContinuousValue x=\"237.5\" y=\"0.25\"/>\n                              <ContinuousValue x=\"275.0\" y=\"0.5\"/>\n                              <ContinuousValue x=\"312.5\" y=\"0.75\"/>\n                              <ContinuousValue x=\"350.0\" y=\"1.0\"/>\n                         </Domain>\n                         <Description name=\"size\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Room size&lt;/h1&gt;\n                                   &lt;h3&gt;unit: square feet&lt;/h3&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: 350&lt;/li&gt;\n                                   &lt;li&gt;Best Western: 200&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: 275&lt;/li&gt;\n                                   &lt;li&gt;Marriott: 200&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: 237.5&lt;/li&gt;\n                                   &lt;li&gt;Ramada: 312.5&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n                    <Criterion name=\"internet-access\" type=\"primitive\" weight=\"0.21\">\n                         <Domain type=\"discrete\">\n                              <DiscreteValue x=\"none\" y=\"0.0\"/>\n                              <DiscreteValue x=\"highspeed\" y=\"1.0\"/>\n                              <DiscreteValue x=\"lowspeed\" y=\"0.24500000476837158\"/>\n                         </Domain>\n                         <Description name=\"internet-access\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Internet access&lt;/h1&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: high speed (wired)&lt;/li&gt;\n                                   &lt;li&gt;Best Western: high speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: low speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Marriott: low speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: none&lt;/li&gt;\n                                   &lt;li&gt;Ramada: none&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n               </Criterion>\n               <Criterion name=\"rate\" type=\"primitive\" weight=\"0.2\">\n                    <Domain type=\"continuous\" unit=\"CAD\">\n                         <ContinuousValue x=\"100.0\" y=\"1.0\"/>\n                         <ContinuousValue x=\"125.0\" y=\"0.75\"/>\n                         <ContinuousValue x=\"150.0\" y=\"0.5\"/>\n                         <ContinuousValue x=\"175.0\" y=\"0.25\"/>\n                         <ContinuousValue x=\"200.0\" y=\"0.0\"/>\n                    </Domain>\n                    <Description name=\"rate\">&lt;![CDATA[&lt;html&gt;\n                              &lt;body&gt;\n                              &lt;h1&gt;Rate per night&lt;/h1&gt;\n                              &lt;h3&gt;unit: CAD&lt;/h3&gt;\n                              &lt;ul&gt;\n                              &lt;li&gt;Sheraton: 150&lt;/li&gt;\n                              &lt;li&gt;Best Western: 100&lt;/li&gt;\n                              &lt;li&gt;Hyatt: 200&lt;/li&gt;\n                              &lt;li&gt;Marriott: 160&lt;/li&gt;\n                              &lt;li&gt;Holiday Inn: 100&lt;/li&gt;\n                              &lt;li&gt;Ramada: 120&lt;/li&gt;\n                              &lt;/ul&gt;\n                              &lt;/body&gt;\n                              &lt;/html&gt;]]&gt;\n                    </Description>\n               </Criterion>\n          </Criterion>\n     </Criteria>\n     <Alternatives>\n          <Alternative name=\"Sheraton\">\n               <AlternativeValue criterion=\"area\" value=\"nightlife\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"highspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"150.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"7.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"350.0\"/>\n               <Description name=\"Sheraton\">Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"BestWestern\">\n               <AlternativeValue criterion=\"area\" value=\"nightlife\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"highspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"100.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"2.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"200.0\"/>\n               <Description name=\"BestWestern\">Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"Hyatt\">\n               <AlternativeValue criterion=\"area\" value=\"beach\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"lowspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"200.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"2.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"275.0\"/>\n               <Description name=\"Hyatt\">Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>\n          </Alternative>\n          <Alternative name=\"Marriott\">\n               <AlternativeValue criterion=\"area\" value=\"airport\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"lowspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"160.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"9.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"200.0\"/>\n               <Description name=\"Marriott\">The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"HolidayInn\">\n               <AlternativeValue criterion=\"area\" value=\"airport\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"none\"/>\n               <AlternativeValue criterion=\"rate\" value=\"100.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"1.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"237.5\"/>\n               <Description name=\"HolidayInn\">The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"Ramada\">\n               <AlternativeValue criterion=\"area\" value=\"beach\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"none\"/>\n               <AlternativeValue criterion=\"rate\" value=\"120.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"1.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"312.5\"/>\n               <Description name=\"Ramada\">1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>\n          </Alternative>\n     </Alternatives>\n</ValueCharts>";


/*


describe('XmlValueChartLegacyParser', () => {
	var valueChartParser: XmlValueChartLegacyParser;
	var xmlDocParser: DOMParser;
	var xmlDocument: Document;

	before(function() {
		valueChartParser = new XmlValueChartLegacyParser();
		xmlDocParser = new DOMParser();
		xmlDocument = xmlDocParser.parseFromString(XMLTestString, 'application/xml');
	});


	describe('parseCategoricalDomain(domainElements: Element)', () => {
		var categoricalDomainElement: Element;

		before(function() {
			categoricalDomainElement = xmlDocument.querySelector('Criterion [name=area]').querySelector('Domain'); 
		});

		it('should parse all elements of the domain from the document element and return a CategoricalDomain object', () => {
			var categoricalDomain: CategoricalDomain = valueChartParser.parseCategoricalDomain(categoricalDomainElement);

			expect(categoricalDomain.getElements()).to.have.length(3);
			expect(categoricalDomain.getElements()).to.include('nightlife');
			expect(categoricalDomain.getElements()).to.include('beach');
			expect(categoricalDomain.getElements()).to.include('airport');
		});

	});

	describe('parseContinuousDomain(domainElements: Element)', () => {
		var continuousDomainElement: Element;

		before(function() {
			continuousDomainElement = xmlDocument.querySelector('Criterion [name=skytrain-distance]').querySelector('Domain');
		});

		it('should parse the min and max elements of the domain from the document element and return a ContinuousDomain object', () => {
			var continuousDomain: ContinuousDomain = valueChartParser.parseContinuousDomain(continuousDomainElement);

			expect(continuousDomain.getRange()[0]).to.equal(1.0);
			expect(continuousDomain.getRange()[1]).to.equal(9.0);
		});
	});

	describe('parsePrimitiveObjective(primitiveObjectiveElements: Element)', () => {
		var primitiveObjectiveElement: Element;

		before(function() {
			primitiveObjectiveElement = xmlDocument.querySelector('Criterion [name=size]');
		});

		it('should parse the objective from the document element, including its domain, and return a PrimitiveObjective object', () => {
			var size: PrimitiveObjective = valueChartParser.parsePrimitiveObjective(primitiveObjectiveElement);

			expect(size.getName()).to.equal('size');
			expect(size.getDomainType()).to.equal('continuous');
			expect(size.objectiveType).to.equal('primitive');
			
			var domainRange: number[] = (<ContinuousDomain>size.getDomain()).getRange();

			expect(domainRange[0]).to.equal(200.0);
			expect(domainRange[1]).to.equal(350.0);			
		});
	});	

	describe('parseAbstractObjective(abstractObjectiveElements: Element)', () => {
		var abstractObjectiveElement: Element;


		context('when the AbstractObjective has no children which are also AbstractObjectives', () => {
			
			before(function() {
				abstractObjectiveElement = xmlDocument.querySelector('Criterion [name=location]');
			});

			it('should parse the objective from the document element, including its domain, and all its subObjectives, and return a AbstractObjective object', () => {
				var location: AbstractObjective = valueChartParser.parseAbstractObjective(abstractObjectiveElement);
				
				expect(location.getName()).to.equal('location');
				expect(location.objectiveType).to.equal('abstract');

				expect(location.getDirectSubObjectives()).to.have.length(2);
			});
		});

		context('when the AbstractObjective has children which are also AbstractObjectives', () => {
			
			before(function() {
				abstractObjectiveElement = (<any> xmlDocument.querySelector('Criteria')).children[0];
			});

			it('should parse the objective from the document element, including its domain, and all its subObjectives, and return a AbstractObjective object', () => {
				var hotel: AbstractObjective = valueChartParser.parseAbstractObjective(abstractObjectiveElement);

				expect(hotel.getName()).to.equal('Hotel');
				expect(hotel.objectiveType).to.equal('abstract');

				expect(hotel.getDirectSubObjectives()).to.have.length(3);
				expect(hotel.getAllSubObjectives()).to.have.length(7);

			});
		});
	});

	describe('parseAlternatives(alternativeElements: Element, objectives: PrimitiveObjective[])', () => {
		var objectives: PrimitiveObjective[];
		var alternativeElements: Element[];

		before(function() {
			var valueChart: ValueChart = new ValueChart('', '', '');
			valueChart.setRootObjectives(valueChartParser.parseObjectives((<any>xmlDocument.querySelector('Criteria')).children));
			objectives = valueChart.getAllPrimitiveObjectives();

			alternativeElements = (<any> xmlDocument.querySelector('Alternatives')).children;
		});

		it('should parse all of the alternatives from the document element, and the alternatives should have the correct values', () => {
			var alternatives: Alternative[] = valueChartParser.parseAlternatives(alternativeElements, objectives);

			var size: PrimitiveObjective = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'size';
			})[0];

			var area: PrimitiveObjective = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'area';
			})[0];

			expect(alternatives).to.have.length(6);

			alternatives.forEach((alternative: Alternative) => {
				if (alternative.getName() === 'Sheraton') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('nightlife');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(350.0);
					expect(alternative.getDescription()).to.equal("Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'BestWestern') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('nightlife');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(200);
					expect(alternative.getDescription()).to.equal("Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.");
				} else if (alternative.getName() === 'Hyatt') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('beach');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(275.0);
					expect(alternative.getDescription()).to.equal("Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.");
				} else if (alternative.getName() === 'Marriott') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('airport');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(200);
					expect(alternative.getDescription()).to.equal("The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'HolidayInn') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('airport');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(237.5);
					expect(alternative.getDescription()).to.equal("The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'Ramada') {
					expect(alternative.getObjectiveValue(area.getName())).to.equal('beach');
					expect(alternative.getObjectiveValue(size.getName())).to.equal(312.5);
					expect(alternative.getDescription()).to.equal("1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control");
				}
			});
		});	

	});

	describe('parseUser(xmlDocument: Document, objectives: PrimitiveObjective[])', () => {
		var objectives: PrimitiveObjective[];
		var size: PrimitiveObjective;
		var area: PrimitiveObjective; 
		var rate: PrimitiveObjective;
		var skytrainDistance: PrimitiveObjective;
		var internetAccess: PrimitiveObjective;

		before(function() {
			var valueChart: ValueChart = new ValueChart('', '', '');
			valueChart.setRootObjectives(valueChartParser.parseObjectives((<any>xmlDocument.querySelector('Criteria')).children));
			objectives = valueChart.getAllPrimitiveObjectives();

			size = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'size';
			})[0];

			area = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'area';
			})[0];

			rate = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'rate';
			})[0];

			skytrainDistance = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'skytrain-distance';
			})[0];

			internetAccess = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'internet-access';
			})[0];
		});

		it('should parse the User WeightMap field correctly from the document base element', () => {
			var user: User = valueChartParser.parseUser(xmlDocument, objectives);
			var weightMap: WeightMap = user.getWeightMap();

			expect(weightMap.getObjectiveWeight(size.getName())).to.equal(0.04);
			expect(weightMap.getObjectiveWeight(area.getName())).to.equal(0.46);
			expect(weightMap.getObjectiveWeight(rate.getName())).to.equal(0.2);
			expect(weightMap.getObjectiveWeight(skytrainDistance.getName())).to.equal(0.09);
			expect(weightMap.getObjectiveWeight(internetAccess.getName())).to.equal(0.21);
		});

		it('should parse the User ScoreFunctionmap field correctly from the document base element', () => {
			var user: User = valueChartParser.parseUser(xmlDocument, objectives);
			var scoreFunctionMap: ScoreFunctionMap = user.getScoreFunctionMap();

			var sizeScoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> scoreFunctionMap.getObjectiveScoreFunction(size.getName());
			var areaScoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> scoreFunctionMap.getObjectiveScoreFunction(area.getName());
			var rateScoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> scoreFunctionMap.getObjectiveScoreFunction(rate.getName());
			var skytrainDistanceScoreFunction: ContinuousScoreFunction = <ContinuousScoreFunction> scoreFunctionMap.getObjectiveScoreFunction(skytrainDistance.getName());
			var internetScoreFunction: DiscreteScoreFunction = <DiscreteScoreFunction> scoreFunctionMap.getObjectiveScoreFunction(internetAccess.getName());

			// Size
			expect(sizeScoreFunction.getScore(200.0)).to.equal(0.0);
			expect(sizeScoreFunction.getScore(237.5)).to.equal(0.25);
			expect(sizeScoreFunction.getScore(275.0)).to.equal(0.5);
			expect(sizeScoreFunction.getScore(312.5)).to.equal(0.75);
			expect(sizeScoreFunction.getScore(350.0)).to.equal(1.0);

			// area
			expect(areaScoreFunction.getScore('nightlife')).to.equal(0.5);
			expect(areaScoreFunction.getScore('beach')).to.equal(1.0);
			expect(areaScoreFunction.getScore('airport')).to.equal(0.0);

			// rate
			expect(rateScoreFunction.getScore(100.0)).to.equal(1.0);
			expect(rateScoreFunction.getScore(125.0)).to.equal(0.75);
			expect(rateScoreFunction.getScore(150.0)).to.equal(0.5);
			expect(rateScoreFunction.getScore(175.0)).to.equal(0.25);
			expect(rateScoreFunction.getScore(200.0)).to.equal(0.0);

			// skytrain distance
			expect(skytrainDistanceScoreFunction.getScore(1.0)).to.equal(1.0);
			expect(skytrainDistanceScoreFunction.getScore(3.0)).to.equal(0.75);
			expect(skytrainDistanceScoreFunction.getScore(5.0)).to.equal(0.5);
			expect(skytrainDistanceScoreFunction.getScore(7.0)).to.equal(0.25);
			expect(skytrainDistanceScoreFunction.getScore(9.0)).to.equal(0.0);

			// internet connection
			expect(internetScoreFunction.getScore('none')).to.equal(0.0);
			expect(internetScoreFunction.getScore('highspeed')).to.equal(1.0);
			expect(internetScoreFunction.getScore('lowspeed')).to.equal(0.24500000476837158);


		});
	});


	describe('parseValueChart(xmlString: string)', () => {
		var objectives: PrimitiveObjective[];
		var alternativeElements: Element[];
		var objectiveElements: Element;
		var objectiveColors: any;

		before(function() {
			var tempValueChart: ValueChart = new ValueChart('', '', '');
			tempValueChart.setRootObjectives(valueChartParser.parseObjectives((<any>xmlDocument.querySelector('Criteria')).children));
			objectives = tempValueChart.getAllPrimitiveObjectives();
			objectiveElements = (<any>xmlDocument.querySelector('Criteria')).children[0];

			alternativeElements = (<any> xmlDocument.querySelector('Alternatives')).children;

			objectiveColors = {
				'area': 'rgb(1, 102, 94)',
				'skytrain-distance': 'rgb(103, 169, 207)',
				'size': 'rgb(103, 0, 13)',
				'internet-access': 'rgb(227, 26, 28)',
				'rate': 'rgb(254, 196, 79)'
			};
		})
		
		it('should parse the xml (in string form) to produce a complete ValueChart', () => {
			var valueChart: ValueChart = valueChartParser.parseValueChart(xmlDocument);
			var user: User = valueChartParser.parseUser(xmlDocument, objectives);
			var alternatives: Alternative[] = valueChartParser.parseAlternatives(alternativeElements, objectives);
			var rootObjectives: Objective[] = valueChartParser.parseObjectives([objectiveElements]);

			expect(valueChart.getName()).to.equal('Hotel');
			expect(valueChart.getAlternatives()).to.deep.equal(alternatives);
			expect(valueChart.getUsers()[0]).to.deep.equal(user);
			expect(valueChart.getRootObjectives()).to.have.length(1);
			expect(valueChart.getRootObjectives()[0].getName()).to.equal('Hotel');

			var primitiveObjectives: PrimitiveObjective[] = valueChart.getAllPrimitiveObjectives();

			primitiveObjectives.forEach((objective: PrimitiveObjective) => {
				expect(objective.getColor()).to.equal(objectiveColors[objective.getName()]);
			});

		});

	});

});

*/

