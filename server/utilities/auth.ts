/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 22:13:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-01-06 20:28:57
*/

// Import Libraries and Express Middleware:
import * as express 								from 'express';
import * as Passport 								from 'passport';
import { Strategy }									from 'passport-local';
import * as monk									from 'monk';

//import { dbAddress }								from '../db.address';
import { dbAddress }								from '../db.test';

// Load the database.
var db: monk.Monk = monk(dbAddress);

var localRegistration = (username: string, password: string, req: express.Request) => {

	var promise = new Promise(function(resolve, reject) {
		
		var users = (<any> req).db.get('Users');	

		users.findOne({ 'username': req.body.username }, function(error: Error, doc: any) {		// Need to add larger user. 
			if (!doc) {
				users.insert(req.body, function(error: Error, doc: any) {
					resolve(doc);
				});	// Add the user to the database.
			} else {
				resolve(false);
			}
		});
	});

	return promise;
}

var localAuthentication = (username: string, password: string, req: express.Request) => {
		
	var promise = new Promise(function(resolve, reject) {

		var users = (<any> req).db.get('Users');
		users.findOne({ username: username, password: password }, function(error: Error, doc: any) {
			if (!doc) {
				resolve(false);
			} else {
				resolve(doc);
			}
		});
	});

	return promise;
}

// Configure Serialization for User Sessions:

Passport.serializeUser(function(user: any, done: any) {
	done(null, user._id);
});

Passport.deserializeUser(function(id, done) {
	var users = db.get('Users');
	users.find({ '_id': id }, function(e: any, user: any) {
		done(e, user);
	});
});

// Configure strategies for user signup and authentication

Passport.use('local-signup', new Strategy({ passReqToCallback: true }, function(req, username, password, done) {
    localRegistration(username, password, req).then(function(user: any) {
		if (!user) {
			done(null, false);
		} else {
			done(null, user);
		}
    }).catch(function(err) {
		// Handle Error Signing Up Here.
    });
}));

Passport.use('local-signin', new Strategy({ passReqToCallback: true }, function(req, username, password, done) {
    localAuthentication(username, password, req).then(function(user: any) {
		if (!user) {
			done(null, false);
		} else {
			done(null, user);
		}
    }).catch(function(err) {
		// Handle Error Authenticating Up Here.
    });
}));

export var passport = Passport;
