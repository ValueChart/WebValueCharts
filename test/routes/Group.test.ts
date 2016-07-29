/*
* @Author: aaronpmishkin
* @Date:   2016-07-27 15:49:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 18:24:50
*/

// Require Node Libraries:
import { expect } 								from 'chai';
import * as request								from 'supertest';
// Utility Classes:
import { JsonValueChartParser }					from '../../app/resources/utilities/JsonValueChartParser';

// Model Classes
import { ValueChart }							from '../../app/resources/model/ValueChart';

// Import Test Data:
import { JsonGroupHotel }							from '../TestData/ValueChartsData';


describe('Group.routes', () => {

	var valueChartParser: JsonValueChartParser;
	var user: request.SuperTest<request.Test>;

	var password: string = JsonGroupHotel.password;
	var id: string;

	before(function() {
		valueChartParser = new JsonValueChartParser();

		user = request.agent('http://localhost:3000/');
	});

	describe('Route: /ValueCharts', () => {
		var groupHotel: ValueChart;

		describe('Method: Post', () => {
			it('return a copy of the created resource along with status code 201 if the creation was a succcess', (done) => {
				user.post('group/ValueCharts').send(JsonGroupHotel)
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
					user.get('group/ValueCharts/' + id + '?password=' + password)
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
					user.get('group/ValueCharts/' + 'e910f9c9c759bb6d76faa975' + '?password=' + password)
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
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
				JsonGroupHotel.name = 'HoteSelectionProblem';
				JsonGroupHotel.users = [JsonGroupHotel.users[0], JsonGroupHotel.users[0]];
				JsonGroupHotel.alternatives.pop();
			})

			it('should replace the ValueChart, and return the new representation along with status code 200', (done) => {
				user.put('group/ValueCharts/' + id).send(JsonGroupHotel)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.expect((res: request.Response) => {
						var valueChartResponse = JSON.parse(res.body.data);

						expect(valueChartResponse).to.not.be.undefined;
						expect(valueChartResponse._id).to.equal(id);
						expect(valueChartResponse.name).to.equal('HoteSelectionProblem')
						expect(valueChartResponse.users).to.have.length(2);
						expect(valueChartResponse.alternatives).to.have.length(5);

					}).end(function(err, res) {
				        if (err) return done(err);
				        done();
				    });
				});
		});

		describe('Method: Delete', () => {

		});

	});

	describe('Route: /ValueCharts/:Chart/structure', () => {

		describe('Method: Get', () => {

		});

		describe('Method: Put', () => {

		});

	});

	describe('Route: /ValueCharts/:Chart/users', () => {

		describe('Method: Post', () => {

		});

		describe('Method: Delete', () => {

		});

	});
});