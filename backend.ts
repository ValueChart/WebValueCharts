/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-26 14:53:22
*/


// Import the express typings:
import * as Express from 'express';
import * as MongoDB from 'mongodb';
import * as Monk from 'monk';

// Import Node Modules:
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var monk = require('monk');

// Important Routers:
var indexRoutes: Express.Router = require('./routes/Index.routes');
var groupRoutes: Express.Router = require('./routes/Group.routes');



var backend: Express.Application = express();
var db: Monk.Monk = monk('mongodb://development:BackEndConstruction@ds021915.mlab.com:21915/web-valuecharts');


// uncomment after placing your favicon in /public
// backend.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

backend.use(logger('dev'));
backend.use(bodyParser.json());
backend.use(bodyParser.urlencoded({ extended: false }));
backend.use(cookieParser());

backend.use(express.static(__dirname));


// Attach the database to the request object
backend.use(function(req,res,next) {
    (<any> req).db = db;
    next();
});

// Attach routers to manage specific URIs
backend.use('/', indexRoutes);
backend.use('/group', groupRoutes);

// catch 404 errors and redirect the request to the index.html file.
backend.use(function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var options = {
		root: __dirname,  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options);
});



// error handlers:

// development error handler
// will print stacktrace
if (backend.get('env') === 'development') {
	backend.use(function(err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) {
		res.status(err.status || 500);
		res.json({
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
backend.use(function(err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	res.status(err.status || 500);
	res.json({
		message: err.message,
		error: {}
	});
});


module.exports = backend;
