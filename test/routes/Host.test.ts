/*
* @Author: aaronpmishkin
* @Date:   2016-07-30 13:47:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-17 22:54:24
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
import { HostMessage,  MessageType}				from '../../app/resources/types/HostMessage';


// Import Test Data:
import { JsonGroupHotel }						from '../testData/ValueChartsData';

describe('WebSocket: /Host', () => {
	var hostUrl: string  = 'ws://localhost:3000/host/';

	var user: request.SuperTest<request.Test>;
	var chartId: string;

	var hostWebSocket: any;


	before(function(done) {
		user = request.agent('http://localhost:3000/');

		JsonGroupHotel.name = 'TestHotel';

		user.post('ValueCharts').send(JsonGroupHotel)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(201)
			.expect((res: request.Response) => {
				var valueChartResponse = res.body.data;
				chartId = valueChartResponse._id;
			}).end(function(err, res) {
		        if (err) return done(err);
		        done();
		    });
	});

	describe('Opening the host connection', () => {

		it('should send a message to the client confirming successful connection with the correct chart ID', (done) => {
			hostWebSocket = new WebSocket(hostUrl + chartId);
			
			hostWebSocket.onmessage = (msg: MessageEvent) => {
				var hostMessage: HostMessage = JSON.parse(msg.data);

				expect(hostMessage.chartId).to.equal(chartId);
				expect(hostMessage.type).to.equal(MessageType.ConnectionInit);
				expect(hostMessage.data).to.equal('complete');
				done();
			};
		});
	});

	describe('changing the userChangesAccepted setting', () => {
		
			it('should send a message to the client confirming the new status is false', (done) => {
				hostWebSocket.onmessage = (msg: MessageEvent) => {
					var hostMessage: HostMessage = JSON.parse(msg.data);

					expect(hostMessage.chartId).to.equal(chartId);
					expect(hostMessage.type).to.equal(MessageType.ChangePermissions);
					expect(hostMessage.data).to.equal(false);
					done();
				};

				hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, data: false, chartId: chartId }));
			});

			it('should send a message to the client confirming the new status is true', (done) => {
				hostWebSocket.onmessage = (msg: MessageEvent) => {
					var hostMessage: HostMessage = JSON.parse(msg.data);

					expect(hostMessage.chartId).to.equal(chartId);
					expect(hostMessage.type).to.equal(MessageType.ChangePermissions);
					expect(hostMessage.data).to.equal(true);
					done();
				};

				hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, data: true, chartId: chartId }));
			});
	});

	describe('attempting to add/remove/change users when userChangesAccepted is false', () => {
		var argile: User;
		var argileJson: any;

		before(function(done) {
			argile = new User('Argile');
			argile.setWeightMap(new WeightMap());
			argile.setScoreFunctionMap(new ScoreFunctionMap());

			argileJson = JSON.parse(JSON.stringify(argile));

			hostWebSocket.onmessage = (msg: MessageEvent) => {
				done();
			};
			hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, data: false, chartId: chartId }));
		});	

		context('when attempting to post a new user', () => {
			it('should return the 403: forbidden status code and not add the user to the ValueChart', (done) => {
				user.post('ValueCharts/' + chartId + '/users/').send(argileJson)
					.set('Accept', 'application/json')
						.expect(403)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
			});
		});

		context('when attempting to delete new user', () => {
			it('should return the 403: forbidden status code and not add the user to the ValueChart', (done) => {
				user.delete('ValueCharts/' + chartId + '/users/Argile')
					.set('Accept', 'application/json')
						.expect(403)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
			});
		});

		context('when attempting to modify a user', () => {
			it('should return the 403: forbidden status code and not add the user to the ValueChart', (done) => {
				user.put('ValueCharts/' + chartId + '/users/Argile').send(argileJson)
					.set('Accept', 'application/json')
						.expect(403)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
			});
		});


		after(function(done) {
			hostWebSocket.onmessage = (msg: MessageEvent) => {
				done();
			};
			hostWebSocket.send(JSON.stringify({ type: MessageType.ChangePermissions, data: true, chartId: chartId }));
		});
	});


	describe('Adding a user to a hosted ValueChart', () => {
		var argile: User;
		var argileJson: any;

		before(function() {
			argile = new User('Argile');
			argile.setWeightMap(new WeightMap());
			argile.setScoreFunctionMap(new ScoreFunctionMap());

			argileJson = JSON.parse(JSON.stringify(argile));
		});	

		it('should send a message to the client with the new user to notify it of the change', (done) => {
			// Add the user to the ValueChart:
			user.post('ValueCharts/' + chartId + '/users/').send(argileJson)
					.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(201)
					    .expect((res: request.Response) => {
							var valueChartResponse = res.body.data;

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse.username).to.equal('Argile');

						}).end(function(err, res) {
					        if (err) return done(err);
					    });

			hostWebSocket.onmessage = (msg: MessageEvent) => { 
				var hostMessage: HostMessage = JSON.parse(msg.data);

				expect(hostMessage.type).to.equal(MessageType.UserAdded);
				expect(hostMessage.chartId).to.equal(chartId);
				expect(hostMessage.data).to.deep.equal(argileJson);
				done();
			}
		});
	});

	describe('Changing a user in a hosted ValueChart', () => {
		var argile: User;
		var argileJson: any;

		before(function() {
			argile = new User('Argile');

			argileJson = JSON.parse(JSON.stringify(argile));
			argileJson.scoreFunctionMap = JsonGroupHotel.users[0].scoreFunctionMap;
			argileJson.weightMap = JsonGroupHotel.users[0].weightMap;
		});	

		it('should send a message to the client with the modified user to notify it of the change', (done) => {
			// Add the user to the ValueChart:
			user.put('ValueCharts/' + chartId + '/users/Argile').send(argileJson)
					.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
					    .expect((res: request.Response) => {
							var valueChartResponse = res.body.data;

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse.username).to.deep.equal('Argile');
							expect(valueChartResponse.weightMap).to.deep.equal(JsonGroupHotel.users[0].weightMap);
							expect(valueChartResponse.scoreFunctionMap).to.deep.equal(JsonGroupHotel.users[0].scoreFunctionMap);
						
						}).end(function(err, res) {
					        if (err) return done(err);
					    });

			hostWebSocket.onmessage = (msg: MessageEvent) => { 
				var hostMessage: HostMessage = JSON.parse(msg.data);

				expect(hostMessage.type).to.equal(MessageType.UserChanged);
				expect(hostMessage.chartId).to.equal(chartId);
				expect(hostMessage.data).to.deep.equal(argileJson);
				done();
			}
		});
	});

	describe('Deleting a user from a hosted ValueChart', () => {

		it('should send a message to the client with the deleted user\'s name to notify it of the change', (done) => {
			// Add the user to the ValueChart:
			user.delete('ValueCharts/' + chartId + '/users/Argile')
						.set('Accept', 'application/json')
						.expect(200)
						.end(function(err, res) {
					        if (err) return done(err);
					    });

			hostWebSocket.onmessage = (msg: MessageEvent) => { 
				var hostMessage: HostMessage = JSON.parse(msg.data);

				expect(hostMessage.type).to.equal(MessageType.UserRemoved);
				expect(hostMessage.chartId).to.equal(chartId);
				expect(hostMessage.data).to.equal('Argile');
				done();
			}
		});
	});

	describe('Closing the host connection', () => {

		it('should successfully terminate the connection', (done) => {
			hostWebSocket.close(1000);
			done();
		});
	});


	after(function(done) {
		// Delete the ValueChart used for testing.
		user.delete('ValueCharts/' + chartId)
			.set('Accept', 'application/json')
			.expect(200)
			.end(function(err, res) {
		        if (err) return done(err);
		        done();
		    });
	});



});




