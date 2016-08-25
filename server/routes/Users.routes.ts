/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 18:17:57
*/

// Import Libraries and Express Middleware:
import * as express 						from 'express';
import * as path 							from 'path';
import * as MongoDB 						from 'mongodb';
import * as Monk 							from 'monk';
import * as passport 						from 'passport';

export var usersRoutes: express.Router = express.Router();

// Create new User by posting to the list of Users. The passport local-signup strategy does the actual creation. See Auth.ts for more information.
usersRoutes.post('/', passport.authenticate('local-signup'), function(req: express.Request, res: express.Response) {
		
	res.status(201)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Login. Doesn't conform to REST principles, but is necessary. The passport local-signin strategy does the actual logging in. See Auth.ts for more information. 
usersRoutes.post('/login', passport.authenticate('local-signin'), function(req: express.Request, res: express.Response) {

	res.status(200)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Logout. Doesn't conform to REST principles, but is necessary.
usersRoutes.get('/logout', function(req: express.Request, res: express.Response) {

	var body: any = { data: { username: req.user[0].username, password: req.user[0].password, logoutResult: true } };

	// Destroy the current user's session.
	req.session.destroy(function (err) {
		req.session = null;
    	res.clearCookie('express.sid', { path: '/' });
		req.logOut();
		res.json(body);
	});
});

// Get an existing user.
usersRoutes.get('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;

	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || username !== req.user[0].username) {
		res.sendStatus(401);
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
				res.sendStatus(404);
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
		res.sendStatus(401);
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
				res.sendStatus(404);
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
			res.sendStatus(200);
		}
	});
});

// Get summaries of all of a user's ValueCharts. These are just summaries, rather than full ValueCharts.
// This endpoint will return summaries of all ValueChart's whose creator field equals the user parameter in the route.
usersRoutes.get('/:user/ValueCharts', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var username = req.params.user;	

	// Return 401: Unauthorized if the user isn't logged in, or the username of the logged in user does not match the username in request.
	if (!req.isAuthenticated() || (req.user[0] && username !== req.user[0].username)) {
		res.sendStatus(401);	
	} else {
		valueChartCollection.find({ creator: username }, function(err: Error, docs: any[]) {
			if (err) {
				res.sendStatus(400)
					.json({ data: err });
			} else if (docs) {
				var vcSummaries: any[] = [];
				docs.forEach((doc: any) => {
					// Create a summary object from the ValueChart.
					vcSummaries.push({ _id: doc._id, name: doc.name, description: doc.description, numUsers: doc.users.length, numAlternatives: doc.alternatives.length, password: doc.password, incomplete: doc.incomplete });
				});
				res.status(200)
					.location('/Users/' + username + '/ValueCharts')
					.json({ data: vcSummaries });
			} else {
				res.sendStatus(404);
			}
		});
	}
});


