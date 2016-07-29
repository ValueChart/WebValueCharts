/*
* @Author: aaronpmishkin
* @Date:   2016-07-27 15:49:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-29 13:52:33
*/

// Require Node Libraries:
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


// Import Test Data:
import { JsonGroupHotel }						from '../TestData/ValueChartsData';


describe('ValueCharts.routes', () => {

	var valueChartParser: JsonValueChartParser;
	var user: request.SuperTest<request.Test>;

	var password: string = JsonGroupHotel.password;
	var id: string;

	var alternative: Alternative;

	before(function() {
		valueChartParser = new JsonValueChartParser();

		user = request.agent('http://localhost:3000/');
	});

	describe('Route: /ValueCharts', () => {
		var groupHotel: ValueChart;

		describe('Method: Post', () => {
			it('return a copy of the created resource along with status code 201 if the creation was a succcess', (done) => {
				user.post('ValueCharts').send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(201)
					.expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse._id).to.not.be.undefined;
						expect(valueChartResponse.name).to.equal('Hotel')
						expect(valueChartResponse.users).to.have.length(1);
						expect(valueChartResponse.alternatives).to.have.length(6);

						id = valueChartResponse._id;

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
			});

		});

	});

	describe('Route: /ValueCharts/:Chart', () => {

		describe('Method: Get', () => {
			context('when the ValueChart exists', () => {
				it('should retrieve the ValueChart along with status code 200', (done) => {
					user.get('ValueCharts/' + id + '?password=' + password)
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
					    .expect((res: request.Response) => {
							var valueChartResponse = JSON.parse(res.body.data);

							expect(valueChartResponse).to.not.be.undefined;
							expect(valueChartResponse.name).to.equal('Hotel')
							expect(valueChartResponse.users).to.have.length(1);
							expect(valueChartResponse.alternatives).to.have.length(6);
							expect(valueChartResponse._id).to.equal(id);

						}).end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

			context('when the ValueChart does not exist', () => {
				it('should return status code 404', (done) => {
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
				JsonGroupHotel.name = 'HotelSelectionProblem';
				JsonGroupHotel.users = [JsonGroupHotel.users[0], JsonGroupHotel.users[0]];
				alternative = JsonGroupHotel.alternatives.pop();
			})

			it('should replace the ValueChart, and return the new representation along with status code 200', (done) => {
				user.put('ValueCharts/' + id).send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse._id).to.equal(id);
						expect(valueChartResponse.name).to.equal('HotelSelectionProblem')
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
				it('should return status code 200', (done) => {
					user.delete('ValueCharts/' + id)
						.expect(200)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});

		context('when the ValueChart does not exist', () => {
				it('should return status code 404', (done) => {
					user.delete('ValueCharts/' + 'e910f9c9c759bb6d76faa975')
						.expect(404)
						.end(function(err, res) {
					        if (err) return done(err);
					        done();
					    });
				});
			});
		});

	});

	describe('Route: /ValueCharts/:Chart/structure', () => {

		before(function(done) {
			user.post('ValueCharts').send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);
						id = valueChartResponse._id;
					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
		});

		describe('Method: Get', () => {
			it('should retrieve the ValueChart structure along with status code 200', (done) => {
				user.get('ValueCharts/' + id + '/structure?password=' + password)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
				    .expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse.name).to.equal('HotelSelectionProblem')
						expect(valueChartResponse.users).to.be.undefined;
						expect(valueChartResponse.alternatives).to.have.length(5);
						expect(valueChartResponse.rootObjectives).to.have.length(1);
						expect(valueChartResponse._id).to.equal(id);

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
			});
		});

		describe('Method: Put', () => {
			before(function() {
				JsonGroupHotel.alternatives.push(alternative);
				JsonGroupHotel.name = 'Hotel';
				JsonGroupHotel.rootObjectives.push(JsonGroupHotel.rootObjectives[0].subObjectives[0]);
			});

			it('should replace the ValueChart structure and return the new representation with status code 200', (done) => {
				user.put('ValueCharts/' + id + '/structure').send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
				    .expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse.name).to.equal('Hotel')
						expect(valueChartResponse.users).to.be.undefined;
						expect(valueChartResponse.alternatives).to.have.length(6);
						expect(valueChartResponse.rootObjectives).to.have.length(2);
						expect(valueChartResponse._id).to.equal(id);

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
			
			it('should add the user to the ValueChart and return the added user with status code 201', (done) => {
				user.post('ValueCharts/' + id + '/users/').send(argileJson)
					.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(201)
					    .expect((res: request.Response) => {
							var valueChartResponse = JSON.parse(res.body.data);

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
				it('should get the user along with status code 200', (done) => {
					user.get('ValueCharts/' + id + '/users/Argile')
						.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
						    .expect((res: request.Response) => {
								var valueChartResponse = JSON.parse(res.body.data);

								expect(valueChartResponse).to.not.be.undefined;
								expect(valueChartResponse.username).to.equal('Argile');

							}).end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});

			context('when the user does not exist', () => {
				it('should return status code 404', (done) => {
					user.get('ValueCharts/' + id + '/users/Niel')
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

			it('should replace the user in the ValueChart and return the new representation with status code 200', (done) => {
				user.put('ValueCharts/' + id + '/users/Argile').send(argileJson)
					.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
					    .expect((res: request.Response) => {
							var valueChartResponse = JSON.parse(res.body.data);

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
				it('should delete the user and return status code 200', (done) => {
					user.delete('ValueCharts/' + id + '/users/Argile')
						.set('Accept', 'application/json')
							.expect(200)
						    .end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
			context('when the user does not exist', () => {
				it('should return status code 404', (done) => {
					user.delete('ValueCharts/' + id + '/users/Niel')
						.set('Accept', 'application/json')
							.expect(404)
						    .end(function(err, res) {
						        if (err) return done(err);
						        done();
						    });
				});
			});
		});
	});

	after(function(done) {
		// Remove the test ValueChart from the database.
		user.delete('group/ValueCharts/' + id)
			.expect(200)
			.end(function(err, res) {
		        if (err) return done(err);
		        done();
		    });
	});


});