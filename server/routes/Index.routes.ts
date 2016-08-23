/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 12:30:25
*/


// Import the express typings:
import * as express 						from 'express';
import * as path 							from 'path';

export var indexRoutes: express.Router = express.Router();

 // GET home page. 
indexRoutes.get('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var options = {
		root: path.join(__dirname, '../../'),  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options);
});

 // GET home page. 
indexRoutes.get('/register', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var options = {
		root: path.join(__dirname, '../../'),  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options);
});
