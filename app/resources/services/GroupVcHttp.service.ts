/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 18:27:55
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-04 14:49:24
*/

import '../../rxjs-operators';

import { Injectable } 												from '@angular/core';
import { Http, Response } 											from '@angular/http';
import { Headers, RequestOptions } 									from '@angular/http';
import { Observable }     											from 'rxjs/Observable';

// Model Classes:
import { ValueChart }												from '../model/ValueChart';
import { User }														from '../model/User';

// Utility Classes: 
import { JsonValueChartParser }										from '../utilities/JsonValueChartParser';

// Types: 
import { HostMessage, MessageType }									from '../types/HostMessage';

@Injectable()
export class GroupVcHttpService {

	private valueChartsUrl: string = 'ValueCharts/';

	private valueChartParser: JsonValueChartParser;

	private hostWebSocket: WebSocket;

	constructor(private http: Http) {
		this.valueChartParser = new JsonValueChartParser();
	}

	// ValueChart Methods:

	createValueChart(valueChart: ValueChart): Observable<ValueChart> {

		if (!valueChart._id)
			valueChart._id = undefined;

		let body = JSON.stringify(valueChart);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.valueChartsUrl, body, options)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	getValueChart(chartId: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + chartId + '?password=' + password)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	deleteValueChart(chartId: string): Observable<any> {
		return this.http.delete(this.valueChartsUrl + chartId)
			.map(this.extractBody)
			.catch(this.handleError);
	}

	// ValueChart Structure Methods:

	getValueChartStructure(chartName: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + chartName + '/structure?password=' + password)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	setValueChartStructure(chartId: string, valueChart: ValueChart): Observable<ValueChart> {
		let body = JSON.stringify(valueChart);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + chartId + '/structure', body, options)
			.map(this.extractValueChartData)
			.catch(this.handleError);
	}

	// ValueChart User Methods:

	addUserToChart(chartId: string, user: User): Observable<User> {
		let body = JSON.stringify(user);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post(this.valueChartsUrl + chartId + '/users', body, options)
			.map(this.extractUserData)
			.catch(this.handleError);
	}

	updateUser(chartId: string, user: User): Observable<User> {
		let body = JSON.stringify(user);
		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.put(this.valueChartsUrl + chartId + '/users/' + user.getUsername(), body, options)
			.map(this.extractUserData)
			.catch(this.handleError);
	}

	deleteUser(chartId: string, username: string): Observable<User> {
		return this.http.delete(this.valueChartsUrl + chartId + '/users/' + username)
			.map(this.extractData)
			.catch(this.handleError);
	}

	// Helper Functions: 

	extractBody = (res: Response): any => {
		return res;
	}

	// This method extracts the data from the response object and returns it as an observable.l
	extractData = (res: Response): ValueChart => {
		let body = res.json();
		return body.data || {}; // Return the body of the response, or an empty object if it is undefined.
	}

	extractValueChartData = (res: Response): ValueChart => {
		let body = res.json();
		return this.valueChartParser.parseValueChart(JSON.parse(body.data));
	}

	extractUserData = (res: Response): User => {
		let body = res.json();
		return this.valueChartParser.parseUser(body.data);
	}

	// This method handles any errors from the request.
	handleError = (error: any, caught: Observable<any>): Observable<any> => {
		let errMsg = (error.message) ? error.message :
			error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		return Observable.throw(errMsg);
	}
}