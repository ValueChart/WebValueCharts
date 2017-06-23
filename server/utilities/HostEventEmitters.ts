/*
* @Author: aaronpmishkin
* @Date:   2016-07-29 16:32:51
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-23 14:08:35
*/


import * as events from 'events';

export class HostEventEmitter extends events.EventEmitter {
	static USER_ADDED_EVENT: string = 'userAdded';
	static USER_REMOVED_EVENT: string = 'userRemoved';
	static USER_CHANGED_EVENT: string = 'userChanged';
	static STRUCTURE_CHANGED_EVENT: string = 'structureChanged';
};


export const hostEventEmitter: HostEventEmitter = new HostEventEmitter();

