/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-11 14:40:09
*/





export interface ScoreFunction {
	type: string;
	setElementScore(domainElement: number | string, score: number): void;
	getScore(domainElement: number | string): number;
	getElementScoreMap(): Map<string | number, number>;
}