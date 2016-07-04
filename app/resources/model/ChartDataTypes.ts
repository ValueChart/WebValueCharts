/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 15:42:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-28 15:46:32
*/

import { Objective }					from '../model/Objective';
import { PrimitiveObjective }			from '../model/PrimitiveObjective';
import { Alternative }					from '../model/Alternative';
import { User }							from '../model/User';	


export interface VCRowData {
	objective: PrimitiveObjective;
	weightOffset: number;
	cells: VCCellData[];
}

export interface VCCellData {
	alternative: Alternative;
	value: (string | number);
	userScores: {
		user: User,
		objective: Objective,
		value: (string | number);
		offset?: number
	}[];
}

export interface VCLabelData {
	objective: Objective;
	weight: number;
	depth: number;
	depthOfChildren: number;
	subLabelData?: VCLabelData[]
}