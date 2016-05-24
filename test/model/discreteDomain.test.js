/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 14:00:15
*/
"use strict";
var DiscreteDomain_1 = require('../../app/resources/model/DiscreteDomain');
describe('DiscreteDomain', function () {
    var discreteDomain = new DiscreteDomain_1.DiscreteDomain();
    describe('#getElements()', function () {
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain();
        });
        context('when domain is empty', function () {
            it('should return an empty array', function () {
                expect(discreteDomain.getElements()).to.have.length(0);
            });
        });
        context('when domain has one element', function () {
            it('should return an array with just that element', function () {
                discreteDomain.addElement('sunny');
                expect(discreteDomain.getElements()).to.have.length(1);
                expect(discreteDomain.getElements()[0]).to.equal('sunny');
            });
        });
        context('when domain has two elements', function () {
            it('should return an array with both the elements', function () {
                discreteDomain.addElement('rainy');
                expect(discreteDomain.getElements()).to.have.length(2);
                expect(discreteDomain.getElements()[0]).to.equal('sunny');
                expect(discreteDomain.getElements()[1]).to.equal('rainy');
            });
        });
    });
    describe('#addElement(element: string)', function () {
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain();
            discreteDomain.addElement('sunny');
            discreteDomain.addElement('rainy');
        });
        context('when element is present in domain', function () {
            it('should not add the element again', function () {
                expect(discreteDomain.getElements()).to.have.length(2);
                discreteDomain.addElement('sunny');
                expect(discreteDomain.getElements()).to.have.length(2);
            });
        });
        context('when element is NOT present in domain', function () {
            it('should add the new element', function () {
                expect(discreteDomain.getElements()).to.have.length(2);
                discreteDomain.addElement('cloudy');
                expect(discreteDomain.getElements()).to.have.length(3);
                expect(discreteDomain.getElements()[2]).to.equal('cloudy');
            });
        });
    });
    describe('#removeElement(element: string)', function () {
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain();
            discreteDomain.addElement('sunny');
            discreteDomain.addElement('rainy');
        });
        context('when element is NOT present in domain', function () {
            it('should not do anything', function () {
                expect(discreteDomain.getElements()).to.have.length(2);
                discreteDomain.removeElement('cloudy');
                expect(discreteDomain.getElements()).to.have.length(2);
            });
        });
        context('when element is present in the domain', function () {
            it('should remove the element', function () {
                expect(discreteDomain.getElements()).to.have.length(2);
                discreteDomain.removeElement('sunny');
                expect(discreteDomain.getElements()).to.have.length(1);
                expect(discreteDomain.getElements()[0]).to.equal('rainy');
            });
            it('should remove the element even if that leaves the domain empty', function () {
                discreteDomain.removeElement('rainy');
                expect(discreteDomain.getElements()).to.have.length(0);
            });
        });
    });
});
//# sourceMappingURL=discreteDomain.test.js.map