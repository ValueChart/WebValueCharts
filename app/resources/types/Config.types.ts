/*
* @Author: aaronpmishkin
* @Date:   2016-08-13 13:46:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-13 14:29:50
*/

export interface InteractionConfig {
	weightResizeType: string;
	reorderObjectives: boolean;
	sortAlternatives: string;
	pumpWeights: string;
	setObjectiveColors: boolean;
}

export interface ViewConfig {
	displayScoreFunctions: boolean;
	displayDomainValues: boolean;
	displayScales: boolean;
	displayTotalScores: boolean;
	displayScoreFunctionValueLabels: boolean;
}