/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-24 18:39:04
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
		(<any> req).chartId = req.params.chart;
	}
	next();
});

// Parse the chart ID so that it is available on the request object. This differs from the above because it affects all sub-routes of /:chart
valueChartRoutes.all('/:chart/*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.params.chart) {
		(<any> req).chartId = req.params.chart;
	}
	next();
});

// Create new ValueChart by posting to the list of ValueCharts.
valueChartRoutes.post('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	
	valueChartsCollection.count({ name: req.body.name }, function(err: Error, count: number) {
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
					res.sendStatus(404);				
				}
			});
		}
	});
});

// Get an existing ValueChart by id. Note that the chart id (which comes from the db) and the password must both be correct.
valueChartRoutes.get('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;
	
	var password: string = req.query.password;

	valueChartsCollection.findOne({ _id: chartId, password: password }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			res.location('/ValueCharts/' + chartId)
				.status(200)
				.json({ data: doc });
		} else {	// No ValueChart with that id + password combination was found. Return 404: Not Found.
			res.sendStatus(404)
		}
	});
});

// Check to see if a ValueChart name is available. Returns true in response body if it is, false if taken.
valueChartRoutes.get('/:chart/available', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartName: string = (<any> req).chartId;	// ChartId is misleading here. It is the name, not id.

	valueChartsCollection.count({ name: chartName }, function(err: Error, count: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (count !== 0) {
			res.location('/ValueCharts/' + chartName)
				.status(200)
				.json({ data: false });
		} else {
			res.status(200)
				.json({ data: true });
		}
	});
});

// Update an existing user, or create one if it does not exist. This method should not be used to create a new ValueChart
// as it will fail if the provided id is not a valid id for the database. Use the post method to the ValueCharts collection instead.
valueChartRoutes.put('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	valueChartsCollection.update({ _id: chartId }, (req.body), [] ,function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			req.body._id = chartId;
			res.location('/ValueCharts/' + chartId)
				.status(200)
				.json({ data: req.body });
		} else {
			res.sendStatus(404);
		}
	});
});


// Delete the ValueChart with the id provided in the request url.
valueChartRoutes.delete('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	(<any> valueChartsCollection).findOneAndDelete({ _id: chartId }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else {		
			res.sendStatus(200);	// The REST documentation for the delete method is a bit unclear on whether delete should 
									// return the delete resource. I have chosen not to do so, as doc in this case is not actually
									// the resource at all. Rather, it is a message notifying of successful deletion.
		}
	});
});

// Get the structure of an existing ValueChart. Structure means the objective hierarchy, and alternatives. The returned 
// resource has NO users (as these are where preferences are stored). Note that this method uses name and password for 
// identification rather than id and password. This is because this method is used to join an existing ValueChart, and it 
// is much easier for users to use a name than an id generated by the database.
valueChartRoutes.get('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	
	var chartName: string = (<any> req).chartId;	// ChartId is misleading here. It is the name, not id.
	var password: string = req.query.password;


	valueChartsCollection.findOne({ name: chartName, password: password }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			// Remove the users from the ValueChart so that it only contains the objectives and alternatives.
			doc.users = undefined;
			res.location('/ValueCharts/' + chartName + '/structure')
				.status(200)
				.json({ data: doc });
		} else {
			return res.sendStatus(404);
		}
	});
});

// Update the structure of an existing ValueChart.
valueChartRoutes.put('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartName: string = (<any> req).chartId;	// ChartId is misleading here. It is the name, not id.

	valueChartsCollection.findOne({ name: chartName }, function (err: Error, foundDocument: any) {
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

					res.location('/ValueCharts/' + chartName + '/structure')
						.status(200)
						.json({ data: req.body });
				}
			});
		} else {
			res.sendStatus(404);
		}
	});
});

// Set this router to use the valueChartUsersRoutes router for all routes that start with '/:chart/users'. This allows for separate router
// to handle all routes relating to ValueChart users.
valueChartRoutes.use('/:chart/users', valueChartUsersRoutes);

