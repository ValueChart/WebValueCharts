/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:25:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-01 17:02:11
*/

// Require Node Libraries:
import { expect } 								from 'chai';			// Import Chai's assertions.
import * as request								from 'supertest';		// Import supertest.


describe('Users Routes', () => {

	var user: request.SuperTest<request.Test>;
	var username: string;
	var testUser: any = { username: 'TestUser', password: 'TestingUserRoutes', 'email': 'testing@testing.com' };

	before(function() {
		user = request.agent('http://localhost:3000/');	// Create a new supertest agent. This is what will be used to make http requests to the server endpoints.
														// Notice that the base URL of the server is passed as a parameter and NEVER used again.
	});

	describe('Route: /Users', () => {

		describe('Method: Post', () => {

			context('when the username in question is not taken', () => {

				it('should return a status object with the new user\'s username, password, and login status as well as status code 201', (done: MochaDone) => {
					// Send a post request to the server.
					user.post('Users').send(testUser)
						.set('Accept', 'application/json')	// We will accept JSON as a valid type of response.
						.expect('Content-Type', /json/)		// Assert that the response type is JSON.
						.expect(201)						// Assert that the status set on the response's header is 201: Created
						.expect((res: request.Response) => {	// This is where assertions about the response body are placed.
							var response = res.body.data;

							expect(response.username).to.equal(testUser.username);
							expect(response.password).to.equal(testUser.password);
							expect(response.loginResult).to.be.true;

						}).end(function(err, res) {			
							if (err) return done(err);	// We must return any errors to the Mocha test framework via the done promise because the
														// test is executing asynchronously.
							done();						// Signal to Mocha that the asynchronous test is complete by fulfilling the promise.
						});
				});
			});

			context('when the username in question is taken', () => {

				it('should return status code 401', (done: MochaDone) => {
					user.post('Users').send(testUser)
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});
		});
	});

	describe('Route: Users/login', () => {

		describe('Method: Post', () => {

			context('when the username and password supplied are correct', () => {
				it('should successfully log the user in, and the return a status object with the username, password, and login status as well as status code 200', (done: MochaDone) => {
					user.post('Users/login').send({ username: testUser.username, password: testUser.password })
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
						.expect((res: request.Response) => {
							var response = res.body.data;

							expect(response.username).to.equal(testUser.username);
							expect(response.password).to.equal(testUser.password);
							expect(response.loginResult).to.be.true;

						}).end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});

			context('when the username is correct but the password is not', () => {
				it('should fail to log the user in, and return status code 401', (done: MochaDone) => {
					user.post('Users/login').send({ username: testUser.username, password: 'ThisIsWrong' })
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});

			context('when the username is incorrect and password is correct', () => {
				it('should fail to log the user in, and return status code 401', (done: MochaDone) => {
					user.post('Users/login').send({ username: 'NotARealUser', password: testUser.password })
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});

			context('when the username and password are both incorrect', () => {
				it('should fail to log the user in, and return status code 401', (done: MochaDone) => {
					user.post('Users/login').send({ username: 'NotARealUser', password: 'ThisIsWrong' })
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});
		});
	});

	describe('Route: Users/logout', () => {

		describe('Method: Get', () => {

			it('should log the user out and return a status object with their username, password, and logout status, as well as status code 200', (done: MochaDone) => {

				user.get('Users/logout')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.expect((res: request.Response) => {
						var response = res.body.data;

						expect(response.username).to.equal(testUser.username);
						expect(response.password).to.equal(testUser.password);
						expect(response.logoutResult).to.be.true;

					}).end(function(err, res) {
						if (err) return done(err);
						done();
					});
			});
		});
	});

	describe('Route: /Users/:user', () => {

		context('when the user is not logged in', () => {

			describe('Method: Get', () => {

				it('should return status code 401 as the user is not authorized', (done: MochaDone) => {
					user.get('Users/' + testUser.username)
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});

			describe('Method: Put', () => {

				it('should return status code 401 as the user is not authorized', (done: MochaDone) => {
					user.put('Users/' + testUser.username).send({ username: testUser.username, password: 'DifferentPassword', email: 'differentEmail@different.com' })
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});
		});

		context('when the user is logged in', () => {

			before(function(done: MochaDone) {
				user.post('Users/login').send({ username: testUser.username, password: testUser.password })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(err, res) {
						if (err) return done(err);
						done();
					});
			});

			describe('Method: Get', () => {

				it('should return the user resource and status code 201', (done: MochaDone) => {
					user.get('Users/' + testUser.username)
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
						.expect((res: request.Response) => {
							var response = res.body.data;

							expect(response.username).to.equal(testUser.username);
							expect(response.password).to.equal(testUser.password);
							expect(response.email).to.equal(testUser.email);

						}).end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});


			describe('Method: Put', () => {

				it('should change the details of the user\'s account', (done: MochaDone) => {
					user.put('Users/' + testUser.username).send({ username: testUser.username, password: 'DifferentPassword', email: 'differentEmail@different.com' })
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
						.expect((res: request.Response) => {
							var response = res.body.data;

							expect(response.username).to.equal(testUser.username);
							expect(response.password).to.equal('DifferentPassword');
							expect(response.email).to.equal('differentEmail@different.com');

						}).end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});

			describe('Method: Delete', () => {

				before(function(done: MochaDone) {
					user.get('Users/logout')
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});

				context('when the user to delete exists', () => {

					it('should delete the user and return status code 200', (done: MochaDone) => {
						user.delete('Users/' + testUser.username)
							.set('Accept', 'application/json')
							.expect(200)
							.end(function(err, res) {
								if (err) return done(err);
								done();
							});
					});
				});


				context('when the user to delete does not exist', () => {

					it('should return status code 200 (because delete is idempotent)', (done: MochaDone) => {
						user.delete('Users/' + testUser.username)
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
	});

	describe('Route: /Users/:user/ValueCharts', () => {

		context('when the user is not logged in', () => {

			describe('Method: Get', () => {

				it('should retrieve the ValueCharts associated with the logged-in user as well as status code 200', (done: MochaDone) => {
					user.get('Users/amishkin/ValueCharts')
						.set('Accept', 'application/json')
						.expect(401)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});
		});

		context('when the user is logged in', () => {

			describe('Method: Get', () => {

				before(function(done: MochaDone) {
					user.post('Users/login').send({ username: 'amishkin', password: 'temp' })
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});

				it('should retrieve the ValueCharts associated with the logged-in user as well as status code 200', (done: MochaDone) => {
					user.get('Users/amishkin/ValueCharts')
						.set('Accept', 'application/json')
						.expect('Content-Type', /json/)
						.expect(200)
						.expect((res: request.Response) => {
							var response = res.body.data;
							expect(response).to.not.be.undefined;
							expect(response.length).not.equal(0);

						}).end(function(err, res) {
							if (err) return done(err);
							done();
						});
				});
			});
		});
	});
});
