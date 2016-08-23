/*
* @Author: aaronpmishkin
* @Date:   2016-07-25 14:16:07
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-25 14:26:44
*/

// Model Classes:
import { User }														from '../model/User';
import { ScoreFunction }											from '../model/ScoreFunction';
import { WeightMap }												from '../model/WeightMap';
import { Alternative }												from '../model/Alternative';
import { Objective }										from '../model/Objective';



export interface ValueChartStateContainer {
	currentUserIsDefined(): boolean;

	getCurrentUser(): User;
	getCurrentUserScoreFunction(objectiveName: string): ScoreFunction;
	getCurrentUserWeightMap(): WeightMap;

	getAlternatives(): Alternative[];
	getRootObjectives(): Objective[];
} 