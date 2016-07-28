/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 10:48:51
*/


import { User } 				from '../../app/resources/model/User';
import { WeightMap } 			from '../../app/resources/model/WeightMap';
import { ScoreFunctionMap } 	from '../../app/resources/model/ScoreFunctionMap';

var expect: any = require('chai').expect;


describe('User', () => {
	var user: User;

	describe('#constructor(username: string)', () => {

		context('when the constructor is used', () => {
			it('should have a username', () => {
				user = new User('Aaron');
				expect(user.getUsername()).to.equal('Aaron');
			});
		});
	});

	// Current the rest of the methods in User are simple getters and setters that don't warrant testings.
});