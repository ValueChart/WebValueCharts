/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 14:49:33
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-12 11:30:58
*/
"use strict";
// Import Libraries and Middlware:
var express = require('express');
var monk = require('monk');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
//  Routers:
var Index_routes_1 = require('./routes/Index.routes');
var ValueCharts_routes_1 = require('./routes/ValueCharts.routes');
var Users_routes_1 = require('./routes/Users.routes');
// Types and Utilities
var HostEventEmitters_1 = require('./utilities/HostEventEmitters');
var HostConnections_1 = require('./utilities/HostConnections');
var auth_1 = require('./utilities/auth');
var backend = express();
// Retrieve the database via the connection url. development is the username and BackEndConstruction is the password.
var db = monk('mongodb://development:BackEndConstruction@ds021915.mlab.com:21915/web-valuecharts');
var expressWs = require('express-ws')(backend);
// uncomment after placing your favicon in /public
// backend.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
backend.use(logger('dev'));
backend.use(bodyParser.json());
backend.use(bodyParser.urlencoded({ extended: false }));
// Note that the secrete for cookie parser and expressSession MUST be the same.
backend.use(cookieParser('ThisIsOurSecret'));
// Initialize ExpressSession:
backend.use(expressSession({
    secret: 'ThisIsOurSecret',
    cookie: {
        maxAge: null,
        secure: false,
    },
    resave: false,
    saveUninitialized: true
}));
// Initialize Passport:
backend.use(auth_1.passport.initialize());
backend.use(auth_1.passport.session());
backend.use(express.static(__dirname));
// Attach the database to the request object
backend.use(function (req, res, next) {
    req.db = db;
    next();
});
// Set the proper Access-Control headers for all responses.
backend.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Credentials', true);
    next();
});
// Attach routers to manage specific URIs
backend.use('/', Index_routes_1.indexRoutes);
backend.use('/ValueCharts', ValueCharts_routes_1.valueChartRoutes);
backend.use('/Users', Users_routes_1.usersRoutes);
backend.ws('/host/:chart', function (ws, req) {
    var chartId = req.params.chart;
    // Initialize Connection:
    var eventListeners = initEventListeners(chartId, ws);
    HostConnections_1.hostConnections.set(chartId, { chartId: chartId, connectionStatus: 'open', userChangesAccepted: true });
    // Send message confirming successful connection:
    ws.send(JSON.stringify({ data: 'complete', chartId: chartId, type: 4 /* ConnectionInit */ }));
    // This fires whenever the socket receives a message.
    ws.on('message', function (msg) {
        var hostMessage = JSON.parse(msg);
        switch (hostMessage.type) {
            case 4 /* ConnectionInit */:
                break;
            case 3 /* ChangePermissions */:
                HostConnections_1.hostConnections.get(chartId).userChangesAccepted = hostMessage.data;
                ws.send(JSON.stringify({ data: hostMessage.data, chartId: chartId, type: 3 /* ChangePermissions */ }));
                break;
            default:
                break;
        }
    });
    // This fires when the socket is closed.
    ws.on('close', function () {
        // Cleanup the event listeners.
        eventListeners.forEach(function (listener) {
            HostEventEmitters_1.hostEventEmitter.removeListener(listener.eventName, listener.listener);
        });
    });
});
var initEventListeners = function (chartId, ws) {
    var addedListener = function (user) {
        ws.send(JSON.stringify({ type: 0 /* UserAdded */, data: user, chartId: chartId }));
    };
    var removedListener = function (username) {
        ws.send(JSON.stringify({ type: 2 /* UserRemoved */, data: username, chartId: chartId }));
    };
    var changedListener = function (user) {
        ws.send(JSON.stringify({ type: 1 /* UserChanged */, data: user, chartId: chartId }));
    };
    // Initialize event listeners:
    HostEventEmitters_1.hostEventEmitter.on(HostEventEmitters_1.HostEventEmitter.USER_ADDED_EVENT + '-' + chartId, addedListener);
    HostEventEmitters_1.hostEventEmitter.on(HostEventEmitters_1.HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId, removedListener);
    HostEventEmitters_1.hostEventEmitter.on(HostEventEmitters_1.HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId, changedListener);
    return [{ listener: addedListener, eventName: HostEventEmitters_1.HostEventEmitter.USER_ADDED_EVENT + '-' + chartId },
        { listener: removedListener, eventName: HostEventEmitters_1.HostEventEmitter.USER_REMOVED_EVENT + '-' + chartId },
        { listener: changedListener, eventName: HostEventEmitters_1.HostEventEmitter.USER_CHANGED_EVENT + '-' + chartId }];
};
// catch 404 errors and redirect the request to the index.html file.
backend.use(function (req, res, next) {
    var options = {
        root: __dirname,
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    res.sendFile('index.html', options);
});
// error handlers:
// development error handler
// will print stacktrace
if (backend.get('env') === 'development') {
    backend.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
backend.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});
module.exports = backend;
backend.listen(3000);
//# sourceMappingURL=WebValueCharts.js.map