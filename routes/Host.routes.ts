/*
* @Author: aaronpmishkin
* @Date:   2016-08-22 21:25:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-22 21:26:48
*/

// Import Libraries and Middleware:
import * as express 								from 'express';

// Import Utilities:
import { HostEventEmitter, hostEventEmitter } 		from '../utilities/HostEventEmitters';
import { HostConnectionStatus, hostConnections }	from '../utilities/HostConnections';
import { HostMessage, MessageType}					from '../app/resources/types/HostMessage';


export var hostWebSocket = (ws: any, req: express.Request) => {

	var chartId: string = req.params.chart;

	// Initialize Connection:
	var eventListeners: any[] = initEventListeners(chartId, ws);
	hostConnections.set(chartId, { chartId: chartId, connectionStatus: 'open', userChangesAccepted: true });
	// Send message confirming successful connection:
	ws.send(JSON.stringify({ data: 'complete', chartId: chartId, type: MessageType.ConnectionInit }));

	// This fires whenever the socket receives a message.
	ws.on('message', (msg: string) => {
		var hostMessage: HostMessage = JSON.parse(msg);

		switch (hostMessage.type) {
			case MessageType.ConnectionInit:

				break;
			case MessageType.ChangePermissions:
				hostConnections.get(chartId).userChangesAccepted = hostMessage.data;
				ws.send(JSON.stringify({ data: hostMessage.data, chartId: chartId, type: MessageType.ChangePermissions }));

				break;
			default:

				break;
		}
	});

	// This fires when the socket is closed.
	ws.on('close', () => {
		// Cleanup the event listeners.
		eventListeners.forEach((listener: any) => {
			hostEventEmitter.removeListener(listener.eventName, listener.listener);
		});
	});
};

var initEventListeners = (chartId: string, ws: any): any[] => {
	
	var addedListener = (user: any) => {
		ws.send(JSON.stringify({ type: MessageType.UserAdded, data: user, chartId: chartId }));
	};

	var removedListener = (username: string) => {
		ws.send(JSON.stringify({ type: MessageType.UserRemoved, data: username, chartId: chartId }));
	};

	var changedListener = (user: any) => {
		ws.send(JSON.stringify({ type: MessageType.UserChanged, data: user, chartId: chartId }));
	};

	// Initialize event listeners:
	hostEventEmitter.on(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, addedListener);

	hostEventEmitter.on(HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, removedListener);

	hostEventEmitter.on(HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, changedListener);

	return [{ listener: addedListener, eventName: HostEventEmitter.USER_ADDED_EVENT + '-' + chartId }, 
			{ listener: removedListener, eventName: HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId }, 
			{ listener: changedListener, eventName: HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId }];
}