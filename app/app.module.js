/*
* @Author: aaronpmishkin
* @Date:   2016-08-18 10:15:19
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-18 11:12:12
*/
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
// Import Angular Classes:
var core_1 = require('@angular/core');
var platform_browser_1 = require('@angular/platform-browser');
var forms_1 = require('@angular/forms');
var http_1 = require('@angular/http');
// Import Application Classes:
var app_routes_1 = require('./app.routes');
// Components List:
var Root_component_1 = require('./resources/components/root-component/Root.component');
var Register_component_1 = require('./resources/components/register-component/Register.component');
var Home_component_1 = require('./resources/components/home-component/Home.component');
var ValueChartViewer_component_1 = require('./resources/components/valueChartViewer-component/ValueChartViewer.component');
var Account_component_1 = require('./resources/components/account-component/Account.component');
var MyValueCharts_component_1 = require('./resources/components/myValueCharts-component/MyValueCharts.component');
var ScoreFunctionViewer_component_1 = require('./resources/components/scoreFunctionViewer-component/ScoreFunctionViewer.component');
var ExportValueChart_component_1 = require('./resources/components/exportValueChart-component/ExportValueChart.component');
// Directives List:
var ValueChart_directive_1 = require('./resources/directives/ValueChart.directive');
// Modules:
var create_module_1 = require('./resources/components/create.module');
var utilities_module_1 = require('./resources/components/utilities.module');
/*
    This is where the application is bootstrapped. Bootstrapping is when the initial components of the application are connected
    together by Angular. This should only ever be done once for an application, and it should be the first thing is that is done
    when the application is delivered to the client.

    Only classes that are absolute needed before any component is instantiated should be registered in the bootstrap method call.
    For us, this is the RootComponent, which is the only component that is always displayed regardless of the url path,
    APP_ROUTER_PROVIDERS, which contains the classes required for our application's routing to function properly,
    and HTTP_PROVIDERS, the providers required for HTTP methods to work properly across the application. Refrain from adding
    more classes to this list if possible. Having many classes bootstrap slows down the application's initial loading time
    and is bad style.
*/
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            imports: [
                platform_browser_1.BrowserModule,
                forms_1.FormsModule,
                http_1.HttpModule,
                app_routes_1.ROUTER,
                create_module_1.CreateModule,
                utilities_module_1.UtilitiesModule
            ],
            declarations: [
                Root_component_1.RootComponent,
                Register_component_1.RegisterComponent,
                Home_component_1.HomeComponent,
                ValueChartViewer_component_1.ValueChartViewerComponent,
                Account_component_1.AccountComponent,
                MyValueCharts_component_1.MyValueChartsComponent,
                ScoreFunctionViewer_component_1.ScoreFunctionViewerComponent,
                ExportValueChart_component_1.ExportValueChartComponent,
                ValueChart_directive_1.ValueChartDirective
            ],
            providers: [
                app_routes_1.APP_ROUTER_PROVIDERS
            ],
            bootstrap: [
                Root_component_1.RootComponent
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map