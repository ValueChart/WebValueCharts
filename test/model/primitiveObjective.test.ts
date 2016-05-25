/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:47:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 09:21:33
*/

import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { DiscreteDomain } 		from '../../app/resources/model/DiscreteDomain';

declare var expect: any;

describe('PrimitiveObjective', () => {
	var primitiveObjective: PrimitiveObjective;
	var discreteDomain: DiscreteDomain;

	before(function() {
		discreteDomain = new DiscreteDomain(false);
	});

	describe('#constructor(name: string, description: string)', () => {

		context('when constructor is used', () => {
			it('should have a domain, name, and description', () => {
				primitiveObjective = new PrimitiveObjective('TestObjective', 'A description goes here');
				expect(primitiveObjective.getName()).to.equal('TestObjective');
				expect(primitiveObjective.getDescription()).to.equal('A description goes here');
			});
		});

	});

	describe('#setDomain()', () => {

		it('should have a domain when the domain is set', () => {
			primitiveObjective.setDomain(discreteDomain);
			expect(primitiveObjective.getDomain()).to.equal(discreteDomain);
		});
	});

	describe('#getDomainType()', () => {

		context('when domain is discrete', () => {
			it('should have a domain type: "discrete"', () => {
				expect(primitiveObjective.getDomainType()).to.equal('discrete');
			});
		});

		context('when domain is continuous', () => {
			it('should have a domain type: "continuous"', () => {
				// TODO: Fill test in when implementing ContinuousDomain
			});
		});
	});


});