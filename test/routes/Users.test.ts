/*
* @Author: aaronpmishkin
* @Date:   2016-08-03 21:25:01
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-03 23:28:45
*/

// Require Node Libraries:
import { expect } 								from 'chai';
import * as request								from 'supertest';


describe('Users Routes', () => {

	var user: request.SuperTest<request.Test>;
	var username: string;

	before(function() {
		user = request.agent('http://localhost:3000/');
	});

});
