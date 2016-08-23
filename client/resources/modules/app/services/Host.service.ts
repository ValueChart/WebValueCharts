/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 12:13:00
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 16:10:10
*/

import { Injectable } 												from '@angular/core';

// Application Classes:
import { ValueChartService }										from './ValueChart.service';
import { JsonValueChartParser }										from '../../utilities/classes/JsonValueChartParser';

// Model Classes:
import { ValueChart }												from '../../../model/ValueChart';
import { User }														from '../../../model/User';
import { ScoreFunction }											from '../../../model/ScoreFunction';

// Types: 
import { HostMessage, MessageType }									from '../../../types/HostMessage';

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
		toastr.warning('ValueChart is no longer hosted');
	}


	hostMessageHandler = (msg: MessageEvent) => {
		var hostMessage: HostMessage = JSON.parse(msg.data);
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		switch (hostMessage.type) {
			case MessageType.ConnectionInit:
				toastr.success('ValueChart successfully hosted');
				break;

			case MessageType.ChangePermissions:
				break;

			case MessageType.UserAdded:
				var newUser: User = this.valueChartParser.parseUser(hostMessage.data);
				this.valueChartService.addUser(newUser);

				toastr.info(newUser.getUsername() + ' has joined the ValueChart');
				break;

			case MessageType.UserChanged:
				var updatedUser: User = this.valueChartParser.parseUser(hostMessage.data);
				var userIndex: number = valueChart.getUsers().findIndex((user: User) => {
					return user.getUsername() === updatedUser.getUsername();
				});

				if (userIndex === -1 ) {
					this.valueChartService.addUser(updatedUser);
					toastr.info(updatedUser.getUsername() + ' has updated their preferences');
				} else {
					// Update the user's preferences.
					var oldUser: User = valueChart.getUsers()[userIndex];
					oldUser.getWeightMap().setInternalWeightMap(updatedUser.getWeightMap().getInternalWeightMap());
					oldUser.getScoreFunctionMap().getAllKeyScoreFunctionPairs().forEach((pair: { key: string, scoreFunction: ScoreFunction}) => {
						let newScores = updatedUser.getScoreFunctionMap().getObjectiveScoreFunction(pair.key).getElementScoreMap();
						pair.scoreFunction.setElementScoreMap(newScores);
					});

					toastr.info(updatedUser.getUsername() + ' has updated their preferences');
				}

				break;

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

			case MessageType.KeepConnection:
				this.hostWebSocket.send(JSON.stringify( { type: MessageType.KeepConnection, data: 'Keep connection Open' } ));
				break;
		}
	}

	updateUser(newVersion: User, oldVersion: User) {
		// This shouldn't change, but update it anyway.
		oldVersion.setUsername(newVersion.getUsername());
		oldVersion.setWeightMap(newVersion.getWeightMap());
		oldVersion.setScoreFunctionMap(newVersion.getScoreFunctionMap());
	}
}