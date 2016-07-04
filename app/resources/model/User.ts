/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 16:10:39
*/

import { WeightMap } 			from './WeightMap';
import { ScoreFunctionMap }		from './ScoreFunctionMap';


export class User {

	private username: string;
	private weightMap: WeightMap; 
	private scoreFunctionMap: ScoreFunctionMap; 

	constructor(username: string) {
		this.username = username;
	}

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	getScoreFunctionMap(): ScoreFunctionMap {
		return this.scoreFunctionMap;
	}

	setScoreFunctionMap(scoreFunctionMap: ScoreFunctionMap): void {
		this.scoreFunctionMap = scoreFunctionMap;
	}

	getWeightMap(): WeightMap {
		return this.weightMap;
	}

	setWeightMap(weightMap: WeightMap): void {
		this.weightMap = weightMap;
	}
}