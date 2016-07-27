/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-11 17:14:55
*/

import { WeightMap } 			from './WeightMap';
import { ScoreFunctionMap }		from './ScoreFunctionMap';


export class User {

	private username: string;
	public color: string;
	private weightMap: WeightMap; 
	private scoreFunctionMap: ScoreFunctionMap; 

	constructor(username: string) {
		if (username !== undefined) {
			this.username = username;
		}
		else {
			this.username = "";
		}
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