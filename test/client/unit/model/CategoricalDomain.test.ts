/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 15:10:53
*/

// Import CategoricalDomain, the class to be tested.
import { CategoricalDomain } from '../../../../client/resources/model/CategoricalDomain';

import { expect }				from 'chai';



// This declares the test suite for the CategoricalDomain class
describe('CategoricalDomain', () => {
	var categoricalDomain: CategoricalDomain = new CategoricalDomain(false);

	// This declares the test suite for the getElements method of CategoricalDomain. # will be used before method names by convention...
	describe('#getElements()', () => {
		
		// This runs once before any of the it() functions within the describe/context function are executed (NOT before the context functions).
		before(function() {
			categoricalDomain = new CategoricalDomain(false);
		});
		// This declares a sub test suite for the getElements method. "context" is just an alias for "describe".
		context('when domain is empty', () => {
			// An actual test case that runs. Code not in an "it" (or "before", or "beforeEach", etc) block will NOT run. 
			// Don't try to put initialization code between "it" blocks in a context function.
			it('should return an empty array', () => {
				expect(categoricalDomain.getElements()).to.be.empty;;
			});
		});


		context('when domain has one element', () => {
			it('should return an array with just that element', () => {
				categoricalDomain.addElement('sunny');
				expect(categoricalDomain.getElements()).to.have.length(1);
				expect(categoricalDomain.getElements()[0]).to.equal('sunny');
			});
		});


		context('when domain has two elements', () => {
			it('should return an array with both the elements', () => {
				categoricalDomain.addElement('rainy');
				expect(categoricalDomain.getElements()).to.have.length(2);
				expect(categoricalDomain.getElements()[0]).to.equal('sunny');
				expect(categoricalDomain.getElements()[1]).to.equal('rainy');
			});
		});
	});

	describe('#addElement(element: string)', () => {
		
		before(function() {
			categoricalDomain = new CategoricalDomain(false);
			categoricalDomain.addElement('sunny');
			categoricalDomain.addElement('rainy');
		});

		context('when element is present in domain', () => {
			it('should not add the element again', () => {
				expect(categoricalDomain.getElements()).to.have.length(2);
				categoricalDomain.addElement('sunny');
				expect(categoricalDomain.getElements()).to.have.length(2);
			});
		});

		context('when element is NOT present in domain', () => {
			it('should add the new element', () => {
				expect(categoricalDomain.getElements()).to.have.length(2);
				categoricalDomain.addElement('cloudy');
				expect(categoricalDomain.getElements()).to.have.length(3);
				expect(categoricalDomain.getElements()[2]).to.equal('cloudy');
			});
		});
	});

	describe('#removeElement(element: string)', () => {
		
		before(function() {
			categoricalDomain = new CategoricalDomain(false);
			categoricalDomain.addElement('sunny');
			categoricalDomain.addElement('rainy');
		});

		context('when element is NOT present in domain', () => {
			it('should not do anything', () => {
				expect(categoricalDomain.getElements()).to.have.length(2);
				categoricalDomain.removeElement('cloudy');
				expect(categoricalDomain.getElements()).to.have.length(2);
			});
		});

		context('when element is present in the domain', () => {
			it('should remove the element', () => {
				expect(categoricalDomain.getElements()).to.have.length(2);
				categoricalDomain.removeElement('sunny');
				expect(categoricalDomain.getElements()).to.have.length(1);
				expect(categoricalDomain.getElements()[0]).to.equal('rainy');
			});

			it('should remove the element even if that leaves the domain empty', () => {
				categoricalDomain.removeElement('rainy');
				expect(categoricalDomain.getElements()).to.be.empty;;
			});
		});
	});

	describe('#setOrdered(ordered: boolean)', () => {
		before(function() {
			categoricalDomain = new CategoricalDomain(false);
		})

		it('should be able to set the domain to be ordered', () => {
			expect(categoricalDomain.ordered).to.be.false;;
			categoricalDomain.ordered = true;
			expect(categoricalDomain.ordered).to.be.true;
		});

		it('should be able to set the domain to be un-ordered', () => {
			expect(categoricalDomain.ordered).to.be.true;
			categoricalDomain.ordered = false;
			expect(categoricalDomain.ordered).to.be.false;;
		});

	});
});




