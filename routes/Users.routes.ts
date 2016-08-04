/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:22:22
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 23:52:04
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
		
	console.log('user logged in. Username: ', req.user.username, ' password: ', req.user.password, ' auth status:', req.isAuthenticated());

	res.status(201)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});

// Login. Doesn't conform to REST principles, but is necessary.
usersRoutes.post('/login', passport.authenticate('local-signin'), function(req: express.Request, res: express.Response) {

	console.log('user logged in. Username: ', req.user.username, ' password: ', req.user.password, ' auth status:', req.isAuthenticated());

	res.status(200)
		.json({ data: { username: req.user.username, password: req.user.password, loginResult: req.isAuthenticated() }});
});


usersRoutes.get('/:user/ValueCharts', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var username = req.params.user;
});