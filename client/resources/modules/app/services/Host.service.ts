/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 12:13:00
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 18:00:10
*/

import { Injectable } 												from '@angular/core';

// Import Application Classes:
import { ValueChartService }										from './ValueChart.service';
import { JsonValueChartParser }										from '../../utilities/classes/JsonValueChartParser';

// Import Model Classes:
import { ValueChart }												from '../../../model/ValueChart';
import { User }														from '../../../model/User';
import { ScoreFunction }											from '../../../model/ScoreFunction';

// Import Types: 
import { HostMessage, MessageType }									from '../../../types/HostMessage';

/*
	This class contains all the methods require to host a ValueChart. A hosted ValueChart is a ValueChart
	that other users, on different clients, can join and submit their preferences to. A hosted ValueChart
	is automatically updated whenever a user joins, leaves, or changes their preferences. T

	his class can open and maintain a websocket connection with the server that is used to send and 
	receive messages about the state of a hosted ValueChart and its users. All the functionality for 
	sending these messages and handling messages from the server is located in this class.
*/

@Injectable()
export class HostService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================
	private hostUrl: string = 'host';			// The base URL of the host websocket on the server.

	public userChangesAccepted: boolean = true;	// Whether the hosted ValueChart is currently accepting user changes. 
												// This is used for tracking internal state. Setting this value will not turn
												// off user changes.

	public hostWebSocket: WebSocket;			// The websocket itself. This field will be undefined/null when websocket is closed.

	private valueChartParser: JsonValueChartParser;	// An instance of the JsonValueChartParser class used to parse data sent
													// via the websocket.

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(private valueChartService: ValueChartService) {
		this.valueChartParser = new JsonValueChartParser();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param chartId - The Id of the ValueChart that is to be hosted. This MUST be the id returned by the server after creating a ValueChart resource (see ValueChartHttpService).
		@returns {WebSocket} - The websocket that is being used to send and receive messages from the server about the hosted ValueChart. 
		@description 	Initiates hosting a ValueChart by opening a websocket connection with the server. The hosted ValueChart will
						dynamically update as users submit their preferences.
	*/
	hostGroupValueChart(chartId: string): WebSocket {
		// Open the websocket connection. Note websockets use the ws protocol rather than http(s).
		this.hostWebSocket = new WebSocket('ws://' + window.location.host + '/' + this.hostUrl + '/' + chartId);

		// onmessage is a function that will be called whenever the client receives a message from the server. 
		// The hostMessageHandler is our handler for all messages from the server.
		this.hostWebSocket.onmessage = this.hostMessageHandler;

		return this.hostWebSocket;
	}

	/*
		@param userChangesAccepted - Whether the hosted ValueChart will accept changes from users that have joined it.
		@param chartId - The id of the ValueChart to set user changes permissions on.
		@returns {void}
		@description 	Sends a message to the server via the websocket that sets whether the server will accept changes to preferences
						from users that have joined the ValueChart. If false, existing users will be unable to change their submitted preferences
						and new users will unable to submit their preferences to the ValueChart for the first time. Note that this method 
						should ONLY be called when the websocket is open.
	*/
	setUserChangesAccepted(userChangesAccepted: boolean, chartId: string): void {
		this.userChangesAccepted = userChangesAccepted;
		// Send a message via the websocket that will cause the server to change user permissions for the ValueChart with the given id.
		this.hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, chartId: chartId, data: userChangesAccepted }));
	}

	/*
		@returns {void}
		@description 	Stops hosting a ValueChart by closing the websocket connection. The server will cleanup the resources associated 
						with the websocket.
	*/
	endCurrentHosting(): void {
		// Close the websocket. The parameter 1000 indicates that the socket was closed due to normal operation (as opposed to an error).
		this.hostWebSocket.close(1000);

		this.hostWebSocket = null;
		// Inform the user with a toast that the ValueChart is no longer hosted.
		toastr.warning('ValueChart is no longer hosted');
	}


	// This is the message handler for the host websocket. 
	hostMessageHandler = (msg: MessageEvent) => {

		var hostMessage: HostMessage = JSON.parse(msg.data);	// Messages are always stringified JSON that must be parsed.

		var valueChart: ValueChart = this.valueChartService.getValueChart();

		// Handle the message depending on its type. 
		switch (hostMessage.type) {
			// The server is notifying the client that initialization has been completed on the server-side.
			case MessageType.ConnectionInit:
				toastr.success('ValueChart successfully hosted');
				break;

			// The server will send a message confirming success change of user submission settings. Nothing needs to be done here.
			case MessageType.ChangePermissions:
				break;

			// A new user has joined the hosted ValueChart. 
			case MessageType.UserAdded:
				var newUser: User = this.valueChartParser.parseUser(hostMessage.data);
				this.valueChartService.addUser(newUser);

				toastr.info(newUser.getUsername() + ' has joined the ValueChart');
				break;

			// An existing user has resubmitted their preferences.
			case MessageType.UserChanged:
				var updatedUser: User = this.valueChartParser.parseUser(hostMessage.data);
				var userIndex: number = valueChart.getUsers().findIndex((user: User) => {
					return user.getUsername() === updatedUser.getUsername();
				});

				if (userIndex === -1 ) {
					this.valueChartService.addUser(updatedUser);
					toastr.info(updatedUser.getUsername() + ' has updated their preferences');
				} else {
					// Update the user's preferences by reference. This lets us avoid recomputing the renderer data for the ValueChart directive.
					var oldUser: User = valueChart.getUsers()[userIndex];
					oldUser.getWeightMap().setInternalWeightMap(updatedUser.getWeightMap().getInternalWeightMap());
					oldUser.getScoreFunctionMap().getAllKeyScoreFunctionPairs().forEach((pair: { key: string, scoreFunction: ScoreFunction}) => {
						let newScores = updatedUser.getScoreFunctionMap().getObjectiveScoreFunction(pair.key).getElementScoreMap();
						pair.scoreFunction.setElementScoreMap(newScores);
					});

					toastr.info(updatedUser.getUsername() + ' has updated their preferences');
				}

				break;

			// A user has been deleted from the ValueChart.
			case MessageType.UserRemoved:
				var userToDelete: string = hostMessage.data;

				var userIndex: number = valueChart.getUsers().findIndex((user: User) => {
					return user.getUsername() === userToDelete;
				});
				// Delete the user from the ValueChart
				valueChart.getUsers().splice(userIndex, 1);
				toastr.warning(userToDelete + ' has left the ValueChart');
				break;
			default:

			// A keep connection message was sent by server. These messages a are hack used to keep the websocket open.
			// It seems that the websocket will silently close if messages are continuously being exchanged between the server and client.
			// To keep the socket open the serve sends a KeepConnection message every five seconds and the client replies to each one
			// with another KeepConnection message. These messages carry not data. They only serve to keep the socket open.
			case MessageType.KeepConnection:
				this.hostWebSocket.send(JSON.stringify( { type: MessageType.KeepConnection, data: 'Keep connection Open' } ));
				break;
		}
	}
}