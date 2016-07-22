/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 15:42:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-21 21:56:34
*/

import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { Alternative }					from '../model/Alternative';
import { User }							from '../model/User';	


export interface RowData {
	objective: PrimitiveObjective;
	weightOffset: number;
	cells: CellData[];
}

export interface CellData {
	alternative: Alternative;
	value: (string | number);
	userScores: UserScoreData[];
}

export interface UserScoreData {
	user: User,
	objective: PrimitiveObjective,
	value: (string | number);
	offset?: number
}

export interface LabelData {
	objective: Objective;
	weight: number;
	depth: number;
	depthOfChildren: number;
	subLabelData?: LabelData[]
}

export interface ViewConfig {
	viewOrientation: string;
	chartComponentWidth: number;
	chartComponentHeight: number;
	dimensionOne: string;
	dimensionTwo: string;
	coordinateOne: string;
	coordinateTwo: string;

	dimensionOneSize: number;
	dimensionTwoSize: number;

	dimensionTwoScale: any;

}
