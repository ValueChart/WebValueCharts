/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 10:49:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-23 17:18:29
*/

// Import Libraries and Express Middleware:
import * as express 								from 'express';
import * as path 									from 'path';
import * as MongoDB 								from 'mongodb';
import * as Monk 									from 'monk';

// Import Application Classes:
import { HostEventEmitter, hostEventEmitter }		from '../utilities/HostEventEmitters';
import { HostConnectionStatus, hostConnections }	from '../utilities/HostConnections';


export var valueChartUsersRoutes: express.Router = express.Router();

// Retrieve a specific user from a ValueChart's list of users using their username as the identifier. 
valueChartUsersRoutes.get('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier
	var username: string = req.params.username;

	// Locate the ValueChart that the desired user belongs to.
	valueChartCollection.findOne({ _id: identifier }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
			
			// Locate the user.
			var user = doc.users.find((user: any) => {
				return user.username === username;
			});

			if (!user) {
				res.sendStatus(404);	// The user does not exists. Return status 404: Not Found.
				return;
			}

			// Return the located user.
			res.location('/ValueCharts/' + identifier + '/users' + user.username)
						.status(200)
						.json({ data: user });

		} else {
			res.sendStatus(404);	// The ValueChart the user is supposed to belong to does not exist. Return status 404: Not Found.
		}
	});
});

// Check to see if user changes are being refused by the chart for all requests to /ValueCharts/:chart/users. If they are, return status 403: Forbidden. Otherwise,
// continue on to the next middleware function in the stack. Note that this middleware function will execute before all others in this router
// because it is defined before them in the stack.
valueChartUsersRoutes.all('*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var identifier: string = (<any> req).identifier

	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');
	statusCollection.findOne({ chartId: identifier }, (err: Error, doc: any) => {
		// If the host connection is active, and user changes are not being accepted.
		if (doc && !doc.userChangesPermitted) {
			res.status(403)
				.send('User Changes are Disabled by the Chart Owner');
		} else {
			next();
		}
	});
});


// Create new ValueChart user by posting to a ValueChart's list of users.
valueChartUsersRoutes.post('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier	// Retrieve the chart Id. Recall that it is attached to the request object the middleware
												// function in ValueCharts.routes.ts.
	// Locate the ValueChart to which the user should be added.											
	valueChartCollection.findOne({ _id: identifier }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
			doc.users.push(req.body);	// Add the user to the ValueChart.

			// Update the ValueChart in the database.
			valueChartCollection.update({ _id: identifier }, (doc), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Notify any clients hosting this ValueChart that a user has been added.
					hostEventEmitter.emit(HostEventEmitter.USER_ADDED_EVENT + '-' + identifier, req.body);

					res.location('/ValueCharts/' + identifier + '/users' + req.body.username)
						.status(201)
						.json({ data: req.body });
				}
			});
		} else {
			res.sendStatus(404);
		}
	});
});

// Update an existing ValueChart user with a new resource, or create a new user if it does not exist. This action is idempotent as required by REST.
valueChartUsersRoutes.put('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier
	var username: string = req.params.username;

	var userExists: boolean;	// Whether the user already exists or not.

	// Locate the ValueChart to which the user to update belongs.
	valueChartCollection.findOne({ _id: identifier }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
			// Determine the index of the user to update in the ValueChart's list of users.
			var userIndex: number = doc.users.findIndex((user: any) => {
				return user.username === username;
			});
			// The user index is -1, meaning it does not yet exist.
			if (userIndex === -1) {
				// Add the user if it does not exist yet. 
				userExists = false;
				doc.users.push(req.body);
			} else {	// The user already exists.
				// Replace the old representation of the user.
				userExists = true;
				doc.users.splice(userIndex, 1, req.body);
			}

			// Update the ValueChart resource in the database.
			valueChartCollection.update({ _id: identifier }, (doc), [], function(err: Error, savedDoc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });
				} else {
					if (userExists) {
						// Notify any clients hosting this ValueChart that a user has been changed.
						hostEventEmitter.emit(HostEventEmitter.USER_CHANGED_EVENT + '-' + identifier, req.body);
					} else {
						// Notify any clients hosting this ValueChart that a user has been added.
						hostEventEmitter.emit(HostEventEmitter.USER_ADDED_EVENT + '-' + identifier, req.body);
					}

					res.location('/ValueCharts/' + identifier + '/users' + req.body.username)
						.status(200)
						.json({ data: req.body });
				}
			});
		} else {
			res.sendStatus(404);	// The ValueChart does not exist. Returns status 404: Not Found.
		}
	});
});

// Delete a ValueChart user with the given username. This action is idempotent as required by REST.
valueChartUsersRoutes.delete('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier
	var username: string = req.params.username;

	// Find the ValueChart the user to delete belongs to.
	valueChartCollection.findOne({ _id: identifier }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
		
			var userIndex: number = doc.users.findIndex((user: any) => {
				return user.username === username;
			});

			// The user does not exist. Return status 200: OK. This is what makes the operation idempotent.
			if (userIndex === -1) {
				res.sendStatus(200);
				return;
			}

			// Delete the user.
			doc.users.splice(userIndex, 1);

			// Update the ValueChart resource in the database.
			valueChartCollection.update({ _id: identifier }, (doc), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Notify any clients hosting this ValueChart that a user has been deleted.
					hostEventEmitter.emit(HostEventEmitter.USER_REMOVED_EVENT + '-' + identifier, username);

					res.sendStatus(200);
				}
			});
		} else {
			res.sendStatus(404);	// The ValueChart does not exist. Return status 404: Not Found.
		}
	});
});
