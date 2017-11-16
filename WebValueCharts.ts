/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-01-03 14:02:27
*/

// Import Libraries and Middleware:
import * as express 								from 'express';
import * as mongo 									from 'mongodb';
import * as monk									from 'monk';
import * as path 									from 'path';
import * as favicon 								from 'serve-favicon';
import * as logger 									from 'morgan';
import * as cookieParser 							from 'cookie-parser';
import * as bodyParser 								from 'body-parser';
import * as expressSession							from 'express-session';

//  Import Routers and Route Handlers:
import { dbAddress }								from './server/db.address';
import { indexRoutes } 								from './server/routes/Index.routes';
import { valueChartRoutes } 						from './server/routes/ValueCharts.routes';
import { usersRoutes }								from './server/routes/Users.routes';
import { hostWebSocket }							from './server/routes/Host.routes';
import { alternativesRoutes }						from './server/routes/Alternatives.routes';

// Import Utilities:
import { passport }									from './server/utilities/auth';


// Create the express application.
var webValueCharts: express.Application = express();

// Retrieve the database via the connection url. "development" is the username and "BackEndConstruction" is the password.
var db: monk.Monk = monk(dbAddress);

// Require express websocket (an express implementation of the WebSocket protocol) and call its initialization function.
// This function attaches the WebScoket methods (ws for example) to the express instance we are using.
var expressWs = require('express-ws')(webValueCharts);

// This is where we would setup our favicon, the image displayed by web browsers in the corner of tabs.
// webValueCharts.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Setup a logger. We are using morgan for this purpose. Note that no serious logging has been setup yet.
webValueCharts.use(logger('dev'));
// Set our application to use the bodyParser middleware. This middleware is what allows the backend to parse json http requests it receives.
webValueCharts.use(bodyParser.json());			
webValueCharts.use(bodyParser.urlencoded({ extended: false }));
// Setup our application to use the cookieParser middlware for parsing cookies. Note that the secret for cookie parser and expressSession MUST be the same.
webValueCharts.use(cookieParser('ThisIsOurSecret'));
// Initialize ExpressSession, the middleware we are using for implementing user sessions:
webValueCharts.use(expressSession({
	secret: 'ThisIsOurSecret',
	cookie: {
		maxAge: null,		// User cookies don't expire.
		secure: false,		// User cookies are not secure.
	},
	resave: false,
	saveUninitialized: true
}));

// Initialize Passport. Passport is the middleware that our backend uses for user Authentication. 
webValueCharts.use(passport.initialize());		// Initialize passport.
webValueCharts.use(passport.session());			// Initialize user sessions.

// Set express to allow static serving of files from the current directory. This is what allows our backend to 
// send HTML, JS, etc files to the client.
webValueCharts.use(express.static(__dirname));

// Attach the database to all request objects. Middleware functions are evaluated by Express in a stack, and this function
// is at the very top. This means means that the db object will be attached to every request before any other middleware can be called.
webValueCharts.use(function(req, res, next) {
    (<any>req).db = db;
    next();
});

// Set the proper Access-Control headers for all responses. This is necessary for user Auth cookies to be sent and received correctly.
webValueCharts.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Credentials', (<any>true));
	next();
});

// Attach routers to manage specific URIs. 
webValueCharts.use('/', indexRoutes);					// The index.html page.
webValueCharts.use('/ValueCharts', valueChartRoutes);	// ValueCharts resource endpoints.
webValueCharts.use('/Users', usersRoutes);				// User resource endpoints.
webValueCharts.use('/alternatives', alternativesRoutes);

// Setup the host WebScoket on the route '/host/:chart' where :chart is a chartId. See the Host.routes.ts file for more information.
(<any>webValueCharts).ws('/host/:chart', hostWebSocket);

// Catch 404 errors and redirect the request to the index.html file.
// This middleware is the last one in the stack, so it will only be called when no other middle 
// successfully handles a request. This is the essence of a 404 request in the context of express.
// It is very important that we redirect 404 statuses to the index.html file. This is because the request
// may only be a 404 error 
webValueCharts.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var options = {
		root: __dirname,  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};
// Return the index.html file so that Angular's front-end routing can handle the request.
	res.sendFile('index.html', options);
});


// error handlers:

// development error handler
// will print stacktrace
if (webValueCharts.get('env') === 'development') {
	webValueCharts.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
		res.status(err.status || 500);
		res.json({
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
webValueCharts.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
	res.status(err.status || 500);
	res.json({
		message: err.message,
		error: {}
	});
});

// Export the web application to any other files that might require it.
module.exports = webValueCharts;

// Start the server and set it to listen on port 3000.
webValueCharts.listen(3000);
