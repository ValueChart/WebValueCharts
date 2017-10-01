/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 16:41:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:47
*/


import { User } 				from '../../../../client/src/model';
import { WeightMap } 			from '../../../../client/src/model';
import { ScoreFunctionMap } 	from '../../../../client/src/model';

// import { expect }				from 'chai';


import { expect }				from 'chai';

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

	// The rest of the methods in User are simple getters and setters that don't warrant testings.
});