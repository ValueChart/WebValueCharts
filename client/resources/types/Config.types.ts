/*
* @Author: aaronpmishkin
* @Date:   2016-08-13 13:46:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-01-06 21:22:19
*/

export interface InteractionConfig {
	weightResizeType: string;
	reorderObjectives: boolean;
	sortAlternatives: string;
	pumpWeights: string;
	setObjectiveColors: boolean;
	adjustScoreFunctions: boolean;
}

export interface ViewConfig {
	viewOrientation: string;
	displayScoreFunctions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	displayScoreFunctionValueLabels: boolean;
	displayAverageScoreLines: boolean;
}