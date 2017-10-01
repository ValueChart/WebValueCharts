/*
* @Author: aaronpmishkin
* @Date:   2016-08-22 21:25:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 12:15:29
*/

// Import Libraries and Middleware:
import * as express 								from 'express';
var timers = require('timers');

// Import Utilities:
import { HostEventEmitter, hostEventEmitter } 		from '../utilities/HostEventEmitters';
import { HostConnectionStatus, hostConnections }	from '../utilities/HostConnections';
import { HostMessage, MessageType}					from '../../client/src/types';


/*
	This function is the handler for the Host WebSocket. It is exported from here and then attached the '/host/:chart' socket
	in WebValueCharts.ts. The host WebSocket implements two way communication between the server and a client hosting a ValueChart.
	Both sides may send string messages to the other at the same time, meaning the connection is full-duplex.
	The client-side initiates the connection when a user intends to host a ValueChart. After this point, the back-end uses this
	WebSocket to notify the hosting client of any changes to the ValueChart that was hosted. This allows the client to be updated
	when users join a ValueChart, change their preferences, and leave without polling the back-end. Note that every client
	that hosts a ValueChart has its own WebSocket connection. They are NOT shared.
*/
export var hostWebSocket = (ws: any, req: express.Request) => {
	// The code runs when the client first initiates the connection. All initialization code for the WebSocket must go here:
	var chartId: string = req.params.chart;
	// Initialize the event listeners that send messages to the client in response to changes to the hosted ValueChart.
	var eventListeners: any[] = initEventListeners(chartId, ws);
	hostConnections.set(chartId, { chartId: chartId, connectionStatus: 'open'});
	// Send message confirming successful connection:
	ws.send(JSON.stringify({ data: 'complete', chartId: chartId, type: MessageType.ConnectionInit }));

	// Register a timer to send a KeepConnection message to the client every five seconds. These messages a are hack used to keep 
	// the websocket open. It seems that the websocket will silently close if messages are continuously being exchanged between the server and client.
	var connectionTimer = timers.setInterval(() => {
		ws.send(JSON.stringify({ type: MessageType.KeepConnection, chartId: chartId, data: 'Keep connection Open' }));
	}, 5000);

	// Register an event handler to handle message events. This handler will be called whenever the client sends a message to 
	// the WebSocket.
	ws.on('message', (msg: string) => {
		var hostMessage: HostMessage = JSON.parse(msg);
		// Handle the different messages types:
		switch (hostMessage.type) {
			case MessageType.ConnectionInit:
				// Do nothing. The client should not send ConnectionInit messages.
				break;
			default:
				// Do nothing. The message is not of a known type.
				break;
			// The client has replied to the KeepConnection message sent by the server. Nothing needs to be done about this.
			// The client will reply to every KeepConnection message.
			case MessageType.KeepConnection:
				// Do nothing.
				break;
		}
	});

	// Register an event handler to handle the WebSocket close event. This event is fired when the client closes the WebSocket connection
	// with the back-end.
	ws.on('close', () => {
		timers.clearInterval(connectionTimer);
		// Cleanup the event listeners. They need to be removed so that the back-end does not try to send messages to the client via a closed WebSocket.
		eventListeners.forEach((listener: any) => {
			hostEventEmitter.removeListener(listener.eventName, listener.listener);
		});
	});
};


// This function initializes the event listeners that send messages to the client in response to changes to the hosted ValueChart.
// The events that this function assigns event listeners to are fired by the routes in ValueCharts.routes.ts.
var initEventListeners = (chartId: string, ws: any): any[] => {
	
	// Send a message to the client whenever a user is added to the hosted ValueChart. The new user object is included in the message.
	var addedListener = (user: any) => {
		console.log('User added event detected');
		ws.send(JSON.stringify({ type: MessageType.UserAdded, data: user, chartId: chartId }));
	};

	// Send a message to the client whenever a user is removed from the hosted ValueChart. The name of the removed user is included in the message.
	var removedListener = (username: string) => {
		console.log('User removed event detected');
		ws.send(JSON.stringify({ type: MessageType.UserRemoved, data: username, chartId: chartId }));
	};

	// Send a message to the client whenever a user in the hosted ValueChart is changed. The changed user object is included in the message. 
	var changedListener = (user: any) => {
		console.log('User changed event detected');
		ws.send(JSON.stringify({ type: MessageType.UserChanged, data: user, chartId: chartId }));
	};

	var structureChangedListener = (valueChart: any) => {
		console.log('Structure changed event detected');
		ws.send(JSON.stringify({ type: MessageType.StructureChanged, data: valueChart, chartId: chartId }));
	}

	// Attach the handlers defined above to the correct events.
	hostEventEmitter.on(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, addedListener);

	hostEventEmitter.on(HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, removedListener);

	hostEventEmitter.on(HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, changedListener);

	hostEventEmitter.on(HostEventEmitter.STRUCTURE_CHANGED_EVENT + '-' + chartId, structureChangedListener);


	return [{ listener: addedListener, eventName: HostEventEmitter.USER_ADDED_EVENT + '-' + chartId }, 
			{ listener: removedListener, eventName: HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId }, 
			{ listener: changedListener, eventName: HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId },
			{ listener: structureChangedListener, eventName: HostEventEmitter.STRUCTURE_CHANGED_EVENT + '-' + chartId }];
}