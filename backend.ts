/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 23:37:41
*/

// Import Libraries and Middlware:
import * as express 								from 'express';
import * as mongo 									from 'mongodb';
import * as monk									from 'monk';
import * as path 									from 'path';
import * as favicon 								from 'serve-favicon';
import * as logger 									from 'morgan';
import * as cookieParser 							from 'cookie-parser';
import * as bodyParser 								from 'body-parser';
import * as expressSession							from 'express-session';

//  Routers:
import { indexRoutes } 								from './routes/Index.routes';
import { valueChartRoutes } 						from './routes/ValueCharts.routes';
import { usersRoutes }								from './routes/Users.routes';

// Types and Utilities
import { HostEventEmitter, hostEventEmitter } 		from './utilities/HostEventEmitters';
import { HostConnectionStatus, hostConnections }	from './utilities/HostConnections';
import { passport }									from './utilities/auth';
import { HostMessage, MessageType}					from './app/resources/types/HostMessage';


var backend: express.Application = express();
// Retrieve the database via the connection url. development is the username and BackEndConstruction is the password.
var db: monk.Monk = monk('mongodb://development:BackEndConstruction@ds021915.mlab.com:21915/web-valuecharts');

var expressWs = require('express-ws')(backend);

// uncomment after placing your favicon in /public
// backend.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

backend.use(logger('dev'));
backend.use(bodyParser.json());
backend.use(bodyParser.urlencoded({ extended: false }));
// Note that the secrete for cookie parser and expressSession MUST be the same.
backend.use(cookieParser('ThisIsOurSecret'));
// Initialize ExpressSession:
backend.use(expressSession({
	secret: 'ThisIsOurSecret',
	cookie: {
		maxAge: null,
		secure: false,
	},
	resave: false,
	saveUninitialized: true
}));
// Initialize Passport:
backend.use(passport.initialize());
backend.use(passport.session());
backend.use(express.static(__dirname));


// Attach the database to the request object
backend.use(function(req, res, next) {
    (<any>req).db = db;
    next();
});

// Set the proper Access-Control headers for all responses.
backend.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Credentials', (<any>true));
	next();
});

// Attach routers to manage specific URIs
backend.use('/', indexRoutes);
backend.use('/ValueCharts', valueChartRoutes);
backend.use('/Users', usersRoutes);


(<any>backend).ws('/host/:chart', function(ws: any, req: express.Request) {

	var chartId: string = req.params.chart;

	// This fires whenever the socket receives a message.
	ws.on('message', (msg: string) => {
		var hostMessage: HostMessage = JSON.parse(msg);

		switch (hostMessage.type) {
			case MessageType.ConnectionInit:
				initEventListeners(hostMessage, chartId, ws);
				hostConnections.set(chartId, { chartId: chartId, connectionStatus: 'open', userChangesAccepted: true });
				ws.send(JSON.stringify({ data: 'complete', chartId: chartId, type: MessageType.ConnectionInit }));

				break;
			case MessageType.ChangePermissions:
				hostConnections.get(chartId).userChangesAccepted = hostMessage.data;
				ws.send(JSON.stringify({ data: hostMessage.data, chartId: chartId, type: MessageType.ChangePermissions }));

				break;
			default:

				break;
		}
	});

	// This fires when the socket is closed.
	ws.on('close', () => {
		hostConnections.get(chartId).connectionStatus = 'closed';
	});
});

var initEventListeners = (jsonData: any, chartId: string, ws: any): void => {
	// Initialize event listeners:
	hostEventEmitter.on(HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, (user: any) => {
		ws.send(JSON.stringify({ type: MessageType.UserAdded, data: user, chartId: chartId }));
	});

	hostEventEmitter.on(HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, (username: string) => {
		ws.send(JSON.stringify({ type: MessageType.UserRemoved, data: username, chartId: chartId }));
	});

	hostEventEmitter.on(HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, (user: any) => {
		ws.send(JSON.stringify({ type: MessageType.UserChanged, data: user, chartId: chartId }));
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
