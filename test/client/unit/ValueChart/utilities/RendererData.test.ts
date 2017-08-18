/*
* @Author: aaronpmishkin
* @Date:   2017-05-19 15:13:45
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:52
*/

// Import Testing Resources:
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';

import { expect }										from 'chai';

// Import Test Data: 
import { HotelChartData }								from '../../../../testData/HotelChartData';

// Import Application Classes:
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { XmlValueChartParser }							from '../../../../../client/resources/modules/utilities/classes/XmlValueChart.parser';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { Objective }									from '../../../../../client/resources/model/Objective';
import { User }											from '../../../../../client/resources/model/User';
import { ScoreFunction }								from '../../../../../client/resources/model/ScoreFunction';
import { WeightMap }									from '../../../../../client/resources/model/WeightMap';
import { AbstractObjective }							from '../../../../../client/resources/model/AbstractObjective';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData, LabelData, CellData, UserScoreData }	from '../../../../../client/resources/types/RendererData.types';
import { ChartOrientation, WeightResizeType, SortAlternativesType, PumpType }	from '../../../../../client/resources/types/Config.types';


describe('RendererDataUtility', () => {

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var rendererDataUtility: RendererDataUtility;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;
	var u: RendererUpdate;
	var aaron: User;
	var bob: User;

	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ RendererDataUtility ]
		});

		rendererDataUtility = TestBed.get(RendererDataUtility);

		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		viewConfig = {
    scaleAlternatives: false,
			viewOrientation: ChartOrientation.Vertical,
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		interactionConfig = {
			weightResizeType: WeightResizeType.None,
			reorderObjectives: false,
			sortAlternatives: SortAlternativesType.None,
			pumpWeights: PumpType.None,
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		height = 100;
		width = 100;

		u = {
			el: null,
			valueChart: hotelChart,
			usersToDisplay: hotelChart.getUsers(),
			viewConfig: viewConfig,
			interactionConfig: interactionConfig,
			renderRequired: { value: false },
			height: height,
			width: width,
			x: null,
			y: null,
			maximumWeightMap: null,
			rowData: null,
			labelData: null,
			rendererConfig: null,
			structuralUpdate: null
		}

		aaron = hotelChart.getUsers()[0];

		bob = new User('Bob');
		var bobsWeights = new WeightMap();

		bobsWeights.setObjectiveWeight('area', 0.1);
		bobsWeights.setObjectiveWeight('skytrain-distance', 0.1);
		bobsWeights.setObjectiveWeight('size', 0.4);
		bobsWeights.setObjectiveWeight('internet-access', 0.1);
		bobsWeights.setObjectiveWeight('rate', 0.3);

		bob.setWeightMap(bobsWeights);

		var bobsScoreFunctions = u.valueChart.getUsers()[0].getScoreFunctionMap();
		bobsScoreFunctions.getObjectiveScoreFunction('area').setElementScore('nightlife', 1);
		bobsScoreFunctions.getObjectiveScoreFunction('area').setElementScore('airport', 0);
		bobsScoreFunctions.getObjectiveScoreFunction('internet-access').setElementScore('none', 1);
		bobsScoreFunctions.getObjectiveScoreFunction('internet-access').setElementScore('highspeed', 0);

		bob.setScoreFunctionMap(bobsScoreFunctions);
	});

	describe('private generateMaximumWeightMap(u: RendererUpdate): WeightMap', () => {

		context('when there is only one user in the ValueChart', () => {
			it('should produce a WeightMap that is identical to the WeightMap for that user', () => {
				expect(rendererDataUtility['generateMaximumWeightMap'](u)).to.deep.equal(hotelChart.getUsers()[0].getWeightMap());
			});
		});

		context('when there are two users in the ValueChart', () => {
			it('should produce a WeightMap where each objective weight is the maximum of the weights assigned by the two users to that objective', () => {
				u.valueChart.setUser(bob);
				u.usersToDisplay = u.valueChart.getUsers();

				var maximumWeightMap = rendererDataUtility['generateMaximumWeightMap'](u);

				expect(maximumWeightMap.getObjectiveWeight('area')).to.equal(0.2);
				expect(maximumWeightMap.getObjectiveWeight('skytrain-distance')).to.equal(0.2);
				expect(maximumWeightMap.getObjectiveWeight('size')).to.equal(0.4);
				expect(maximumWeightMap.getObjectiveWeight('internet-access')).to.equal(0.1);
				expect(maximumWeightMap.getObjectiveWeight('rate')).to.equal(0.3);
			});
		});

		context('when there are three users in the ValueChart', () => {
			var max: User;

			it('should produce a WeightMap where each objective weight is the maximum of the weights assigned by the three users to that objective', () => {
				u.valueChart.setUser(bob);
				u.usersToDisplay = u.valueChart.getUsers();

				max = new User('Max');
				var maxsWeights = new WeightMap();

				maxsWeights.setObjectiveWeight('area', 0.8);
				maxsWeights.setObjectiveWeight('skytrain-distance', 0.05);
				maxsWeights.setObjectiveWeight('size', 0.05);
				maxsWeights.setObjectiveWeight('internet-access', 0.05);
				maxsWeights.setObjectiveWeight('rate', 0.05);

				max.setWeightMap(maxsWeights);

				u.valueChart.setUser(max);
				u.usersToDisplay = u.valueChart.getUsers();

				var maximumWeightMap = rendererDataUtility['generateMaximumWeightMap'](u);

				expect(maximumWeightMap.getObjectiveWeight('area')).to.equal(0.8);
				expect(maximumWeightMap.getObjectiveWeight('skytrain-distance')).to.equal(0.2);
				expect(maximumWeightMap.getObjectiveWeight('size')).to.equal(0.4);
				expect(maximumWeightMap.getObjectiveWeight('internet-access')).to.equal(0.1);
				expect(maximumWeightMap.getObjectiveWeight('rate')).to.equal(0.3);
			});
		});
	});

	describe('produceMaximumWeightMap = (u: RendererUpdate): RendererUpdate', () => {
		context('when the ValueChart has no users', () => {
			it('should return the renderer update with the default weight map attached', () => {
				u.valueChart.setUsers([]);
				u.usersToDisplay = u.valueChart.getUsers();
				expect(rendererDataUtility.produceMaximumWeightMap(u).maximumWeightMap).to.deep.equal(u.valueChart.getDefaultWeightMap());
			});
		});

		context('when the ValueChart has exactly one user', () => {
			it('should return the renderer update with that user\'s weight map attached', () => {
				u.valueChart.setUser(aaron);
				u.usersToDisplay = u.valueChart.getUsers();

				expect(rendererDataUtility.produceMaximumWeightMap(u).maximumWeightMap).to.deep.equal(aaron.getWeightMap());
			});
		});

		context('when the chart has more than one user', () => {
			it('should return the renderer update with the maximumWeightMap as created by generateMaximumWeightMap()',() => {
				u.valueChart.setUsers([aaron, bob]);
				u.usersToDisplay = u.valueChart.getUsers();

				expect(rendererDataUtility.produceMaximumWeightMap(u).maximumWeightMap).to.deep.equal(rendererDataUtility['generateMaximumWeightMap'](u));
			});	
		});
	});

	describe('produceRowData = (u: RendererUpdate)', () => {
		context('when there are two users in the ValueChart', () => {
			var rowData: RowData[];
			var numAlternatives: number;

			it('should produce an array of RowData with one row per primitive objective, one cell for each alternative per row, and with two user scores per cell', () => {
				u.valueChart.setUsers([aaron, bob]);
				u.usersToDisplay = u.valueChart.getUsers();

				u = rendererDataUtility.produceMaximumWeightMap(u);
				rowData = rendererDataUtility.produceRowData(u).rowData;
				numAlternatives = u.valueChart.getAlternatives().length;

				var objectives = u.valueChart.getAllPrimitiveObjectives();

				expect(rowData).to.have.length(objectives.length);

				rowData.forEach((rowDatum: RowData, i: number) => {
					expect(rowDatum.objective).to.deep.equal(objectives[i]);

					expect(rowDatum.cells).to.have.length(numAlternatives);
					rowDatum.cells.forEach((cell: CellData) => {
						expect(cell.userScores).to.have.length(2);
					});
				});	
			});

			context('when the viewOrientation is vertical', () => {
				it('should produce an array of RowData with properly computed offsets reversed compared to the order of the rowData', () => {
					u.valueChart.setUsers([aaron, bob]);
					u.usersToDisplay = u.valueChart.getUsers();

					numAlternatives = u.valueChart.getAlternatives().length;
					u = rendererDataUtility.produceMaximumWeightMap(u);
					rowData = rendererDataUtility.produceRowData(u).rowData;

					var objectives = u.valueChart.getAllPrimitiveObjectives();
					var offsets = [new Array(numAlternatives).fill(0, 0, numAlternatives), new Array(numAlternatives).fill(0, 0, numAlternatives)];

					rowData = rowData.reverse();

					rowData.forEach((rowDatum: RowData, i: number) => {
						rowDatum.cells.forEach((cell: CellData, j: number) => {
							cell.userScores.forEach((userScore: UserScoreData, k: number) => {
								expect(userScore.offset).to.equal(offsets[k][j]);

								var score = userScore.user.getScoreFunctionMap().getObjectiveScoreFunction(userScore.objective.getName()).getScore(userScore.value);
								var weight = userScore.user.getWeightMap().getObjectiveWeight(userScore.objective.getName());

								offsets[k][j] += (weight * score);
							});
						});
					});	
				});
			});

			context('when the ViewOrientation is horizontal', () => {

				it('should produce an array of RowData with computed offsets', () => {
					u.valueChart.setUsers([aaron, bob]);
					u.usersToDisplay = u.valueChart.getUsers();

					u.viewConfig.viewOrientation = ChartOrientation.Horizontal

					numAlternatives = u.valueChart.getAlternatives().length;
					u = rendererDataUtility.produceMaximumWeightMap(u);
					rowData = rendererDataUtility.produceRowData(u).rowData;

					var objectives = u.valueChart.getAllPrimitiveObjectives();
					var offsets = [new Array(numAlternatives).fill(0, 0, numAlternatives), new Array(numAlternatives).fill(0, 0, numAlternatives)];

					rowData.forEach((rowDatum: RowData, i: number) => {
						rowDatum.cells.forEach((cell: CellData, j: number) => {
							cell.userScores.forEach((userScore: UserScoreData, k: number) => {
								expect(userScore.offset).to.equal(offsets[k][j]);

								var score = userScore.user.getScoreFunctionMap().getObjectiveScoreFunction(userScore.objective.getName()).getScore(userScore.value);
								var weight = userScore.user.getWeightMap().getObjectiveWeight(userScore.objective.getName());

								offsets[k][j] += (weight * score);
							});
						});
					});	
				});		
			});
		});
	});

	describe('produceLabelData = (u: RendererUpdate)', () => {
		var labelData: LabelData[]
		context('when there is one user in the ValueChart', () => {

			it('should produce label data with one label per objective; each labelDatum\'s weight should be: 1) the sum of the weights of its children; or 2) the weight assigned by the user to the objective', () => {
				u.valueChart.setUsers([aaron]);
				u.usersToDisplay = u.valueChart.getUsers();

				rendererDataUtility.produceMaximumWeightMap(u);
				labelData = rendererDataUtility.produceLabelData(u).labelData;

				var checkLabelData = (labelDatum: LabelData, objective: Objective): number => {
					expect(labelDatum.objective).to.deep.equal(objective);
					if (objective.objectiveType == 'abstract') {
						var subObjectives = (<AbstractObjective> objective).getDirectSubObjectives();
						var weightTotal = 0;
						
						expect(labelDatum.subLabelData.length).to.equal(subObjectives.length);

						labelDatum.subLabelData.forEach((subLabelDatum: LabelData, i: number) => {
							weightTotal += checkLabelData(subLabelDatum, subObjectives[i]);
						});

						expect(labelDatum.weight).to.equal(weightTotal);
					} else {
						expect(labelDatum.weight).to.equal(aaron.getWeightMap().getObjectiveWeight(objective.getName()));
					}

					return labelDatum.weight;
				};

				labelData.forEach((labelData: LabelData, i: number) => checkLabelData(labelData, u.valueChart.getRootObjectives()[i]));
			});
		});

		context('when there are two users in the ValueChart', () => {

			it('should produce label data with one label per objective; each labelDatum\'s weight should be: 1) the sum of the weights of its children; or 2) the weight assigned by the maximumWeightMap to the objective', () => {
				u.valueChart.setUsers([aaron, bob]);
				u.usersToDisplay = u.valueChart.getUsers();
				
				rendererDataUtility.produceMaximumWeightMap(u);
				labelData = rendererDataUtility.produceLabelData(u).labelData;

				var checkLabelData = (labelDatum: LabelData, objective: Objective): number => {
					expect(labelDatum.objective).to.deep.equal(objective);
					if (objective.objectiveType == 'abstract') {
						var subObjectives = (<AbstractObjective> objective).getDirectSubObjectives();
						var weightTotal = 0;
						
						expect(labelDatum.subLabelData.length).to.equal(subObjectives.length);

						labelDatum.subLabelData.forEach((subLabelDatum: LabelData, i: number) => {
							weightTotal += checkLabelData(subLabelDatum, subObjectives[i]);
						});

						expect(labelDatum.weight).to.equal(weightTotal);
					} else {
						expect(labelDatum.weight).to.equal(u.maximumWeightMap.getObjectiveWeight(objective.getName()));
					}

					return labelDatum.weight;
				};

				labelData.forEach((labelData: LabelData, i: number) => checkLabelData(labelData, u.valueChart.getRootObjectives()[i]));
			});
		});
	});

	after(function() {
		TestBed.resetTestingModule();
	})

});





