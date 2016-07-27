/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-26 21:10:40
*/

// Import the express typings:
import * as Express from 'express';
import * as MongoDB from 'mongodb';
import * as Monk from 'monk';

var path = require('path');
var express = require('express');
var router: Express.Router = express.Router();

router.post('/ValueCharts', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');

	groupVcCollection.insert(req.body, function(err: Error, doc: any) {
		if (err) {
			res.status(400)
				.json({ data: JSON.stringify(err) });

		} else {
			 
			res.location('/group/ValueCharts/' + doc._id)
				.status(201)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.get('/ValueCharts/:id', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');

	groupVcCollection.findOne({ name: req.params.id }, function(err: Error, doc: any) {
		if (err) {

			res.status(404)
				.json({ data: JSON.stringify(err) });

		} else {

			res.location('/group/ValueCharts/' + doc._id)
				.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.put('/ValueCharts/:id', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');


	groupVcCollection.update({ id: req.params.id }, (req.body), [] ,function(err: Error, doc: any) {
		if (err) {

			res.status(400)
				.json({ data: JSON.stringify(err) });

		} else {
			 
			res.location('/group/ValueCharts/' + doc._id)
				.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

router.delete('/ValueCharts/:id', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var groupVcCollection: Monk.Collection = (<any> req).db.get('GroupValueCharts');


	groupVcCollection.remove({ id: req.params.id }, function(err: Error, doc: any) {
		if (err) {

			res.status(404)
				.json({ data: JSON.stringify(err) });
		} else {		
			 
			res.status(200)
				.json({ data: JSON.stringify(doc) });
		}
	});
});

module.exports = router;
