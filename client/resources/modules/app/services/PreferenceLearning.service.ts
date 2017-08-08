/*
* @Author: aaronpmishkin
* @Date:   2017-08-08 12:01:13
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-08 15:24:26
*/

import { Injectable }                                               	  from '@angular/core';

// Import Libraries:
import * as _															from 'lodash';

// Import Application Classes:
import { UserNotificationService }										from './UserNotification.service'; 
import { ValueChartService }											from './ValueChart.service';
import { ValueChartViewerService }										from './ValueChartViewer.service';
import { JsonValueChartParser }											from '../../utilities/classes/JsonValueChartParser';

// Import Model Classes:
import { ValueChart, ChartType }										from '../../../model/ValueChart';
import { User }															from '../../../model/User';
import { Alternative }													from '../../../model/Alternative';


@Injectable()
export class PreferenceLearningService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================
	private connectionURL: string = ':8080/ws';			// The base URL of the host websocket on the server.

	public connection: WebSocket;			// The websocket itself. This field will be undefined/null when websocket is closed.

	private valueChartParser: JsonValueChartParser;	// An instance of the JsonValueChartParser class used to parse data sent
													// via the websocket.

    private scores: number[];

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
		private valueChartService: ValueChartService,
		private valueChartViewerService: ValueChartViewerService) {
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
	initPreferenceLearning(): WebSocket {
		// Open the websocket connection. Note websockets use the ws protocol rather than http(s).
		this.connection = new WebSocket('ws://localhost:8080/ws');
		this.connection.onmessage = this.messageHandler;
		return this.connection;
	}

	messageHandler = (msg: MessageEvent) => {
		var result = JSON.parse(msg.data);
		if (result.event === 'connected') {
			let valueChart = this.valueChartService.getValueChart();
			let message = { "jsonrpc": "2.0", "method": "init_value_chart", "data": { "json_chart": valueChart }, "id": 1 }
			this.connection.send(JSON.stringify(message))
		} else if (result.data && result.data.alternative) {
			let alternative = this.valueChartParser.parseAlternative(result.data.alternative[0])
			this.valueChartService.getValueChart().addAlternative(alternative);
			this.valueChartViewerService.getActiveValueChart().addAlternative(alternative);
			this.userNotificationService.displayInfo(['A new Alternative has been sucessfully added to the ValueChart']);
		}
	} 

	sampleNewAlternative() {
		var valueChart = this.valueChartService.getValueChart();
		var user = valueChart.getUsers()[0];
		var alternatives = valueChart.getAlternatives();

		if (!this.scores) {
			this.scores = []
			alternatives.forEach((alternative: Alternative) => {
				this.scores.push(this.computeScore(user, alternative));
			});
		} else if (this.scores.length < alternatives.length) {
			this.scores.push(this.computeScore(user, alternatives[alternatives.length - 1]));
		}


		var message = { "jsonrpc": "2.0", "method": "sample_alternative", "data": { "chart_name": valueChart.getName(), "alternatives": alternatives, "scores": this.scores }, "id": 1 }

		this.connection.send(JSON.stringify(message))
	}


	computeScore(user: User, alternative: Alternative): number {
		var score = 0
		alternative.getAllObjectiveValuePairs().forEach((pair: {objectiveName: string, value: (string | number)}) => {
			score += user.getScoreFunctionMap().getObjectiveScoreFunction(pair.objectiveName).getScore(pair.value) * user.getWeightMap().getObjectiveWeight(pair.objectiveName);
		});

		return score;
	}


}