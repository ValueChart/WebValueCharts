/*
* @Author: aaronpmishkin
* @Date:   2016-05-27 15:07:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-31 15:31:25
*/





export interface ScoreFunction {
	type: string;
	setElementScore(domainElement: number | string, score: number): void;
}