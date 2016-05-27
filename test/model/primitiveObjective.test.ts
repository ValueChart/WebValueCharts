/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:47:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-27 15:00:34
*/

import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { DiscreteDomain } 		from '../../app/resources/model/DiscreteDomain';
import { ContinuousDomain } 		from '../../app/resources/model/ContinuousDomain';


declare var expect: any;

describe('PrimitiveObjective', () => {
	var primitiveObjective: PrimitiveObjective;
	var discreteDomain: DiscreteDomain;
	var continuousDomain: ContinuousDomain;

	before(function() {
		discreteDomain = new DiscreteDomain(false);
		continuousDomain = new ContinuousDomain(10, 20);
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

		beforeEach(function() {
			primitiveObjective = new PrimitiveObjective('TestObjective', 'A description goes here');
		})

		it('should have a domain when the domain is set', () => {
			primitiveObjective.setDomain(discreteDomain);
			expect(primitiveObjective.getDomain()).to.deep.equal(discreteDomain);
		});
	});

	describe('#getDomainType()', () => {

		beforeEach(function() {
			primitiveObjective = new PrimitiveObjective('TestObjective', 'A description goes here');
		})

		context('when domain is discrete', () => {
			it('should have a domain type: "discrete"', () => {
				primitiveObjective.setDomain(discreteDomain);
				expect(primitiveObjective.getDomainType()).to.equal('discrete');
			});
		});

		context('when domain is continuous', () => {
			it('should have a domain type: "continuous"', () => {
				primitiveObjective.setDomain(continuousDomain);
				expect(primitiveObjective.getDomainType()).to.equal('continuous');
			});
		});
	});
});