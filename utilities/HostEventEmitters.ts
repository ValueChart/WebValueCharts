/*
* @Author: aaronpmishkin
* @Date:   2016-07-29 16:32:51
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-29 16:49:57
*/


import * as events from 'events';

class HostEventEmitter extends events.EventEmitter { 
	USER_ADDED_EVENT: string = 'userAdded';
	USER_REMOVED_EVENT: string = 'userRemoved';
	USER_CHANGED_EVENT: string = 'userChanged';
};

const hostEventEmitter = new HostEventEmitter(); 

module.exports = hostEventEmitter;