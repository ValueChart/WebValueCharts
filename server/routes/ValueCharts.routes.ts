/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-09 16:51:26
*/

// Import Libraries and Express Middleware:
import * as express 						from 'express';
import * as path 							from 'path';
import * as MongoDB 						from 'mongodb';
import * as Monk 							from 'monk';

// Import Application Classes:
import { HostEventEmitter, hostEventEmitter }	from '../utilities/HostEventEmitters';
import { valueChartUsersRoutes }				from './ValueChartsUsers.routes';

export var valueChartRoutes: express.Router = express.Router();

// Parse the chart ID so that it is available on the request object. This only affects /:chart routes, not its sub-routes.
// This fixes an error in the ValueChartUsers.routes.ts file where the router was unable to find route parameters because they 
// were listed in this file, rather than the ValueChartUsers.routes.ts file.
valueChartRoutes.all('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.params.chart) {
		(<any> req).identifier = req.params.chart;
	}
	next();
});

// Parse the chart ID so that it is available on the request object. This differs from the above because it affects all sub-routes of /:chart
valueChartRoutes.all('/:chart/*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.params.chart) {
		(<any> req).identifier = req.params.chart;
	}
	next();
});

// Create new ValueChart by posting to the list of ValueCharts.
valueChartRoutes.post('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	
	valueChartsCollection.count({ fname: req.body.fname }, function(err: Error, count: number) {
		if (count !== 0) {
			res.status(400)	// Return status 400: Bad Request with an appropriate message if the ValueChart's name is already taken. We do NOT allow duplicate names.
				.send('A ValueChart with that name already exists.');
		} else {
			valueChartsCollection.insert(req.body, function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else if (doc) {
					res.location('/ValueCharts/' + doc._id)
						.status(201)
						.json({ data: doc });
				} else {
					res.status(404).send('Not Found');				
				}
			});
		}
	});
});

// Get an existing ValueChart by id. Note that the chart id (which comes from the db) and the password must both be correct.
valueChartRoutes.get('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier
	
	var password: string = req.query.password;

	if (MongoDB.ObjectID.isValid(identifier)) {
		valueChartsCollection.findOne({ _id: identifier, password: password }, function(err: Error, doc: any) {
			if (err) {
				res.status(400)
					.json({ data: err });

			} else if (doc) {
				res.location('/ValueCharts/' + identifier)
					.status(200)
					.json({ data: doc });
			} else {	// No ValueChart with that id + password combination was found. Return 404: Not Found.
				res.status(404).send('Not Found');
			}
		});
	} else 
		next();
});

// Get an existing ValueChart by name. Note that the chart id (which comes from the db) and the password must both be correct.
valueChartRoutes.get('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {

	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier; // ChartId is misleading here. It is the name, not id.
	
	var password: string = req.query.password;

	valueChartsCollection.findOne({ fname: identifier, password: password }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			res.location('/ValueCharts/' + identifier)
				.status(200)
				.json({ data: doc });
		} else {	// No ValueChart with that name + password combination was found. Return 404: Not Found.
			res.status(404).send('Not Found');
		}
	});
});

// // Get an existing ValueChart by id. Only include the preferences for the user with the specified username.
// valueChartRoutes.get('/:chart/singleuser', function(req: express.Request, res: express.Response, next: express.NextFunction) {
// 	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
// 	var identifier: string = (<any> req).identifier
// 	var password: string = req.query.password;
// 	var username: string = req.query.username;

// 	valueChartsCollection.findOne({ _id: identifier, password: password }, function(err: Error, doc: any) {
// 		if (err) {
// 			res.status(400)
// 				.json({ data: err });

// 		} else if (doc) {
// 			// Remove all users except the one with the specified username.
// 			doc.users = (<any[]>doc.users).filter(function(e) { return e.username === username });
// 			res.location('/ValueCharts/' + identifier)
// 				.status(200)
// 				.json({ data: doc });
// 		} else {	// No ValueChart with that id + password combination was found. Return 404: Not Found.
// 			res.status(404).send('Not Found')
// 		}
// 	});
// });

// Update an existing ValueChart, or create one if it does not exist. This method should not be used to create a new ValueChart
// as it will fail if the provided id is not a valid id for the database. Use the post method to the ValueCharts collection instead.
valueChartRoutes.put('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier

	valueChartsCollection.findOne({ _id: identifier }, function(err: Error, doc: any) {
		if (doc) {
			valueChartsCollection.update({ _id: identifier }, (req.body), [] ,function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else if (doc) {
					req.body._id = identifier;
					res.location('/ValueCharts/' + identifier)
						.status(200)
						.json({ data: req.body });
				} else {
					res.status(404).send('Not Found');
				}
			});
		} else {

			valueChartsCollection.insert(req.body, function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else if (doc) {
					res.location('/ValueCharts/' + doc._id)
						.status(201)
						.json({ data: doc });
				} else {
					res.status(404).send('Not Found');				
				}
			});
		}
	});
});


// Delete the ValueChart with the id provided in the request url.
valueChartRoutes.delete('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier

	if (!identifier)
		res.status(400).send('Not Found');

	(<any> valueChartsCollection).findOneAndDelete({ _id: identifier }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else {		
			res.status(200).send('Deleted');	// The REST documentation for the delete method is a bit unclear on whether delete should 
									// return the delete resource. I have chosen not to do so. Doc in this case is not actually
									// the resource at all. Rather, it is a message notifying of successful deletion.
		}
	});
});

// Get the id of the ValueChart with the given name. Returns status 404 if no ValueChart with the given name exists.
valueChartRoutes.get('/:chart/id', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier;	// ChartId is misleading here. It is the name, not id.

	valueChartsCollection.findOne({ fname: identifier }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			res.location('/ValueCharts/' + identifier)
				.status(200)
				.send(doc._id);
		} else {
			res.status(404).send('Not Found');
		}
	});
});

// Get the structure of an existing ValueChart. Structure means the objective hierarchy, and alternatives. The returned 
// resource has NO users (as these are where preferences are stored). Note that this method uses name and password for 
// identification rather than id and password. This is because this method is used to join an existing ValueChart, and it 
// is much easier for users to use a name than an id generated by the database.
valueChartRoutes.get('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	
	var identifier: string = (<any> req).identifier;	// ChartId is misleading here. It is the name, not id.
	var password: string = req.query.password;


	valueChartsCollection.findOne({ fname: identifier, password: password }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			// Remove the users from the ValueChart so that it only contains the objectives and alternatives.
			doc.users = undefined;
			res.location('/ValueCharts/' + identifier + '/structure')
				.status(200)
				.json({ data: doc });
		} else {
			return res.status(404).send('Not Found');
		}
	});
});

// Update the structure of an existing ValueChart.
valueChartRoutes.put('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var identifier: string = (<any> req).identifier;	// ChartId is misleading here. It is the name, not id.

	valueChartsCollection.findOne({ fname: identifier }, function (err: Error, foundDocument: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (foundDocument) {
			// Attach the users to the structure object so that the users are not lost when submitted to the database.
			req.body.users = foundDocument.users;

			valueChartsCollection.update({ _id: foundDocument._id }, (req.body), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Remove the users from the ValueChart so that it only contains the objectives and alternatives
					// when it is returned to the client.
					req.body.users = undefined;
					req.body._id = foundDocument._id;

					res.location('/ValueCharts/' + identifier + '/structure')
						.status(200)
						.json({ data: req.body });
				}
			});
		} else {
			res.status(404).send('Not Found');
		}
	});
});


valueChartRoutes.put('/:chart/status', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');

	var identifier: string = (<any> req).identifier;

	statusCollection.findOne({ fname: identifier }, function(err: Error, foundDocument: any) {

		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (foundDocument) {
			statusCollection.update({ _id: foundDocument._id }, req.body, [], function(err: Error, doc: any) {
				res.location('/ValueCharts/' + identifier + '/status')
					.status(200)
					.json({ data: req.body });
			});
		} else {
			statusCollection.insert(req.body, function(err: Error, doc: any) {
				res.location('/ValueCharts/' + identifier + '/status')
					.status(201)
					.json({ data: req.body });
			});
		}
	});
});

valueChartRoutes.get('/:chart/status', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');

	var identifier: string = (<any> req).identifier;

	statusCollection.findOne({ fname: identifier }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			res.location('/ValueCharts/' + identifier + '/status')
				.status(200)
				.json({ data: doc });
		}
	});
});

valueChartRoutes.delete('/:chart/status', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var statusCollection: Monk.Collection = (<any> req).db.get('ValueChartStatuses');

	var identifier: string = (<any> req).identifier;

	statusCollection.remove({ fname: identifier }, function (err: Error, result: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (result) {
			res.status(200).send('Deleted');
		}
	});	
});

// Set this router to use the valueChartUsersRoutes router for all routes that start with '/:chart/users'. This allows for separate router
// to handle all routes relating to ValueChart users.
valueChartRoutes.use('/:chart/users', valueChartUsersRoutes);

