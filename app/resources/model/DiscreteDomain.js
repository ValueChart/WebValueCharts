/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-24 12:48:14
*/
"use strict";
var DiscreteDomain = (function () {
    function DiscreteDomain() {
        this.type = "discrete";
        this.elements = [];
    }
    // Should not allow you to add duplicate elements to the domain.
    DiscreteDomain.prototype.addElement = function (element) {
        var elementIndex = this.elements.indexOf(element);
        if (elementIndex == -1) {
            this.elements.push(element);
        }
    };
    DiscreteDomain.prototype.removeElement = function (element) {
        var elementIndex = this.elements.indexOf(element);
        if (elementIndex !== -1) {
            this.elements.splice(elementIndex, 1);
        }
    };
    DiscreteDomain.prototype.getElements = function () {
        return this.elements;
    };
    return DiscreteDomain;
}());
exports.DiscreteDomain = DiscreteDomain;
//# sourceMappingURL=DiscreteDomain.js.map