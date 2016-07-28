/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:47:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-28 10:45:00
*/

import { PrimitiveObjective } 	from '../../app/resources/model/PrimitiveObjective';
import { CategoricalDomain } 		from '../../app/resources/model/CategoricalDomain';
import { ContinuousDomain } 		from '../../app/resources/model/ContinuousDomain';


var expect: any = require('chai').expect;


describe('PrimitiveObjective', () => {
	var primitiveObjective: PrimitiveObjective;
	var categoricalDomain: CategoricalDomain;
	var continuousDomain: ContinuousDomain;

	before(function() {
		categoricalDomain = new CategoricalDomain(false);
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
			primitiveObjective.setDomain(categoricalDomain);
			expect(primitiveObjective.getDomain()).to.deep.equal(categoricalDomain);
		});
	});

	describe('#getDomainType()', () => {

		beforeEach(function() {
			primitiveObjective = new PrimitiveObjective('TestObjective', 'A description goes here');
		})

		context('when domain is discrete', () => {
			it('should have a domain type: "categorical"', () => {
				primitiveObjective.setDomain(categoricalDomain);
				expect(primitiveObjective.getDomainType()).to.equal('categorical');
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