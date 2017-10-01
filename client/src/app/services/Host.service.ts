/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 12:13:00
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:46:12
*/

import { Injectable } 												from '@angular/core';

// Import Libraries:
import * as _														from 'lodash';
import { Observable }												from 'rxjs/Observable';
import { Subscription } 											from 'rxjs/Subscription';
import { Subject }													from 'rxjs/Subject';
import '../utilities/rxjs-operators';

// Import Application Classes:
import { UserNotificationService }									from './UserNotification.service';
import { CurrentUserService }										from './CurrentUser.service';
import { ValueChartService }										from './ValueChart.service';
import { ValidationService }										from './Validation.service';
import { UpdateValueChartService }									from './UpdateValueChart.service';

import { JsonValueChartParser }										from '../utilities';

// Import Model Classes:
import { ValueChart, ChartType }									from '../../model';
import { User }														from '../../model';
import { ScoreFunction }											from '../../model';

// Import Types: 
import { HostMessage, MessageType }									from '../../types';
import { UserRole }													from '../../types';

/*
	This class contains all the methods require to host a ValueChart. A hosted ValueChart is a ValueChart
	that other users, on different clients, can join and submit their preferences to. A hosted ValueChart
	is automatically updated whenever a user joins, leaves, or changes their preferences. It is also updated
	when the ValueChart's owner changes structural aspects of the ValueChart (eg. alternatives, objectives or basic details).

	This class can open and maintain a websocket connection with the server that is used to send and 
	receive messages about the state of a hosted ValueChart and its users. All the functionality for 
	sending these messages and handling messages from the server is located in this class.
*/

@Injectable()
export class HostService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================
	private hostUrl: string = 'host';			// The base URL of the host websocket on the server.

	public hostWebSocket: WebSocket;			// The websocket itself. This field will be undefined/null when websocket is closed.

	private valueChartParser: JsonValueChartParser;	// An instance of the JsonValueChartParser class used to parse data sent
													// via the websocket.


	public userAddedSubject: Subject<User>;
	public userChangedSubject: Subject<User>;
	public userRemovedSubject: Subject<string>;
	public structureChangedSubject: Subject<ValueChart>;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private userNotificationService: UserNotificationService,
		private currentUserService: CurrentUserService,
		private valueChartService: ValueChartService,
		private updateValueChartService: UpdateValueChartService,
		private validationService: ValidationService ) {

		this.valueChartParser = new JsonValueChartParser();

		this.userAddedSubject = new Subject();
		this.userChangedSubject = new Subject();
		this.userRemovedSubject = new Subject();
		this.structureChangedSubject = new Subject();
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	/*
		@param chartId - The Id of the ValueChart that is to be hosted. This MUST be the id returned by the server after creating a ValueChart resource (see ValueChartHttp).
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
		@returns {void}
		@description 	Stops hosting a ValueChart by closing the websocket connection. The server will cleanup the resources associated 
						with the websocket.
	*/
	endCurrentHosting(): void {
		if (!this.hostWebSocket)
			return;
		// Close the websocket. The parameter 1000 indicates that the socket was closed due to normal operation (as opposed to an error).
		this.hostWebSocket.close(1000);

		this.hostWebSocket = null;
	}


	// This is the message handler for the host websocket. 
	hostMessageHandler = (msg: MessageEvent) => {

		var hostMessage: HostMessage = JSON.parse(msg.data);	// Messages are always stringified JSON that must be parsed.

		// Handle the message depending on its type. 
		switch (hostMessage.type) {
			// The server is notifying the client that initialization has been completed on the server-side.
			case MessageType.ConnectionInit:
				break;

			// A new user has joined the hosted ValueChart. 
			case MessageType.UserAdded:
				let newUser: User = this.valueChartParser.parseUser(hostMessage.data, this.valueChartService.getValueChart().getObjectiveNameToIdMap());

				if (newUser.getUsername() === this.currentUserService.getUsername())
					return;

				this.valueChartService.getValueChart().setUser(newUser);
				this.userAddedSubject.next(newUser);
				
				break;

			// An existing user has resubmitted their preferences.
			case MessageType.UserChanged:
				let updatedUser: User = this.valueChartParser.parseUser(hostMessage.data, this.valueChartService.getValueChart().getObjectiveNameToIdMap());

				if (updatedUser.getUsername() === this.currentUserService.getUsername())
					return;

				this.valueChartService.getValueChart().setUser(updatedUser);
				this.userChangedSubject.next(updatedUser);
				break;

			// A user has been deleted from the ValueChart.
			case MessageType.UserRemoved:
				let userToDelete: string = hostMessage.data;

				let userIndex: number = this.valueChartService.getValueChart().getUsers().findIndex((user: User) => {
					return user.getUsername() === userToDelete;
				});
				this.valueChartService.getValueChart().getUsers().splice(userIndex, 1);

				this.userRemovedSubject.next(userToDelete);
				break;

			// The ValueChart's owner has changed its structure (i.e. the basic details, the alternatives, or the objectives)
			case MessageType.StructureChanged:
				let newStructure = this.valueChartParser.parseValueChart(hostMessage.data);
				newStructure.setUsers(this.valueChartService.getValueChart().getUsers());
				newStructure.setType(this.valueChartService.getValueChart().getType());

				// Update the ValueChart if the structure has been changed by the owner and there are no errors in the new structure.
				if (this.validationService.validateStructure(newStructure).length === 0 && !_.isEqual(newStructure, this.valueChartService.getValueChart())) { 
					let changes: string[] = this.updateValueChartService.getValueChartChanges(this.valueChartService.getValueChart(), newStructure);
					
					// Notify other users of the changes.
					if (this.currentUserService.getUsername() !== this.valueChartService.getValueChart().getCreator())
						this.userNotificationService.displayInfo(changes);

					// Update the user's preferences.
					let warnings: string[] = [];
					this.valueChartService.getValueChart().getUsers().forEach((user: User) => {
						let userWarnings = this.updateValueChartService.cleanUpUserPreferences(this.valueChartService.getValueChart(), user);
						// Print Warnings ONLY for the current user.
						if (user.getUsername() === this.currentUserService.getUsername())
							warnings = userWarnings;
					});

					this.userNotificationService.displayWarnings(warnings);
					this.structureChangedSubject.next(this.valueChartService.getValueChart());
				}
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