/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 10:28:21
*/

import { WeightMap } 			from './WeightMap';
import { ValueFunctionMap }		from './ValueFunctionMap';


export class User {

	private username: string;
	private weightMap: WeightMap; 
	private valueFunctionMap: ValueFunctionMap; 

	constructor(username: string) {
		this.username = username;
	}

	getUsername(): string {
		return this.username;
	}

	setUsername(username: string): void {
		this.username = username;
	}

	getValueFunctionMap(): ValueFunctionMap {
		return this.valueFunctionMap;
	}

	setValueFunctionMap(valueFunctionMap: ValueFunctionMap): void {
		this.valueFunctionMap = valueFunctionMap;
	}

	getWeightMap(): WeightMap {
		return this.weightMap;
	}

	setWeightMap(weightMap: WeightMap): void {
		this.weightMap = weightMap;
	}
}