// Import the express typings:
import * as Express from 'express';

var path = require('path');
var express = require('express');
var router: Express.Router = express.Router();

 // GET home page. 
router.get('/', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var options = {
		root: path.join(__dirname, '../'),  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options);
});

 // GET home page. 
router.get('/register', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
	var options = {
		root: path.join(__dirname, '../'),  // base directory should be /built/public
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('index.html', options);
});

module.exports = router;
