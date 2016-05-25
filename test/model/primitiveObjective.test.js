/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:47:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 17:22:52
*/
"use strict";
var PrimitiveObjective_1 = require('../../app/resources/model/PrimitiveObjective');
var DiscreteDomain_1 = require('../../app/resources/model/DiscreteDomain');
describe('PrimitiveObjective', function () {
    var primitiveObjective;
    var discreteDomain;
    describe('#constructor', function () {
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
        });
        context('when constructor is used', function () {
            it('should have a domain name, and description', function () {
                primitiveObjective = new PrimitiveObjective_1.PrimitiveObjective('TestObjective', 'A description goes here', discreteDomain);
                expect(primitiveObjective.getDomain()).to.equal(discreteDomain);
                expect(primitiveObjective.getName()).to.equal('TestObjective');
                expect(primitiveObjective.getDescription()).to.equal('A description goes here');
            });
        });
    });
});
//# sourceMappingURL=primitiveObjective.test.js.map