/*
* @Author: aaronpmishkin
* @Date:   2016-07-29 16:32:51
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-29 20:50:38
*/


import * as events from 'events';

export class HostEventEmitter extends events.EventEmitter { 
	static USER_ADDED_EVENT: string = 'userAdded';
	static USER_REMOVED_EVENT: string = 'userRemoved';
	static USER_CHANGED_EVENT: string = 'userChanged';
};

export const hostEventEmitter = new HostEventEmitter(); 

