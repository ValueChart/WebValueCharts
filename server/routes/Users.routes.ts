/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-04 15:22:41
*/

// Import Libraries and Express Middleware:
import * as express 						from 'express';
import * as path 							from 'path';
import * as MongoDB 						from 'mongodb';
import * as Monk 							from 'monk';
import * as passport 						from 'passport';

export var usersRoutes: express.Router = express.Router();

import { ValueChartStatus }							from '../../client/src/types';


// Create new User by posting to the list of Users. The passport local-signup strategy does the actual creation. See Auth.ts for more information.
usersRoutes.post('/', passport.authenticate('local-signup'), function(req: express.Request, res: express.Response) {
		
	res.status(201)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Login. Doesn't conform to REST principles, but is necessary. The passport local-signin strategy does the actual logging in. See Auth.ts for more information. 
usersRoutes.get('/currentUser', function(req: express.Request, res: express.Response) {

	if (req.isAuthenticated()) {
		res.status(200)
			.json({ data: { username: req.user[0].username, password: req.user[0].password, loginResult: req.isAuthenticated() }});
	} else {
		res.status(200)
			.json({ data: { loginResult: req.isAuthenticated() }});
	}
});


// Login. Doesn't conform to REST principles, but is necessary. The passport local-signin strategy does the actual logging in. See Auth.ts for more information. 
usersRoutes.post('/login', passport.authenticate('local-signin'), function(req: express.Request, res: express.Response) {

	res.status(200)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Logout. Doesn't conform to REST principles, but is necessary.
usersRoutes.get('/logout', function(req: express.Request, res: express.Response) {

	if (req.isAuthenticated()) {
		var body: any = { data: { username: req.user[0].username, password: req.user[0].password, logoutResult: true } };

		// Destroy the current user's session.
		req.session.destroy(function (err) {
			req.session = null;
	    	res.clearCookie('express.sid', { path: '/' });
			req.logOut();
			res.json(body);
		});
	} else {
		res.status(200)
			.json({ data: { loginResult: req.isAuthenticated() }});
	}
});

// Get an existing user.
usersRoutes.get('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;

	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || username !== req.user[0].username) {
		res.status(401).send('Unauthorized');
	} else {
		usersCollection.findOne({ username: username }, function(err: Error, doc: any) {
			if (err) {
				res.status(400)
					.json({ data: err });
			} else if (doc) {
				res.status(200)
					.location('/Users/' + username)
					.json({ data: doc });
			} else {
				res.status(404).send('Not Found');
			}
		});
	}
});

// Update an existing user, or create one if it does not exist.
usersRoutes.put('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;
	
	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || username !== req.user[0].username) {
		res.status(401).send('Unauthorized');
	} else {
		usersCollection.update({ username: username }, (req.body), [], function(err: Error, doc: any) {
			if (err) {
				res.status(400)
					.json({ data: err });

			} else if (doc) {
				req.body._id = doc._id;
				res.status(200)
					.location('/Users/' + username)
					.json({ data: req.body });
			} else {
				res.status(404).send('Not Found');
			}
		});
	}
});

// Delete an existing user. 
usersRoutes.delete('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;

	usersCollection.remove({ username: username }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else {
			res.status(200).send('OK');
		}
	});
});

// Get summaries of all ValueCharts the user created. These are just summaries, rather than full ValueCharts.
// This endpoint will return summaries of all ValueCharts whose creator field equals the user parameter in the route.
usersRoutes.get('/:user/OwnedValueCharts', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');

	var username = req.params.user;	

	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || (req.user[0] && username !== req.user[0].username)) {
		res.status(401).send('Unauthorized');	
	} else {
		valueChartCollection.find({ creator: username }, function(err: Error, docs: any[]) {
			if (err) {
				res.status(400)
					.json({ data: err });
			} else if (docs) {
				var vcSummaries: any[] = [];
				var promises: any[] = [];

				docs.forEach((doc: any) => {

					promises.push(statusCollection.find({ chartId: doc._id }, function(err: Error, status: ValueChartStatus) {
						if (err) 
							res.status(400).json({ data: err});
						else if (status)
							vcSummaries.push({ _id: doc._id, name: doc.name, description: doc.description, numUsers: doc.users.length, numAlternatives: doc.alternatives.length, password: doc.password, lockedBySystem: status.lockedBySystem, lockedByCreator: status.lockedByCreator });
					}));
				});

				Promise.all(promises).then(() => {
					vcSummaries.sort((a, b) => {
						if (a.name < b.name)
							return -1;
						else
							return 1;
					});

					res.status(200)
						.location('/Users/' + username + '/OwnedValueCharts')
						.json({ data: vcSummaries });
				});
			} else {
				res.status(404).send('Not Found');
			}
		});
	}
});

// Get summaries of all ValueCharts the user is a member of. These are just summaries, rather than full ValueCharts.
// This endpoint will return summaries of all ValueCharts whose members contain the user parameter in the route.
usersRoutes.get('/:user/JoinedValueCharts', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');

	var username = req.params.user;	

	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || (req.user[0] && username !== req.user[0].username)) {
		res.status(401).send('Unauthorized');	
	} else {
		valueChartCollection.find({ "users.username": username }, function(err: Error, docs: any[]) {
			if (err) {
				res.status(400)
					.json({ data: err });
			} else if (docs) {
				var vcSummaries: any[] = [];
				var promises: any[] = [];

				docs.forEach((doc: any) => {
					promises.push(statusCollection.find({ chartId: doc._id }, function(err: Error, status: ValueChartStatus) {
						if (err) 
							res.status(400).json({ data: err});
						else if (status)
							vcSummaries.push({ _id: doc._id, name: doc.name, description: doc.description, numUsers: doc.users.length, numAlternatives: doc.alternatives.length, password: doc.password, lockedBySystem: status.lockedBySystem, lockedByCreator: status.lockedByCreator });
					}));
				});

				Promise.all(promises).then(() => {
					vcSummaries.sort((a, b) => {
						if (a.name < b.name)
							return -1;
						else
							return 1;
					});

					res.status(200)
						.location('/Users/' + username + '/JoinedValueCharts')
						.json({ data: vcSummaries });
				});
			} else {
				res.status(404).send('Not Found');
			}
		});
	}
});




