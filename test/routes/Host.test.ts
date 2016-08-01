/*
* @Author: aaronpmishkin
* @Date:   2016-07-30 13:47:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-31 17:04:58
*/

// Require Node Libraries:
// This is a node implementation of the standard W3C websocket API. Unfortunately it must be imported in the node style, not ES6.
var WebSocket = require('websocket').w3cwebsocket;

import { expect } 								from 'chai';
import * as request								from 'supertest';
// Utility Classes:
import { JsonValueChartParser }					from '../../app/resources/utilities/JsonValueChartParser';

// Model Classes
import { ValueChart }							from '../../app/resources/model/ValueChart';
import { Alternative }							from '../../app/resources/model/Alternative';
import { User }									from '../../app/resources/model/User';
import { WeightMap }							from '../../app/resources/model/WeightMap';
import { ScoreFunctionMap }						from '../../app/resources/model/ScoreFunctionMap';

// Import Types:
import { HostMessage }							 from '../../app/resources/types/HostMessage';


// Import Test Data:
import { JsonGroupHotel }						from '../TestData/ValueChartsData';

describe('WebSocket: /Host', () => {
	var hostUrl: string  = 'ws://localhost:3000/host/';

	var user: request.SuperTest<request.Test>;
	var chartId: string;

	var hostWebSocket: any;


	before(function(done) {
		console.log(WebSocket);

		user = request.agent('http://localhost:3000/');

		user.post('ValueCharts').send(JsonGroupHotel)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(201)
			.expect((res: request.Response) => {
				var valueChartResponse = JSON.parse(res.body.data);
				chartId = valueChartResponse._id;
			}).end(function(err, res) {
		        if (err) return done(err);
		        done();
		    });
	});

	describe('Action: Opening the Connection', () => {

		it('it should receive a message confirming successful connection with the correct chart ID', (done) => {
			hostWebSocket = new WebSocket(hostUrl + chartId);
			
			hostWebSocket.onopen = (event: MessageEvent) => { hostWebSocket.send(JSON.stringify({ type: 'initialization', chartId: chartId, data: 'opening-connection'})); }

			hostWebSocket.onmessage = (msg: MessageEvent) => {
				var hostMessage: HostMessage = JSON.parse(msg.data);

				expect(hostMessage.chartId).to.equal(chartId);
				expect(hostMessage.type).to.equal('connection-status');
				expect(hostMessage.data).to.equal('open');
				done();
			};

		});

	});

});