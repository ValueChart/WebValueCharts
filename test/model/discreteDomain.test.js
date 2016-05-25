/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 14:26:56
*/
"use strict";
// Import DiscreteDomain, the class to be tested.
var DiscreteDomain_1 = require('../../app/resources/model/DiscreteDomain');
// This declares the test suite for the DiscreteDomain class
describe('DiscreteDomain', function () {
    var discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
    // This declares the test suite for the getElements method of DiscreteDomain. # will be used before method names by convention...
    describe('#getElements()', function () {
        // This runs before all of the it() functions within the describe/context function are executed (NOT before the context functions).
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
        });
        // This declares a sub test suite for the getElements method. "context" is just an alias for "describe".
        context('when domain is empty', function () {
            // An actual test case that runs. Code not in an "it" (or "before", or "beforeEach", etc) block will NOT run. 
            // Don't try to put initialization code between "it" blocks in a context function.
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
            discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
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
            discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
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
    describe('#setOrdered(ordered: boolean)', function () {
        before(function () {
            discreteDomain = new DiscreteDomain_1.DiscreteDomain(false);
        });
        it('should be able to set the domain to be ordered', function () {
            expect(discreteDomain.getOrdered()).to.equal(false);
            discreteDomain.setOrdered(true);
            expect(discreteDomain.getOrdered()).to.equal(true);
        });
        it('should be able to set the domain to be un-ordered', function () {
            expect(discreteDomain.getOrdered()).to.equal(true);
            discreteDomain.setOrdered(false);
            expect(discreteDomain.getOrdered()).to.equal(false);
        });
    });
});
//# sourceMappingURL=discreteDomain.test.js.map