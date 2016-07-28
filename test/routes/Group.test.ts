/*
* @Author: aaronpmishkin
* @Date:   2016-07-27 15:49:06
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 16:30:52
*/

// Import supertest typings:
import * as request								from 'supertest';

// Require Node Libraries:
import { expect } 								from 'chai';
import { singleHotel }							from '../TestData/ValueChartsData';


describe('Group.routes', () => {

	var user: request.SuperTest<request.Test>;
	var temp: any;

	before(function() {
		user = request('http://localhost:3000/');
		user.get('null');
	});

	describe('Route: /ValueCharts', () => {

		describe('Method: Post', () => {


		});

	});

	describe('Route: /ValueCharts/:Chart', () => {

		describe('Method: Get', () => {

		});

		describe('Method: Put', () => {

		});

		describe('Method: Delete', () => {

		});

	});

	describe('Route: /ValueCharts/:Chart/structure', () => {

		describe('Method: Get', () => {

		});

		describe('Method: Put', () => {

		});

	});

	describe('Route: /ValueCharts/:Chart/users', () => {

		describe('Method: Post', () => {

		});

		describe('Method: Delete', () => {

		});

	});
});