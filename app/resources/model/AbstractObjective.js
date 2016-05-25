/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 17:33:12
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-25 09:50:52
*/
"use strict";
var AbstractObjective = (function () {
    function AbstractObjective(name, description) {
        this.name = name;
        this.description = description;
        this.objectiveType = 'abstract';
        this.subObjectives = [];
    }
    AbstractObjective.prototype.getName = function () {
        return this.name;
    };
    AbstractObjective.prototype.setName = function (name) {
        this.name = name;
    };
    AbstractObjective.prototype.getDescription = function () {
        return this.description;
    };
    AbstractObjective.prototype.setDescription = function (description) {
        this.description = description;
    };
    AbstractObjective.prototype.addSubObjective = function (objective) {
        this.subObjectives.push(objective);
    };
    AbstractObjective.prototype.removeSubObjective = function (objective) {
        var objectiveIndex = this.subObjectives.indexOf(objective);
        if (objectiveIndex !== -1) {
            this.subObjectives.splice(objectiveIndex, 1);
        }
    };
    AbstractObjective.prototype.getDirectSubObjectives = function () {
        return this.subObjectives;
    };
    AbstractObjective.prototype.getAllSubObjectives = function () {
        var subObjectives = [];
        this.subObjectives.forEach(function (objective) {
            subObjectives.push(objective);
            if (objective.objectiveType === 'abstract') {
                Array.prototype.push.apply(subObjectives, objective.getAllSubObjectives());
            }
        });
        return subObjectives;
    };
    return AbstractObjective;
}());
exports.AbstractObjective = AbstractObjective;
//# sourceMappingURL=AbstractObjective.js.map