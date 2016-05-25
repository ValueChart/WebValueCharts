/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:47:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 09:21:33
*/
"use strict";
var PrimitiveObjective_1 = require('../../app/resources/model/PrimitiveObjective');
var DiscreteDomain_1 = require('../../app/resources/model/DiscreteDomain');
describe('PrimitiveObjective', function () {
    var primitiveObjective;
    var discreteDomain;
    before(function () {
        discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
    });
    describe('#constructor(name: string, description: string)', function () {
        context('when constructor is used', function () {
            it('should have a domain, name, and description', function () {
                primitiveObjective = new PrimitiveObjective_1.PrimitiveObjective('TestObjective', 'A description goes here');
                expect(primitiveObjective.getName()).to.equal('TestObjective');
                expect(primitiveObjective.getDescription()).to.equal('A description goes here');
            });
        });
    });
    describe('#setDomain()', function () {
        it('should have a domain when the domain is set', function () {
            primitiveObjective.setDomain(discreteDomain);
            expect(primitiveObjective.getDomain()).to.equal(discreteDomain);
        });
    });
    describe('#getDomainType()', function () {
        context('when domain is discrete', function () {
            it('should have a domain type: "discrete"', function () {
                expect(primitiveObjective.getDomainType()).to.equal('discrete');
            });
        });
        context('when domain is continuous', function () {
            it('should have a domain type: "continuous"', function () {
                // TODO: Fill test in when implementing ContinuousDomain
            });
        });
    });
});
//# sourceMappingURL=primitiveObjective.test.js.map