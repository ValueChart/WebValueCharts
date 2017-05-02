/*
* @Author: aaronpmishkin
* @Date:   2016-07-27 15:49:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-01-03 13:52:44
*/

// Require Node Libraries:
import { expect } 								from 'chai';
import * as request								from 'supertest';

// Import Utility Classes:
import { JsonValueChartParser }					from '../../client/resources/modules/utilities/classes/JsonValueChartParser';

// Import Model Classes:
import { ValueChart }							from '../../client/resources/model/ValueChart';
import { Alternative }							from '../../client/resources/model/Alternative';
import { User }									from '../../client/resources/model/User';
import { WeightMap }							from '../../client/resources/model/WeightMap';
import { ScoreFunctionMap }						from '../../client/resources/model/ScoreFunctionMap';


// Import Test Data:
import { JsonGroupHotel }						from '../testData/ValueChartsData';


describe('ValueCharts Routes', () => {

	var valueChartParser: JsonValueChartParser;
	var user: request.SuperTest<request.Test>;

	var password: string = JsonGroupHotel.password;
	var chartId: string;

	var alternative: Alternative;

	before(function() {
		valueChartParser = new JsonValueChartParser();

		JsonGroupHotel.name = 'TestHotel';

		user = request.agent('http://localhost:3000/');
	});

	describe('Route: /ValueCharts', () => {
		var groupHotel: ValueChart;

		describe('Method: Post', () => {

			context('when the ValuChartName is available', () => {

				it('return a copy of the created resource along with status code 201', (done: MochaDone) => {
					user.post('ValueCharts').send(JsonGroupHotel)
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(201)
						.expect((res: request.Response) => {
							var valueChartResponse = res.body.data;

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse._id).to.not.be.undefined;
							expect(valueChartResponse.name).to.equal('TestHotel')
							expect(valueChartResponse.users).to.have.length(1);
							expect(valueChartResponse.alternatives).to.have.length(6);

							chartId = valueChartResponse._id;

						}).end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

			context('when the ValueChart name is already in use', () => {

				it(' should return status code 400', (done: MochaDone) => {
					user.post('ValueCharts').send(JsonGroupHotel)
						.set('Accept', 'application/json')
						.expect(400)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});
		});
	});

	describe('Route: /ValueCharts/name/:Chart', () => {

		describe('Method: Get', () => {

			context('when the ValueChart name is taken', () => {

				it('should return false to indicate that the name is taken, along with status code 200', (done: MochaDone) => {
					user.get('ValueCharts/' + JsonGroupHotel.name + '/available')
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
						    .expect((res: request.Response) => {

						    	console.log(res.body.data);
								var valueChartResponse = res.body.data;

								expect(valueChartResponse).to.be.false;

							}).end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});

			context('when the ValueChart name is not taken', () => {
				it('shold return true to indicate that the name is free, along with status code 200', (done: MochaDone) => {
					user.get('ValueCharts/AFreeName/available')
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
						    .expect((res: request.Response) => {
								var valueChartResponse = res.body.data;

								expect(valueChartResponse).to.be.true;

							}).end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
		});
	});

	describe('Route: /ValueCharts/:Chart', () => {

		describe('Method: Get', () => {
			context('when the ValueChart exists', () => {
				it('should retrieve the ValueChart along with status code 200', (done: MochaDone) => {
					user.get('ValueCharts/' + chartId + '?password=' + password)
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
					    .expect((res: request.Response) => {
							var valueChartResponse = res.body.data;

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse.name).to.equal('TestHotel')
							expect(valueChartResponse.users).to.have.length(1);
							expect(valueChartResponse.alternatives).to.have.length(6);
							expect(valueChartResponse._id).to.equal(chartId);

						}).end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

			context('when the ValueChart does not exist', () => {
				it('should return status code 404', (done: MochaDone) => {
					user.get('ValueCharts/' + 'e910f9c9c759bb6d76faa975' + '?password=' + password)
						.expect(404)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

		});

		describe('Method: Put', () => {

			before(function() {
				JsonGroupHotel.name = 'TestHotelSelectionProblem';
				JsonGroupHotel.users = [JsonGroupHotel.users[0], JsonGroupHotel.users[0]];
				alternative = JsonGroupHotel.alternatives.pop();
			})

			it('should replace the ValueChart, and return the new representation along with status code 200', (done: MochaDone) => {
				user.put('ValueCharts/' + chartId).send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.expect((res: request.Response) => {
						var valueChartResponse = res.body.data;

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse._id).to.equal(chartId);
						expect(valueChartResponse.name).to.equal('TestHotelSelectionProblem')
						expect(valueChartResponse.users).to.have.length(2);
						expect(valueChartResponse.alternatives).to.have.length(5);

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
				});
		});

		describe('Method: Delete', () => {

			context('when the ValueChart exists', () => {
				it('should return status code 200', (done: MochaDone) => {					user.delete('ValueCharts/' + chartId)
						.expect(200)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

		context('when the ValueChart does not exist', () => {
				it('should return status code 200 (because delete is idempotent', (done: MochaDone) => {
					user.delete('ValueCharts/' + 'e910f9c9c759bb6d76faa975')
						.expect(200)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});
		});

	});

	describe('Route: /ValueCharts/:Chart/structure', () => {

		before(function(done: MochaDone) {
			user.post('ValueCharts').send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect((res: request.Response) => {
						var valueChartResponse = res.body.data;
						chartId = valueChartResponse._id;
					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
		});

		describe('Method: Get', () => {
			it('should retrieve the ValueChart structure along with status code 200', (done: MochaDone) => {
				user.get('ValueCharts/' + 'TestHotelSelectionProblem' + '/structure?password=' + password)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
				    .expect((res: request.Response) => {
						var valueChartResponse = res.body.data;

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse.name).to.equal('TestHotelSelectionProblem')
						expect(valueChartResponse.users).to.be.undefined;
						expect(valueChartResponse.alternatives).to.have.length(5);
						expect(valueChartResponse.rootObjectives).to.have.length(1);
						expect(valueChartResponse._id).to.equal(chartId);

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
			});
		});

		describe('Method: Put', () => {
			before(function() {
				JsonGroupHotel.alternatives.push(alternative);
				JsonGroupHotel.name = 'TestHotel';
				JsonGroupHotel.rootObjectives.push(JsonGroupHotel.rootObjectives[0].subObjectives[0]);
			});

			it('should replace the ValueChart structure and return the new representation with status code 200', (done: MochaDone) => {
				user.put('ValueCharts/' + 'TestHotelSelectionProblem' + '/structure').send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
				    .expect((res: request.Response) => {
						var valueChartResponse = res.body.data;

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse.name).to.equal('TestHotel')
						expect(valueChartResponse.users).to.be.undefined;
						expect(valueChartResponse.alternatives).to.have.length(6);
						expect(valueChartResponse.rootObjectives).to.have.length(2);
						expect(valueChartResponse._id).to.equal(chartId);

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
			});
		});

	});

	describe('Route: /ValueCharts/:Chart/users', () => {
		var argile: User;
		var argileJson: any;

		before(function() {
			argile = new User('Argile');
			argile.setWeightMap(new WeightMap());
			argile.setScoreFunctionMap(new ScoreFunctionMap());

			argileJson = JSON.parse(JSON.stringify(argile));
		});	

		describe('Method: Post', () => {
			
			it('should add the user to the ValueChart and return the added user with status code 201', (done: MochaDone) => {
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
					        done();
					    });
			});
		});

	});


	describe('Route: /ValueCharts/:Chart/users/:user', () => {

		describe('Method: Get', () => {
			context('when the user exists', () => {
				it('should get the user along with status code 200', (done: MochaDone) => {
					user.get('ValueCharts/' + chartId + '/users/Argile')
						.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
						    .expect((res: request.Response) => {
								var valueChartResponse = res.body.data;

								expect(valueChartResponse).to.not.be.undefined;
								expect(valueChartResponse.username).to.equal('Argile');

							}).end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});

			context('when the user does not exist', () => {
				it('should return status code 404', (done: MochaDone) => {
					user.get('ValueCharts/' + chartId + '/users/Niel')
						.set('Accept', 'application/json')
							.expect(404)
						    .end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
		});

		describe('Method: Put', () => {
			var argile: User;
			var argileJson: any;
			
			before(function() {
				argile = new User('Argile');

				argileJson = JSON.parse(JSON.stringify(argile));

				argileJson.scoreFunctionMap = JsonGroupHotel.users[0].scoreFunctionMap;
				argileJson.weightMap = JsonGroupHotel.users[0].weightMap;
			});	

			it('should replace the user in the ValueChart and return the new representation with status code 200', (done: MochaDone) => {
				user.put('ValueCharts/' + chartId + '/users/Argile').send(argileJson)
					.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
					    .expect((res: request.Response) => {
							var valueChartResponse = res.body.data;

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse.username).to.equal('Argile');
							expect(valueChartResponse.weightMap).to.deep.equal(JsonGroupHotel.users[0].weightMap);
							expect(valueChartResponse.scoreFunctionMap).to.deep.equal(JsonGroupHotel.users[0].scoreFunctionMap);

						}).end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
			});
		});

		describe('Method: Delete', () => {
			context('when the user exists', () => {
				it('should delete the user and return status code 200', (done: MochaDone) => {
					user.delete('ValueCharts/' + chartId + '/users/Argile')
						.set('Accept', 'application/json')
							.expect(200)
						    .end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
			context('when the user does not exist', () => {
				it('should return status code 200', (done: MochaDone) => {
					user.delete('ValueCharts/' + chartId + '/users/Niel')
						.set('Accept', 'application/json')
							.expect(200)
						    .end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
		});
	});

	after(function(done: MochaDone) {
		// Remove the test ValueChart from the database.
		user.delete('ValueCharts/' + chartId)
			.expect(200)
			.end(function(err, res) {
		        if (err) return done(err);
		        done();
		    });
	});


});