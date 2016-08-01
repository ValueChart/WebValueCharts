/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-31 17:04:57
*/

// Import Types:
import { HostMessage }							 	from './app/resources/types/HostMessage';

// Import Libraries and Middlware:
import * as express 								from 'express';
import * as mongo 									from 'mongodb';
import * as monk									from 'monk';
import * as path 									from 'path';
import * as favicon 								from 'serve-favicon';
import * as logger 									from 'morgan';
import * as cookieParser 							from 'cookie-parser';
import * as bodyParser 								from 'body-parser';

//  Routers:
import { indexRoutes } 								from './routes/Index.routes';
import { valueChartRoutes } 						from './routes/ValueCharts.routes';

import { HostEventEmitter, hostEventEmitter } 		from './utilities/HostEventEmitters';

var backend: express.Application = express();

var db: monk.Monk = monk('mongodb://development:BackEndConstruction@ds021915.mlab.com:21915/web-valuecharts');

var expressWs = require('express-ws')(backend);

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
backend.use('/ValueCharts', valueChartRoutes);




(<any> backend).ws('/host/:chart', function(ws: any, req: express.Request) {

	var chartId: string = req.params.chart;

	console.log('websocket connection received! The ChartID is: ' + chartId);
	// This fires whenever the socket receives a message.
	ws.on('message', (msg: string) => {
		var hostMessage: HostMessage = JSON.parse(msg);

		switch (hostMessage.type) {
			case "initialization":
				initEventListeners(hostMessage, chartId, ws);
				ws.send(JSON.stringify({ data: 'open', chartId: chartId, type: 'connection-status' }));
				break;
			
			default:
				// code...
				break;
		}
	});

	// This fires when the socket is closed.
	ws.on('close', () => {
		console.log('The socket has been closed')
	});
});



var initEventListeners = (jsonData: any, chartId: string, ws: any): void => {
			// Initialize event listeners:
		hostEventEmitter.on(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, (user: any) => {
			console.log('A user has been added');
		});

		hostEventEmitter.on(HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, (username: string) => {
			console.log('A user has been removed');
		});

		hostEventEmitter.on(HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, (user: any) => {
			console.log('A user has been changed');
		});
}


// catch 404 errors and redirect the request to the index.html file.
backend.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
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
	backend.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
		res.status(err.status || 500);
		res.json({
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
backend.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
	res.status(err.status || 500);
	res.json({
		message: err.message,
		error: {}
	});
});

module.exports = backend;


backend.listen(3000);
