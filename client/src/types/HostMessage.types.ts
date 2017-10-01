/*
* @Author: aaronpmishkin
* @Date:   2016-07-31 16:48:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-23 16:58:57
*/

import * as model from '../model'

export interface HostMessage {
	type: MessageType;
	data: any;
	chartId: string;
}

export const enum MessageType {
	UserAdded,
	UserChanged,
	UserRemoved,
	StructureChanged,
	ConnectionInit,
	KeepConnection
}