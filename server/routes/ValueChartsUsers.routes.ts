/*
* @Author: aaronpmishkin
* @Date:   2016-08-02 10:49:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 18:39:18
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

valueChartUsersRoutes.all('*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var chartId: string = (<any> req).chartId;
	var hostConnection: HostConnectionStatus = hostConnections.get(chartId);

	// If the host connection is active, and user changes are not being accepted.
	if (hostConnection && !hostConnection.userChangesAccepted) {
		res.status(403)
			.send('User Changes are Disabled by the Chart Owner');
	} else {
		next();
	}
});

valueChartUsersRoutes.post('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
			doc.users.push(req.body);

			groupVcCollection.update({ _id: chartId }, (doc), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Notify any clients hosting this ValueChart that a user has been added.
					hostEventEmitter.emit(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, req.body);

					res.location('/ValueCharts/' + chartId + '/users' + req.body.username)
						.status(201)
						.json({ data: req.body });
				}
			});
		} else {
			res.sendStatus(404);
		}
	});
});
valueChartUsersRoutes.get('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;
	var username: string = req.params.username;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
	
			var user = doc.users.find((user: any) => {
				return user.username === username;
			});

			if (!user) {
				res.sendStatus(404);
				return;
			}

			res.location('/ValueCharts/' + chartId + '/users' + user.username)
						.status(200)
						.json({ data: user });

		} else {
			res.sendStatus(404);
		}
	});
});
valueChartUsersRoutes.put('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;
	var username: string = req.params.username;

	var userExists: boolean;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
			var userIndex: number = doc.users.findIndex((user: any) => {
				return user.username === username;
			});
			if (userIndex === -1) {
				// Add the user if it does not exist yet. 
				userExists = false;
				doc.users.push(req.body);
			} else {
				// Replace the old representation of the user.
				userExists = true;
				doc.users.splice(userIndex, 1, req.body);
			}


			groupVcCollection.update({ _id: chartId }, (doc), [], function(err: Error, savedDoc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });
				} else {
					if (userExists) {
						// Notify any clients hosting this ValueChart that a user has been changed.
						hostEventEmitter.emit(HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, req.body);
					} else {
						// Notify any clients hosting this ValueChart that a user has been added.
						hostEventEmitter.emit(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, req.body);
					}

					res.location('/ValueCharts/' + chartId + '/users' + req.body.username)
						.status(200)
						.json({ data: req.body });
				}
			});
		} else {
			res.sendStatus(404);
		}
	});
});


valueChartUsersRoutes.delete('/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;
	var username: string = req.params.username;

	groupVcCollection.findOne({ _id: chartId }, function (err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (doc) {
	
			var userIndex: number = doc.users.findIndex((user: any) => {
				return user.username === username;
			});

			if (userIndex === -1) {
				res.sendStatus(200);
				return;
			}

			doc.users.splice(userIndex, 1);

			groupVcCollection.update({ _id: chartId }, (doc), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Notify any clients hosting this ValueChart that a user has been deleted.
					hostEventEmitter.emit(HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, username);

					res.sendStatus(200);
				}
			});
		} else {
			res.sendStatus(404);
		}
	});
});
