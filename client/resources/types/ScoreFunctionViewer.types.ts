/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 15:42:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-10 10:34:57
*/

import { ScoreFunction }							from '../model/ScoreFunction';

export interface DomainElement {
	element: (string | number);
	scoreFunction: ScoreFunction;
	color: string;
}

export interface UserDomainElements {
	elements: DomainElement[];
	scoreFunction: ScoreFunction;
	color: string;
}

export interface ElementUserScoresSummary {
	element: (string | number);
	min: number;
	firstQuartile: number;
	median: number;
	thirdQuartile: number;
	max: number;
}

