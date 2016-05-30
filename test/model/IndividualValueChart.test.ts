/*
* @Author: aaronpmishkin
* @Date:   2016-05-30 11:54:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-30 12:09:49
*/


import { IndividualValueChart }		from '../../app/resources/model/IndividualValueChart';
import { User } 					from '../../app/resources/model/User';	


declare var expect: any;


describe('IndividualValueChart', () => {

	var valueChart: IndividualValueChart;

	var aaron: User;
	var samuel: User;

	before(function() {
		valueChart = new IndividualValueChart('IndividualChart', 'This is for testing and individual ValueChart', 'aaron');
	});

	describe("setUser(user: User)", () => {

		before(function() {
			aaron = new User('aaron');
			samuel = new User('samuel');
		})

		context('when the user is not yet defined', () => {
			it('should set the user field to be the given User', () => {
				expect(valueChart.getUser()).to.be.undefined;
				valueChart.setUser(aaron);
				expect(valueChart.getUser()).to.deep.equal(aaron);
			});aaron
		});

		context('when the user has already be set', () => {
			it('should set the user field to be the new User', () => {
				expect(valueChart.getUser()).to.deep.equal(aaron);
				valueChart.setUser(samuel);
				expect(valueChart.getUser()).to.deep.equal(samuel);
			});
		});
	});
});