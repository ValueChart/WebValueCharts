/*
* @Author: aaronpmishkin
* @Date:   2016-08-13 13:46:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-01 12:42:09
*/

export interface InteractionConfig {
	weightResizeType: WeightResizeType;
	reorderObjectives: boolean;
	sortAlternatives: SortAlternativesType;
	pumpWeights: PumpType;
	setObjectiveColors: boolean;
	adjustScoreFunctions: boolean;
}

export interface ViewConfig {
	viewOrientation: ChartOrientation;
	scaleAlternatives: boolean;
	displayScoreFunctions: boolean;
	displayWeightDistributions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	displayScoreFunctionValueLabels: boolean;
	displayAverageScoreLines: boolean;
}

export enum ChartOrientation {
	Vertical = 1,
	Horizontal
}

export enum WeightResizeType {
	None,
	Neighbors,
	Siblings
}

export enum PumpType {
	None,
	Decrease,
	Increase
}

export enum SortAlternativesType {
	None,
	ByObjectiveScore,
	Alphabetically,
	Manually,
	Default,
}