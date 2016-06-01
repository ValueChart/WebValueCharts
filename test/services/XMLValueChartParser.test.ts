/*
* @Author: aaronpmishkin
* @Date:   2016-05-31 15:56:29
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-31 18:02:31
*/

import { XMLValueChartParser } 		from '../../app/resources/services/XMLValueChartParser.service.ts';
import { IndividualValueChart }		from '../../app/resources/model/IndividualValueChart';
import { Alternative }				from '../../app/resources/model/Alternative';
import { Objective } 				from '../../app/resources/model/Objective';
import { PrimitiveObjective } 		from '../../app/resources/model/PrimitiveObjective';
import { AbstractObjective } 		from '../../app/resources/model/AbstractObjective';
import { DiscreteDomain }			from '../../app/resources/model/DiscreteDomain';
import { ContinuousDomain }			from '../../app/resources/model/ContinuousDomain';


declare var expect: any;


describe('XMLValueChartParser', () => {

	var valueChartParser: XMLValueChartParser;
	var xmlDocParser: DOMParser;
	var xmlDocument: Document;

	before(function() {
		valueChartParser = new XMLValueChartParser();
		xmlDocParser = new DOMParser();
		xmlDocument = xmlDocParser.parseFromString(XMLTestString, 'application/xml');
	});


	describe('parseDiscreteDomain(domainNodes: any)', () => {
		var discreteDomainNode: any;

		before(function() {
			discreteDomainNode = xmlDocument.querySelector('Criterion [name=area]').querySelector('Domain'); 
		});

		it('should parse all elements of the domain from the document node and return a DiscreteDomain object', () => {
			var discreteDomain: DiscreteDomain = valueChartParser.parseDiscreteDomain(discreteDomainNode);

			expect(discreteDomain.getElements()).to.have.length(3);
			expect(discreteDomain.getElements()).to.include('nightlife');
			expect(discreteDomain.getElements()).to.include('beach');
			expect(discreteDomain.getElements()).to.include('airport');
		});

	});

	describe('parseContinuousDomain(domainNodes: any)', () => {
		var continuousDomainNode: any;

		before(function() {
			continuousDomainNode = xmlDocument.querySelector('Criterion [name=skytrain-distance]').querySelector('Domain');
		});

		it('should parse the min and max elements of the domain from the document node and return a ContinuousDomain object', () => {
			var continuousDomain: ContinuousDomain = valueChartParser.parseContinuousDomain(continuousDomainNode);

			expect(continuousDomain.getRange()[0]).to.equal(1.0);
			expect(continuousDomain.getRange()[1]).to.equal(9.0);
		});
	});

	describe('parsePrimitiveObjective(primitiveObjectiveNodes: any)', () => {
		var primitiveObjectiveNode: any;

		before(function() {
			primitiveObjectiveNode = xmlDocument.querySelector('Criterion [name=size]');
		});

		it('should parse the objective from the document node, including its domain, and return a PrimitiveObjective object', () => {
			var size: PrimitiveObjective = valueChartParser.parsePrimitiveObjective(primitiveObjectiveNode);

			expect(size.getName()).to.equal('size');
			expect(size.getDomainType()).to.equal('continuous');
			expect(size.objectiveType).to.equal('primitive');
			
			var domainRange: number[] = (<ContinuousDomain>size.getDomain()).getRange();

			expect(domainRange[0]).to.equal(200.0);
			expect(domainRange[1]).to.equal(350.0);			
		});
	});	

	describe('parseAbstractObjective(abstractObjectiveNodes: any)', () => {
		var abstractObjectiveNode: any;


		context('when the AbstractObjective has no children which are also AbstractObjectives', () => {
			
			before(function() {
				abstractObjectiveNode = xmlDocument.querySelector('Criterion [name=location]');
			});

			it('should parse the objective from the document node, including its domain, and all its subObjectives, and return a AbstractObjective object', () => {
				var location: AbstractObjective = valueChartParser.parseAbstractObjective(abstractObjectiveNode);
				
				expect(location.getName()).to.equal('location');
				expect(location.objectiveType).to.equal('abstract');

				expect(location.getDirectSubObjectives()).to.have.length(2);
			});
		});

		context('when the AbstractObjective has children which are also AbstractObjectives', () => {
			
			before(function() {
				abstractObjectiveNode = (<any> xmlDocument.querySelector('Criteria')).children[0];
			});

			it('should parse the objective from the document node, including its domain, and all its subObjectives, and return a AbstractObjective object', () => {
				var hotel: AbstractObjective = valueChartParser.parseAbstractObjective(abstractObjectiveNode);

				expect(hotel.getName()).to.equal('Hotel');
				expect(hotel.objectiveType).to.equal('abstract');

				expect(hotel.getDirectSubObjectives()).to.have.length(3);
				expect(hotel.getAllSubObjectives()).to.have.length(7);

			});
		});
	});

	describe('parseAlternatives(alternativeNodes: any, objectives: PrimitiveObjective[])', () => {
		var objectives: PrimitiveObjective[];
		var alternativeNodes: any;

		before(function() {
			var valueChart: IndividualValueChart = new IndividualValueChart('', '', '');
			valueChart.setRootObjectives(valueChartParser.parseObjectives((<any>xmlDocument.querySelector('Criteria')).children));
			objectives = valueChart.getAllPrimitiveObjectives();

			alternativeNodes = xmlDocument.querySelector('Alternatives')
		});

		it('should parse all of the alternatives from the document node, and the alternatives should have the correct values', () => {
			var alternatives: Alternative[] = valueChartParser.parseAlternatives(alternativeNodes, objectives);

			var size: PrimitiveObjective = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'size';
			})[0];

			var area: PrimitiveObjective = objectives.filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'area';
			})[0];

			expect(alternatives).to.have.length(6);

			alternatives.forEach((alternative: Alternative) => {
				if (alternative.getName() === 'Sheraton') {
					expect(alternative.getObjectiveValue(area)).to.equal('nightlife');
					expect(alternative.getObjectiveValue(size)).to.equal(350.0);
					expect(alternative.getDescription()).to.equal("Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'BestWestern') {
					expect(alternative.getObjectiveValue(area)).to.equal('nightlife');
					expect(alternative.getObjectiveValue(size)).to.equal(200);
					expect(alternative.getDescription()).to.equal("Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.");
				} else if (alternative.getName() === 'Hyatt') {
					expect(alternative.getObjectiveValue(area)).to.equal('beach');
					expect(alternative.getObjectiveValue(size)).to.equal(275.0);
					expect(alternative.getDescription()).to.equal("Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.");
				} else if (alternative.getName() === 'Marriott') {
					expect(alternative.getObjectiveValue(area)).to.equal('airport');
					expect(alternative.getObjectiveValue(size)).to.equal(200);
					expect(alternative.getDescription()).to.equal("The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'HolidayInn') {
					expect(alternative.getObjectiveValue(area)).to.equal('airport');
					expect(alternative.getObjectiveValue(size)).to.equal(237.5);
					expect(alternative.getDescription()).to.equal("The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.");
				} else if (alternative.getName() === 'Ramada') {
					expect(alternative.getObjectiveValue(area)).to.equal('beach');
					expect(alternative.getObjectiveValue(size)).to.equal(312.5);
					expect(alternative.getDescription()).to.equal("1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control");
				}
			});
		});	

	});


	describe('parseValueChart(xmlString: string)', () => {
		
		it('should parse the xml (in string form) to produce a complete value chart', () => {

		});

	});

});







var XMLTestString: string = 

`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts problem="Hotel">
     <Colors>
          <Color b="94" g="102" name="area" r="1"/>
          <Color b="207" g="169" name="skytrain-distance" r="103"/>
          <Color b="13" g="0" name="size" r="103"/>
          <Color b="28" g="26" name="internet-access" r="227"/>
          <Color b="79" g="196" name="rate" r="254"/>
     </Colors>
     <Criteria>
          <Criterion name="Hotel" type="abstract">
               <Criterion name="location" type="abstract">
                    <Criterion name="area" type="primitive" weight="0.46">
                         <Domain type="discrete">
                              <DiscreteValue x="nightlife" y="0.5"/>
                              <DiscreteValue x="beach" y="1.0"/>
                              <DiscreteValue x="airport" y="0.0"/>
                         </Domain>
                         <Description name="area">&lt;![CDATA[&lt;html&gt;
                                   &lt;body&gt;
                                   &lt;h1&gt;Area&lt;/h1&gt;
                                   &lt;ul&gt;
                                   &lt;li&gt;Sheraton: near nightlife&lt;/li&gt;
                                   &lt;li&gt;Best Western: near nightlife&lt;/li&gt;
                                   &lt;li&gt;Hyatt: on the beach&lt;/li&gt;
                                   &lt;li&gt;Marriott: near airport&lt;/li&gt;
                                   &lt;li&gt;Holiday Inn: near airport&lt;/li&gt;
                                   &lt;li&gt;Ramada: on the beach&lt;/li&gt;
                                   &lt;/ul&gt;
                                   &lt;/body&gt;
                                   &lt;/html&gt;]]&gt;
                         </Description>
                    </Criterion>
                    <Criterion name="skytrain-distance" type="primitive" weight="0.09">
                         <Domain type="continuous" unit="blocks">
                              <ContinuousValue x="1.0" y="1.0"/>
                              <ContinuousValue x="3.0" y="0.75"/>
                              <ContinuousValue x="5.0" y="0.5"/>
                              <ContinuousValue x="7.0" y="0.25"/>
                              <ContinuousValue x="9.0" y="0.0"/>
                         </Domain>
                         <Description name="skytrain-distance">&lt;![CDATA[&lt;html&gt;
                                   &lt;body&gt;
                                   &lt;h1&gt;Distance to Skytrain station&lt;/h1&gt;
                                   &lt;h3&gt;unit: blocks&lt;/h3&gt;
                                   &lt;ul&gt;
                                   &lt;li&gt;Sheraton: 7&lt;/li&gt;
                                   &lt;li&gt;Best Western: 2&lt;/li&gt;
                                   &lt;li&gt;Hyatt: 2&lt;/li&gt;
                                   &lt;li&gt;Marriott: 9&lt;/li&gt;
                                   &lt;li&gt;Holiday Inn: 1&lt;/li&gt;
                                   &lt;li&gt;Ramada: 1&lt;/li&gt;
                                   &lt;/ul&gt;
                                   &lt;/body&gt;
                                   &lt;/html&gt;]]&gt;
                         </Description>
                    </Criterion>
               </Criterion>
               <Criterion name="room" type="abstract">
                    <Criterion name="size" type="primitive" weight="0.04">
                         <Domain type="continuous" unit="sq-ft">
                              <ContinuousValue x="200.0" y="0.0"/>
                              <ContinuousValue x="237.5" y="0.25"/>
                              <ContinuousValue x="275.0" y="0.5"/>
                              <ContinuousValue x="312.5" y="0.75"/>
                              <ContinuousValue x="350.0" y="1.0"/>
                         </Domain>
                         <Description name="size">&lt;![CDATA[&lt;html&gt;
                                   &lt;body&gt;
                                   &lt;h1&gt;Room size&lt;/h1&gt;
                                   &lt;h3&gt;unit: square feet&lt;/h3&gt;
                                   &lt;ul&gt;
                                   &lt;li&gt;Sheraton: 350&lt;/li&gt;
                                   &lt;li&gt;Best Western: 200&lt;/li&gt;
                                   &lt;li&gt;Hyatt: 275&lt;/li&gt;
                                   &lt;li&gt;Marriott: 200&lt;/li&gt;
                                   &lt;li&gt;Holiday Inn: 237.5&lt;/li&gt;
                                   &lt;li&gt;Ramada: 312.5&lt;/li&gt;
                                   &lt;/ul&gt;
                                   &lt;/body&gt;
                                   &lt;/html&gt;]]&gt;
                         </Description>
                    </Criterion>
                    <Criterion name="internet-access" type="primitive" weight="0.21">
                         <Domain type="discrete">
                              <DiscreteValue x="none" y="0.0"/>
                              <DiscreteValue x="highspeed" y="1.0"/>
                              <DiscreteValue x="lowspeed" y="0.24500000476837158"/>
                         </Domain>
                         <Description name="internet-access">&lt;![CDATA[&lt;html&gt;
                                   &lt;body&gt;
                                   &lt;h1&gt;Internet access&lt;/h1&gt;
                                   &lt;ul&gt;
                                   &lt;li&gt;Sheraton: high speed (wired)&lt;/li&gt;
                                   &lt;li&gt;Best Western: high speed (wireless)&lt;/li&gt;
                                   &lt;li&gt;Hyatt: low speed (wireless)&lt;/li&gt;
                                   &lt;li&gt;Marriott: low speed (wireless)&lt;/li&gt;
                                   &lt;li&gt;Holiday Inn: none&lt;/li&gt;
                                   &lt;li&gt;Ramada: none&lt;/li&gt;
                                   &lt;/ul&gt;
                                   &lt;/body&gt;
                                   &lt;/html&gt;]]&gt;
                         </Description>
                    </Criterion>
               </Criterion>
               <Criterion name="rate" type="primitive" weight="0.2">
                    <Domain type="continuous" unit="CAD">
                         <ContinuousValue x="100.0" y="1.0"/>
                         <ContinuousValue x="125.0" y="0.75"/>
                         <ContinuousValue x="150.0" y="0.5"/>
                         <ContinuousValue x="175.0" y="0.25"/>
                         <ContinuousValue x="200.0" y="0.0"/>
                    </Domain>
                    <Description name="rate">&lt;![CDATA[&lt;html&gt;
                              &lt;body&gt;
                              &lt;h1&gt;Rate per night&lt;/h1&gt;
                              &lt;h3&gt;unit: CAD&lt;/h3&gt;
                              &lt;ul&gt;
                              &lt;li&gt;Sheraton: 150&lt;/li&gt;
                              &lt;li&gt;Best Western: 100&lt;/li&gt;
                              &lt;li&gt;Hyatt: 200&lt;/li&gt;
                              &lt;li&gt;Marriott: 160&lt;/li&gt;
                              &lt;li&gt;Holiday Inn: 100&lt;/li&gt;
                              &lt;li&gt;Ramada: 120&lt;/li&gt;
                              &lt;/ul&gt;
                              &lt;/body&gt;
                              &lt;/html&gt;]]&gt;
                    </Description>
               </Criterion>
          </Criterion>
     </Criteria>
     <Alternatives>
          <Alternative name="Sheraton">
               <AlternativeValue criterion="area" value="nightlife"/>
               <AlternativeValue criterion="internet-access" value="highspeed"/>
               <AlternativeValue criterion="rate" value="150.0"/>
               <AlternativeValue criterion="skytrain-distance" value="7.0"/>
               <AlternativeValue criterion="size" value="350.0"/>
               <Description name="Sheraton">Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
          </Alternative>
          <Alternative name="BestWestern">
               <AlternativeValue criterion="area" value="nightlife"/>
               <AlternativeValue criterion="internet-access" value="highspeed"/>
               <AlternativeValue criterion="rate" value="100.0"/>
               <AlternativeValue criterion="skytrain-distance" value="2.0"/>
               <AlternativeValue criterion="size" value="200.0"/>
               <Description name="BestWestern">Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>
          </Alternative>
          <Alternative name="Hyatt">
               <AlternativeValue criterion="area" value="beach"/>
               <AlternativeValue criterion="internet-access" value="lowspeed"/>
               <AlternativeValue criterion="rate" value="200.0"/>
               <AlternativeValue criterion="skytrain-distance" value="2.0"/>
               <AlternativeValue criterion="size" value="275.0"/>
               <Description name="Hyatt">Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>
          </Alternative>
          <Alternative name="Marriott">
               <AlternativeValue criterion="area" value="airport"/>
               <AlternativeValue criterion="internet-access" value="lowspeed"/>
               <AlternativeValue criterion="rate" value="160.0"/>
               <AlternativeValue criterion="skytrain-distance" value="9.0"/>
               <AlternativeValue criterion="size" value="200.0"/>
               <Description name="Marriott">The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
          </Alternative>
          <Alternative name="HolidayInn">
               <AlternativeValue criterion="area" value="airport"/>
               <AlternativeValue criterion="internet-access" value="none"/>
               <AlternativeValue criterion="rate" value="100.0"/>
               <AlternativeValue criterion="skytrain-distance" value="1.0"/>
               <AlternativeValue criterion="size" value="237.5"/>
               <Description name="HolidayInn">The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>
          </Alternative>
          <Alternative name="Ramada">
               <AlternativeValue criterion="area" value="beach"/>
               <AlternativeValue criterion="internet-access" value="none"/>
               <AlternativeValue criterion="rate" value="120.0"/>
               <AlternativeValue criterion="skytrain-distance" value="1.0"/>
               <AlternativeValue criterion="size" value="312.5"/>
               <Description name="Ramada">1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>
          </Alternative>
     </Alternatives>
</ValueCharts>`