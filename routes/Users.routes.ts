/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-05 15:57:00
*/

// Import Libraries and Express Middleware:
import * as express 						from 'express';
import * as path 							from 'path';
import * as MongoDB 						from 'mongodb';
import * as Monk 							from 'monk';
import * as passport 						from 'passport';

export var usersRoutes: express.Router = express.Router();

// Create new User by posting the list of Users.
usersRoutes.post('/', passport.authenticate('local-signup'), function(req: express.Request, res: express.Response) {
		
	res.status(201)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Login. Doesn't conform to REST principles, but is necessary.
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

usersRoutes.get('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;

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

usersRoutes.put('/:user', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var usersCollection: Monk.Collection = (<any> req).db.get('Users');
	var username = req.params.user;
	
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


usersRoutes.get('/:user/ValueCharts', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');
	var username = req.params.user;

	if (!req.isAuthenticated() || (req.user[0] && username !== req.user[0].username)) {
		res.sendStatus(401);
	} else {
		groupVcCollection.find({ creator: username }, function(err: Error, docs: any[]) {
			if (err) {
				res.sendStatus(400)
					.json({ data: err });
			} else if (docs) {
				var vcSummaries: any[] = [];
				docs.forEach((doc: any) => {
					vcSummaries.push({ _id: doc._id, name: doc.name, description: doc.description, numUsers: doc.users.length, numAlternatives: doc.alternatives.length, password: doc.password });
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


