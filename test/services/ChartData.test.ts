/*
* @Author: aaronpmishkin
* @Date:   2016-06-23 10:56:25
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 14:34:47
*/

// Application Classes:
import { ChartDataService, VCRowData, VCCellData, VCLabelData}		from '../../app/resources/services/ChartData.service';
import { XMLValueChartParser } 										from '../../app/resources/services/XMLValueChartParser.service';

// Model Classes:
import { ValueChart }												from '../../app/resources/model/ValueChart';
import { IndividualValueChart }										from '../../app/resources/model/IndividualValueChart';
import { WeightMap }												from '../../app/resources/model/WeightMap';
import { PrimitiveObjective }										from '../../app/resources/model/PrimitiveObjective';


// Test Resources:
var XMLTestString: string = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<ValueCharts problem=\"Hotel\">\n     <Colors>\n          <Color b=\"94\" g=\"102\" name=\"area\" r=\"1\"/>\n          <Color b=\"207\" g=\"169\" name=\"skytrain-distance\" r=\"103\"/>\n          <Color b=\"13\" g=\"0\" name=\"size\" r=\"103\"/>\n          <Color b=\"28\" g=\"26\" name=\"internet-access\" r=\"227\"/>\n          <Color b=\"79\" g=\"196\" name=\"rate\" r=\"254\"/>\n     </Colors>\n     <Criteria>\n          <Criterion name=\"Hotel\" type=\"abstract\">\n               <Criterion name=\"location\" type=\"abstract\">\n                    <Criterion name=\"area\" type=\"primitive\" weight=\"0.46\">\n                         <Domain type=\"discrete\">\n                              <DiscreteValue x=\"nightlife\" y=\"0.5\"/>\n                              <DiscreteValue x=\"beach\" y=\"1.0\"/>\n                              <DiscreteValue x=\"airport\" y=\"0.0\"/>\n                         </Domain>\n                         <Description name=\"area\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Area&lt;/h1&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: near nightlife&lt;/li&gt;\n                                   &lt;li&gt;Best Western: near nightlife&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: on the beach&lt;/li&gt;\n                                   &lt;li&gt;Marriott: near airport&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: near airport&lt;/li&gt;\n                                   &lt;li&gt;Ramada: on the beach&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n                    <Criterion name=\"skytrain-distance\" type=\"primitive\" weight=\"0.09\">\n                         <Domain type=\"continuous\" unit=\"blocks\">\n                              <ContinuousValue x=\"1.0\" y=\"1.0\"/>\n                              <ContinuousValue x=\"3.0\" y=\"0.75\"/>\n                              <ContinuousValue x=\"5.0\" y=\"0.5\"/>\n                              <ContinuousValue x=\"7.0\" y=\"0.25\"/>\n                              <ContinuousValue x=\"9.0\" y=\"0.0\"/>\n                         </Domain>\n                         <Description name=\"skytrain-distance\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Distance to Skytrain station&lt;/h1&gt;\n                                   &lt;h3&gt;unit: blocks&lt;/h3&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: 7&lt;/li&gt;\n                                   &lt;li&gt;Best Western: 2&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: 2&lt;/li&gt;\n                                   &lt;li&gt;Marriott: 9&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: 1&lt;/li&gt;\n                                   &lt;li&gt;Ramada: 1&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n               </Criterion>\n               <Criterion name=\"room\" type=\"abstract\">\n                    <Criterion name=\"size\" type=\"primitive\" weight=\"0.04\">\n                         <Domain type=\"continuous\" unit=\"sq-ft\">\n                              <ContinuousValue x=\"200.0\" y=\"0.0\"/>\n                              <ContinuousValue x=\"237.5\" y=\"0.25\"/>\n                              <ContinuousValue x=\"275.0\" y=\"0.5\"/>\n                              <ContinuousValue x=\"312.5\" y=\"0.75\"/>\n                              <ContinuousValue x=\"350.0\" y=\"1.0\"/>\n                         </Domain>\n                         <Description name=\"size\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Room size&lt;/h1&gt;\n                                   &lt;h3&gt;unit: square feet&lt;/h3&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: 350&lt;/li&gt;\n                                   &lt;li&gt;Best Western: 200&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: 275&lt;/li&gt;\n                                   &lt;li&gt;Marriott: 200&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: 237.5&lt;/li&gt;\n                                   &lt;li&gt;Ramada: 312.5&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n                    <Criterion name=\"internet-access\" type=\"primitive\" weight=\"0.21\">\n                         <Domain type=\"discrete\">\n                              <DiscreteValue x=\"none\" y=\"0.0\"/>\n                              <DiscreteValue x=\"highspeed\" y=\"1.0\"/>\n                              <DiscreteValue x=\"lowspeed\" y=\"0.24500000476837158\"/>\n                         </Domain>\n                         <Description name=\"internet-access\">&lt;![CDATA[&lt;html&gt;\n                                   &lt;body&gt;\n                                   &lt;h1&gt;Internet access&lt;/h1&gt;\n                                   &lt;ul&gt;\n                                   &lt;li&gt;Sheraton: high speed (wired)&lt;/li&gt;\n                                   &lt;li&gt;Best Western: high speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Hyatt: low speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Marriott: low speed (wireless)&lt;/li&gt;\n                                   &lt;li&gt;Holiday Inn: none&lt;/li&gt;\n                                   &lt;li&gt;Ramada: none&lt;/li&gt;\n                                   &lt;/ul&gt;\n                                   &lt;/body&gt;\n                                   &lt;/html&gt;]]&gt;\n                         </Description>\n                    </Criterion>\n               </Criterion>\n               <Criterion name=\"rate\" type=\"primitive\" weight=\"0.2\">\n                    <Domain type=\"continuous\" unit=\"CAD\">\n                         <ContinuousValue x=\"100.0\" y=\"1.0\"/>\n                         <ContinuousValue x=\"125.0\" y=\"0.75\"/>\n                         <ContinuousValue x=\"150.0\" y=\"0.5\"/>\n                         <ContinuousValue x=\"175.0\" y=\"0.25\"/>\n                         <ContinuousValue x=\"200.0\" y=\"0.0\"/>\n                    </Domain>\n                    <Description name=\"rate\">&lt;![CDATA[&lt;html&gt;\n                              &lt;body&gt;\n                              &lt;h1&gt;Rate per night&lt;/h1&gt;\n                              &lt;h3&gt;unit: CAD&lt;/h3&gt;\n                              &lt;ul&gt;\n                              &lt;li&gt;Sheraton: 150&lt;/li&gt;\n                              &lt;li&gt;Best Western: 100&lt;/li&gt;\n                              &lt;li&gt;Hyatt: 200&lt;/li&gt;\n                              &lt;li&gt;Marriott: 160&lt;/li&gt;\n                              &lt;li&gt;Holiday Inn: 100&lt;/li&gt;\n                              &lt;li&gt;Ramada: 120&lt;/li&gt;\n                              &lt;/ul&gt;\n                              &lt;/body&gt;\n                              &lt;/html&gt;]]&gt;\n                    </Description>\n               </Criterion>\n          </Criterion>\n     </Criteria>\n     <Alternatives>\n          <Alternative name=\"Sheraton\">\n               <AlternativeValue criterion=\"area\" value=\"nightlife\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"highspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"150.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"7.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"350.0\"/>\n               <Description name=\"Sheraton\">Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"BestWestern\">\n               <AlternativeValue criterion=\"area\" value=\"nightlife\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"highspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"100.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"2.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"200.0\"/>\n               <Description name=\"BestWestern\">Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"Hyatt\">\n               <AlternativeValue criterion=\"area\" value=\"beach\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"lowspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"200.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"2.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"275.0\"/>\n               <Description name=\"Hyatt\">Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>\n          </Alternative>\n          <Alternative name=\"Marriott\">\n               <AlternativeValue criterion=\"area\" value=\"airport\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"lowspeed\"/>\n               <AlternativeValue criterion=\"rate\" value=\"175.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"9.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"200.0\"/>\n               <Description name=\"Marriott\">The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"HolidayInn\">\n               <AlternativeValue criterion=\"area\" value=\"airport\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"none\"/>\n               <AlternativeValue criterion=\"rate\" value=\"100.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"1.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"237.5\"/>\n               <Description name=\"HolidayInn\">The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>\n          </Alternative>\n          <Alternative name=\"Ramada\">\n               <AlternativeValue criterion=\"area\" value=\"beach\"/>\n               <AlternativeValue criterion=\"internet-access\" value=\"none\"/>\n               <AlternativeValue criterion=\"rate\" value=\"125.0\"/>\n               <AlternativeValue criterion=\"skytrain-distance\" value=\"1.0\"/>\n               <AlternativeValue criterion=\"size\" value=\"312.5\"/>\n               <Description name=\"Ramada\">1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>\n          </Alternative>\n     </Alternatives>\n</ValueCharts>";


declare var expect: any;


describe('ChartDataService', () => {

	var roundingError: number = 0.0001;

	var chartDataService: ChartDataService;
	var valueChartParser: XMLValueChartParser;
	var valueChart: IndividualValueChart;

	var labelData: VCLabelData[];

	before(function() {
		chartDataService = new ChartDataService();
		valueChartParser = new XMLValueChartParser();
		valueChart = <IndividualValueChart> valueChartParser.parseValueChart(XMLTestString);
		chartDataService.setValueChart(valueChart);
	});


	// ============================== Data Formatting Methods ===================================

	describe('getLabelData(valueChart: ValueChart): VCLabelData[]', () => {

		it('it should convert the objective hierarchy into a hierarchy of VCLabelData', () => {
			labelData = chartDataService.getLabelData();

			expect(labelData).to.have.length(1); 							// The objective hierarchy from the XMLTestString has one root objective.
			expect(labelData[0].objective.getName()).to.equal('Hotel');		// The root objective from the XMLTestString should be 'Hotel'
			expect(labelData[0].depth).to.equal(0);							// The root objective should have depth of 0
			expect(labelData[0].depthOfChildren).to.equal(2);				// This objective hierarchy has a ma depth of 3 objectives, so the root objective's children have a max depth of 2.
			expect(labelData[0].weight).to.equal(1);


			var children: VCLabelData[] = labelData[0].subLabelData;

			expect(children).to.have.length(3);

			children.forEach((labelDatum: VCLabelData) => {
				expect(labelDatum.depth).to.equal(1);

				if (labelDatum.objective.getName() === 'rate') {
					expect(labelDatum.depthOfChildren).to.equal(0);
					expect(labelDatum.subLabelData).to.be.undefined;
					expect(labelDatum.weight).to.equal(0.2);
				} else {
					expect(labelDatum.depthOfChildren).to.equal(1);
					expect(labelDatum.subLabelData).to.have.length(2);

					var childrenWeightTotal: number = 0;
					labelDatum.subLabelData.forEach((subLabelDatum: VCLabelData) => {
						expect(subLabelDatum.depth).to.equal(2);
						expect(subLabelDatum.depthOfChildren).to.equal(0);
						expect(subLabelDatum.subLabelData).to.be.undefined;
						childrenWeightTotal += subLabelDatum.weight;

						if (subLabelDatum.objective.getName() === 'size') {
							expect(subLabelDatum.weight).to.equal(0.04);
						} else if (subLabelDatum.objective.getName() === 'internet-access') {
							expect(subLabelDatum.weight).to.equal(0.21);
						} else if (subLabelDatum.objective.getName() === 'skytrain-distance') {
							expect(subLabelDatum.weight).to.equal(0.09);
						} else if (subLabelDatum.objective.getName() === 'area') {
							expect(subLabelDatum.weight).to.equal(0.46);
						}
					});
					expect(labelDatum.weight).to.equal(childrenWeightTotal);
				}
			});
		});
	});

	describe('updateLabelData(labelDatum: VCLabelData)', () => {
		
		context('when some of the PrimitiveObjective weights are changed', () => {
			before(function() {
				var weightMap: WeightMap = valueChart.getUser().getWeightMap();
				chartDataService.setValueChart(valueChart);
				weightMap.setObjectiveWeight('size', 0.1);
				weightMap.setObjectiveWeight('rate', 0.14);
			});

			it('should update the labeld data with the new weights without changing the structure of the data', () => {
				labelData.forEach((labelDatum: VCLabelData) => {
					chartDataService.updateLabelDataWeights(labelDatum);
				});

				var children: VCLabelData[] = labelData[0].subLabelData;

				expect(children).to.have.length(3);
				expect(labelData[0].weight).to.equal(1);


				children.forEach((labelDatum: VCLabelData) => {
					expect(labelDatum.depth).to.equal(1);

					if (labelDatum.objective.getName() === 'rate') {
						expect(labelDatum.depthOfChildren).to.equal(0);
						expect(labelDatum.subLabelData).to.be.undefined;
						expect(labelDatum.weight).to.equal(0.14);
					} else {
						expect(labelDatum.depthOfChildren).to.equal(1);
						expect(labelDatum.subLabelData).to.have.length(2);

						var childrenWeightTotal: number = 0;
						labelDatum.subLabelData.forEach((subLabelDatum: VCLabelData) => {
							expect(subLabelDatum.depth).to.equal(2);
							expect(subLabelDatum.depthOfChildren).to.equal(0);
							expect(subLabelDatum.subLabelData).to.be.undefined;
							childrenWeightTotal += subLabelDatum.weight;

							if (subLabelDatum.objective.getName() === 'size') {
								expect(subLabelDatum.weight).to.equal(0.1);
							} else if (subLabelDatum.objective.getName() === 'internet-access') {
								expect(subLabelDatum.weight).to.equal(0.21);
							} else if (subLabelDatum.objective.getName() === 'skytrain-distance') {
								expect(subLabelDatum.weight).to.equal(0.09);
							} else if (subLabelDatum.objective.getName() === 'area') {
								expect(subLabelDatum.weight).to.equal(0.46);
							}
						});
						expect(labelDatum.weight).to.equal(childrenWeightTotal);
					}
				});
			});
		});

		context('when all of the PrimitiveObjective weights are changed', () => {
			before(function() {
				chartDataService.setValueChart(valueChart);
				var weightMap: WeightMap = valueChart.getUser().getWeightMap();
				weightMap.setObjectiveWeight('size', 0.2);
				weightMap.setObjectiveWeight('rate', 0.75);
				weightMap.setObjectiveWeight('area', 0.9);
				weightMap.setObjectiveWeight('internet-access', 0.335);
				weightMap.setObjectiveWeight('skytrain-distance', 1.2);
			});

			it('should update the labeld data with the new weights without changing the structure of the data', () => {
				labelData.forEach((labelDatum: VCLabelData) => {
					chartDataService.updateLabelDataWeights(labelDatum);
				});

				var children: VCLabelData[] = labelData[0].subLabelData;

				expect(children).to.have.length(3);
				expect(labelData[0].weight).to.be.closeTo(3.385, roundingError);


				children.forEach((labelDatum: VCLabelData) => {
					expect(labelDatum.depth).to.equal(1);

					if (labelDatum.objective.getName() === 'rate') {
						expect(labelDatum.depthOfChildren).to.equal(0);
						expect(labelDatum.subLabelData).to.be.undefined;
						expect(labelDatum.weight).to.equal(0.75);
					} else {
						expect(labelDatum.depthOfChildren).to.equal(1);
						expect(labelDatum.subLabelData).to.have.length(2);

						var childrenWeightTotal: number = 0;
						labelDatum.subLabelData.forEach((subLabelDatum: VCLabelData) => {
							expect(subLabelDatum.depth).to.equal(2);
							expect(subLabelDatum.depthOfChildren).to.equal(0);
							expect(subLabelDatum.subLabelData).to.be.undefined;
							childrenWeightTotal += subLabelDatum.weight;

							if (subLabelDatum.objective.getName() === 'size') {
								expect(subLabelDatum.weight).to.equal(0.2);
							} else if (subLabelDatum.objective.getName() === 'internet-access') {
								expect(subLabelDatum.weight).to.equal(0.335);
							} else if (subLabelDatum.objective.getName() === 'skytrain-distance') {
								expect(subLabelDatum.weight).to.equal(1.2);
							} else if (subLabelDatum.objective.getName() === 'area') {
								expect(subLabelDatum.weight).to.equal(0.9);
							}
						});
						expect(labelDatum.weight).to.equal(childrenWeightTotal);
					}
				});
			});
		});
	});

	describe('getCellData(valueChart: ValueChart, objective: PrimitiveObjective): VCCellData[]', () => {

		var rate: PrimitiveObjective;
		var alternativeNames: string[];
		var values: number[];

		before(function() {
			// Get the rate objective.
			chartDataService.setValueChart(valueChart);
			rate = valueChart.getAllPrimitiveObjectives().filter((objective: PrimitiveObjective) => {
				return objective.getName() === 'rate';
			})[0];

			alternativeNames = ['Sheraton', 'BestWestern', 'Hyatt', 'Marriott', 'HolidayInn', 'Ramada'];
			values = [150.0, 100.0, 200.0, 175.0, 100.0, 125.0];
		});

		it('should format the alternative values for the given objective into cells, where each cell has one user score for each user.', () => {

			var cellData: VCCellData[] = chartDataService.getCellData(rate);

			expect(cellData).to.have.length(6);

			cellData.forEach((cell: VCCellData, index: number) => {
				expect(cell.alternative.getName()).to.equal(alternativeNames[index]);
				expect(cell.value).to.equal(values[index]);
				// This ValueChart is an Individual ValueChart so it should have only one user, and only one user score per alternative.
				expect(cell.userScores).to.have.length(1);
			});

		});

	});

	describe('getRowData(valueChart: ValueChart): VCRowData[]', () => {

		var objectiveNames: string[];

		before(function() {
			chartDataService.setValueChart(valueChart);
			objectiveNames = ['area', 'skytrain-distance', 'size', 'internet-access', 'rate'];
		});

		it(`should format the obejctives from the given ValueChart into rows, where each row is divided one cell for Alernative in the ValueChart
			and each cell has one user score for each user`, () => {

			var rows: VCRowData[] = chartDataService.getRowData();

			expect(rows).to.have.length(5);				// There are five objectives in the hotel ValueChart, so the data should have five rows.

			rows.forEach((row: VCRowData, index: number) => {
				expect(row.cells).to.have.length(6);	// There are six alternatives in the hotel ValueChart, so each row should have 6 cells.

				expect(row.objective.getName()).to.equal(objectiveNames[index]);	// Each row should have the correct objective. Note: The row ordering here comes form the ordering inside the ValueChart, which comes from the XML data.
			
				row.cells.forEach((cell: VCCellData) => {
					expect(cell.userScores).to.have.length(1);	// The ValueChart only has one user, so each cell should have on user score.
				});	
			});
		});
	});


	// ============================== Data Manipulation Methods ===================================

	describe('calculateWeightOffsets(rows: VCRowData[]): VCRowData[]', () => {

		var objectiveNames: string[];
		var weightOffsets: number[];
		var rows: VCRowData[];

		before(function() {
			valueChart = <IndividualValueChart>valueChartParser.parseValueChart(XMLTestString);
			chartDataService.setValueChart(valueChart);
			rows = chartDataService.getRowData();
			objectiveNames = ['area', 'skytrain-distance', 'size', 'internet-access', 'rate'];
			weightOffsets = [0, 0.46, 0.55, 0.59, 0.80];	// These weight offsets were found by summing the weights of all previous rows in the ordering for each row.
															// The weights are ordered the same as the objective names.
		});

		it('should calculate the weight offset of each row as the sum of the weights of the rows coming before it in the array of rows.', () => {

			chartDataService.updateWeightOffsets();

			rows.forEach((row: VCRowData, index: number) => {
				expect(row.objective.getName()).to.equal(objectiveNames[index]);	// Verify the ordering of objectives in the row data.
				expect(row.weightOffset).to.be.closeTo(weightOffsets[index], roundingError);			// Verify that the weights offsets were computed correctly.
			});
		});
	});

	describe('calculateMinLabelWidth(labelData: VCLabelData[], dimensionOneSize: number, displayScoreFunctions: boolean): number', () => {

		var labelData: VCLabelData[];
		var dimensionOneSize: number;

		before(function() {
			valueChart = <IndividualValueChart>valueChartParser.parseValueChart(XMLTestString);
			chartDataService.setValueChart(valueChart);
			labelData = chartDataService.getLabelData();
		});

		context('when score functions are being rendered', () => {

			it('should calculate the proper width of the labels with an offset left for the score functions', () => {
				dimensionOneSize = 100;
				var labelWidth = chartDataService.calculateMinLabelWidth(labelData, dimensionOneSize, true);
				var expectedLabelWidth = (dimensionOneSize / 4);	// The max depth of the labels is 3, + 1 for the score function = 3.
				expect(labelWidth).to.equal(expectedLabelWidth);

				dimensionOneSize = 567;
				var labelWidth = chartDataService.calculateMinLabelWidth(labelData, dimensionOneSize, true);
				var expectedLabelWidth = (dimensionOneSize / 4);	// The max depth of the labels is 3, + 1 for the score function = 3.
				expect(labelWidth).to.equal(expectedLabelWidth);
			});
		});

		context('when score functions are not being rendered', () => {

			it('should calculate the proper width of the labels with no offset left', () => {
				dimensionOneSize = 100;
				var labelWidth = chartDataService.calculateMinLabelWidth(labelData, dimensionOneSize, false);
				var expectedLabelWidth = (dimensionOneSize / 3);	// The max depth of the labels is 3, and with no score function the labels should fill all available space.
				expect(labelWidth).to.equal(expectedLabelWidth);

				dimensionOneSize = 567;
				var labelWidth = chartDataService.calculateMinLabelWidth(labelData, dimensionOneSize, false);
				var expectedLabelWidth = (dimensionOneSize / 3);	// The max depth of the labels is 3, and with no score function the labels should fill all available space.
				expect(labelWidth).to.equal(expectedLabelWidth);
			});
		});
	});
});









