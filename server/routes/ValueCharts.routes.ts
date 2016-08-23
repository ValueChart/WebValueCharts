/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 16:47:43
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

// Parse the chart ID so that it is available on the request object.

valueChartRoutes.all('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.params.chart) {
		(<any> req).chartId = req.params.chart;
	}
	next();
});

valueChartRoutes.all('/:chart/*', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.params.chart) {
		(<any> req).chartId = req.params.chart;
	}
	next();
});



valueChartRoutes.post('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	
	valueChartsCollection.count({ name: req.body.name }, function(err: Error, count: number) {
		if (count !== 0) {
			res.status(400)
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
		} else {
			res.sendStatus(404)
		}
	});
});

valueChartRoutes.get('/:chart/available', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	valueChartsCollection.count({ name: chartId }, function(err: Error, count: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (count !== 0) {
			res.location('/ValueCharts/' + chartId)
				.status(200)
				.json({ data: false });
		} else {
			res.status(200)
				.json({ data: true });
		}
	});
});

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

valueChartRoutes.delete('/:chart', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	(<any> valueChartsCollection).findOneAndDelete({ _id: chartId }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else {		
			res.sendStatus(200);
		}
	});
});

valueChartRoutes.get('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartId: string = (<any> req).chartId;

	var password: string = req.query.password;


	valueChartsCollection.findOne({ name: chartId, password: password }, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: err });

		} else if (doc) {
			// Remove the users from the ValueChart so that it only contains the objectives and alternatives
			doc.users = undefined;
			res.location('/ValueCharts/' + chartId + '/structure')
				.status(200)
				.json({ data: doc });
		} else {
			return res.sendStatus(404);
		}
	});
});

valueChartRoutes.put('/:chart/structure', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var valueChartsCollection: Monk.Collection = (<any> req).db.get('ValueCharts');
	var chartName: string = (<any> req).chartId;

	valueChartsCollection.findOne({ name: chartName }, function (err: Error, foundDocument: any) {
		if (err) {
			res.status(400)
				.json({ data: err });
		} else if (foundDocument) {
			// Attach the users to the structure object.
			req.body.users = foundDocument.users;

			valueChartsCollection.update({ _id: foundDocument._id }, (req.body), [], function(err: Error, doc: any) {
				if (err) {
					res.status(400)
						.json({ data: err });

				} else {
					// Remove the users from the ValueChart so that it only contains the objectives and alternatives
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

valueChartRoutes.use('/:chart/users', valueChartUsersRoutes);


