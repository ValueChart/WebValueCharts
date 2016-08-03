/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 12:13:00
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 15:57:02
*/

import { Injectable } 												from '@angular/core';

// Application Classes:
import { ValueChartService }										from './ValueChart.service';

// Model Classes:
import { ValueChart }												from '../model/ValueChart';
import { User }														from '../model/User';

// Utility Classes: 
import { JsonValueChartParser }										from '../utilities/JsonValueChartParser';

// Types: 
import { HostMessage, MessageType }									from '../types/HostMessage';

@Injectable()
export class HostService {
	private hostUrl: string = 'host';

	public userChangesAccepted: boolean = true;
	public hostWebSocket: WebSocket;

	private valueChartParser: JsonValueChartParser;

	constructor(private valueChartService: ValueChartService) { 
			this.valueChartParser = new JsonValueChartParser();
	}

	hostGroupValueChart(chartId: string): WebSocket {
		this.hostWebSocket = new WebSocket('ws://' + window.location.host + '/' + this.hostUrl + '/' + chartId);
		// Send initialization message:
		this.hostWebSocket.onopen = (event: MessageEvent) => { 
			this.hostWebSocket.send(JSON.stringify({ type: MessageType.ConnectionInit, chartId: chartId, data: 'opening-connection'})); 
		}

		this.hostWebSocket.onmessage = this.hostMessageHandler;

		return this.hostWebSocket;
	}	

	setUserChangesAccepted(userChangesAccepted: boolean, chartId: string): void {
		this.userChangesAccepted = userChangesAccepted;
		this.hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, chartId: chartId, data: userChangesAccepted }));
	}

	endCurrentHosting(): void {
		this.hostWebSocket.close(1000);
		this.hostWebSocket = null;
	}


	hostMessageHandler = (msg: MessageEvent) => {
		var hostMessage: HostMessage = JSON.parse(msg.data);
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		switch (hostMessage.type) {
			case MessageType.ConnectionInit:
				
				break;
			
			case MessageType.ChangePermissions:
				
				break;

			case MessageType.UserAdded:
				var newUser: User = this.valueChartParser.parseUser(hostMessage.data);
				valueChart.addUser(newUser);
				
				break;

			case MessageType.UserChanged:
				var updatedUser: User = this.valueChartParser.parseUser(hostMessage.data);
				var userIndex: number = valueChart.getUsers().findIndex((user: User) => {
					return user.getUsername() === updatedUser.getUsername();
				});
				// Delete the old version of the user and replace it with the new one.
				valueChart.getUsers().splice(userIndex, 1, updatedUser);
				
				break;

			case MessageType.UserRemoved:
				var userToDelete: string = hostMessage.data;

				var userIndex: number = valueChart.getUsers().findIndex((user: User) => {
					return user.getUsername() === userToDelete;
				});
				// Delete the user from the ValueChart
				valueChart.getUsers().splice(userIndex, 1);

				break;
			default:
				
				break;
		}
	}
}