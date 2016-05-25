/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 16:34:28
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 09:19:19
*/
"use strict";
var PrimitiveObjective = (function () {
    function PrimitiveObjective(name, description) {
        this.name = name;
        this.description = description;
    }
    PrimitiveObjective.prototype.getName = function () {
        return this.name;
    };
    PrimitiveObjective.prototype.setName = function (name) {
        this.name = name;
    };
    PrimitiveObjective.prototype.getDescription = function () {
        return this.description;
    };
    PrimitiveObjective.prototype.setDescription = function (description) {
        this.description = description;
    };
    PrimitiveObjective.prototype.getColor = function () {
        return this.color;
    };
    PrimitiveObjective.prototype.setColor = function (color) {
        this.color = color;
    };
    PrimitiveObjective.prototype.getDomainType = function () {
        return this.domain.type;
    };
    PrimitiveObjective.prototype.getDomain = function () {
        return this.domain;
    };
    PrimitiveObjective.prototype.setDomain = function (domain) {
        this.domain = domain;
    };
    return PrimitiveObjective;
}());
exports.PrimitiveObjective = PrimitiveObjective;
//# sourceMappingURL=PrimitiveObjective.js.map