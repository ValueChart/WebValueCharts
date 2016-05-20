"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var router_1 = require('@angular/router');
var register_component_1 = require('../register-component/register.component');
var RootComponent = (function () {
    function RootComponent(_router) {
        this._router = _router;
    }
    RootComponent.prototype.ngOnInit = function () {
        this._router.navigate(['/register']);
    };
    RootComponent = __decorate([
        core_1.Component({
            selector: 'root',
            templateUrl: 'app/resources/components/root-component/root.template.html',
            directives: [router_1.ROUTER_DIRECTIVES]
        }),
        router_1.Routes([
            { path: '/register', component: register_component_1.RegisterComponent },
            { path: '*', component: register_component_1.RegisterComponent } // useAsDefault: true - coming soon...
        ]), 
        __metadata('design:paramtypes', [router_1.Router])
    ], RootComponent);
    return RootComponent;
}());
exports.RootComponent = RootComponent;
//# sourceMappingURL=root.component.js.map