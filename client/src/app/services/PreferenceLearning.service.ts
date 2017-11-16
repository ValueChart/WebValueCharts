/*
* @Author: aaronpmishkin
* @Date:   2017-08-08 12:01:13
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-08 15:24:26
*/

import { Injectable }                                               	from '@angular/core';

// Import Libraries:
import * as _															from 'lodash';

// Import Application Classes:
import { UserNotificationService }										from './UserNotification.service'; 
import { ValueChartService }											from './ValueChart.service';
import { CurrentUserService }											from './CurrentUser.service';
import { ValueChartViewerService }										from './ValueChartViewer.service';
import { JsonValueChartParser }											from '../utilities';

// Import Model Classes:
import { ValueChart, ChartType }										from '../../model/ValueChart';
import { User }															from '../../model/User';
import { Alternative }													from '../../model/Alternative';
import { PrimitiveObjective }											from '../../model/PrimitiveObjective';


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
		private currentUserService: CurrentUserService,
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
	// initPreferenceLearning(): WebSocket {
	// 	// Open the websocket connection. Note websockets use the ws protocol rather than http(s).
	// 	this.connection = new WebSocket('ws://localhost:8080/ws');
	// 	this.connection.onmessage = this.messageHandler;
	// 	return this.connection;
	// }

	// messageHandler = (msg: MessageEvent) => {
	// 	var result = JSON.parse(msg.data);

	// 	if (result.event === 'connected') {
	// 		let names = _.map(this.valueChartService.getValueChart().getAllPrimitiveObjectives(), (objective: PrimitiveObjective) => objective.getName());
	// 		let message = { "jsonrpc": "2.0", "method": "init_experiment", "data": { "username": this.currentUserService.getUsername(), "col_names": names }, "id": 1 }
	// 		this.connection.send(JSON.stringify(message))
	// 	} else if (result.data && result.data.alternative) {
	// 		if (result.data.alternatives) {
	// 			var alternatives: Alternative[] = [];
	// 			JSON.parse(result.data.alternatives).forEach((alternative: Alternative) => {
	// 				alternatives.push(this.valueChartParser.parseAlternative(alternative, {}));
	// 			});

	// 			this.valueChartService.getValueChart().setAlternatives(alternatives);
	// 			this.valueChartViewerService.getActiveValueChart().setAlternatives(alternatives);
	// 			this.userNotificationService.displayInfo(['Two new alternatives have been added to the ValueChart']);
	// 		} else if (result.data.alternative) {
	// 			let alternative = this.valueChartParser.parseAlternative(JSON.parse(result.data.alternative), {})
	// 			this.valueChartService.getValueChart().addAlternative(alternative);
	// 			this.valueChartViewerService.getActiveValueChart().addAlternative(alternative);
	// 			this.userNotificationService.displayInfo(['A new Alternative has been added to the ValueChart']);
	// 		}
	// 	}
	// } 

	// sampleNewAlternative(index: number) {
	// 	var valueChart = this.valueChartService.getValueChart();
	// 	var user = valueChart.getUser(this.currentUserService.getUsername());
	// 	var weights = user.getWeightMap().getNormalizedWeights(valueChart.getAllPrimitiveObjectives())
	// 	var message = { "jsonrpc": "2.0", "method": "sample_alternative", "data": { "username": user.getUsername(), "current_weights": weights, "index": index }, "id": 1 }
	// 	this.connection.send(JSON.stringify(message))
	// }

	// sampleNewAlternativePair(indices: number[]) {
	// 	var valueChart = this.valueChartService.getValueChart();
	// 	var user = valueChart.getUser(this.currentUserService.getUsername());
	// 	var weights = user.getWeightMap().getNormalizedWeights(valueChart.getAllPrimitiveObjectives())
	// 	var message = { "jsonrpc": "2.0", "method": "sample_pair", "data": { "username": user.getUsername(), "current_weights": weights, "indices": indices }, "id": 1 }
	// 	this.connection.send(JSON.stringify(message))
	// }

	// computeScore(user: User, alternative: Alternative): number {
	// 	var score = 0
	// 	alternative.getAllObjectiveValuePairs().forEach((pair: {objectiveName: string, value: (string | number)}) => {
	// 		score += user.getScoreFunctionMap().getObjectiveScoreFunction(pair.objectiveName).getScore(pair.value) * user.getWeightMap().getObjectiveWeight(pair.objectiveName);
	// 	});

	// 	return score;
	// }


}