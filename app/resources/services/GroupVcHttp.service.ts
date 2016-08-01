/*
* @Author: aaronpmishkin
* @Date:   2016-07-26 18:27:55
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-30 14:00:06
*/

import '../../rxjs-operators';

import { Injectable } 												from '@angular/core';
import { Http, Response } 											from '@angular/http';
import { Headers, RequestOptions } 									from '@angular/http';
import { Observable }     											from 'rxjs/Observable';

// Model Classes:
import { ValueChart }												from '../model/ValueChart';

// Utility Classes: 
import { JsonValueChartParser }										from '../utilities/JsonValueChartParser';


@Injectable()
export class GroupVcHttpService {

	private valueChartsUrl: string = 'ValueCharts';
	private hostUrl: string = 'host';

	private valueChartParser: JsonValueChartParser;

	private hostWebSocket: WebSocket;

	constructor (private http: Http) {
		this.valueChartParser = new JsonValueChartParser();
	}

	createGroupValueChart(valueChart: ValueChart, chartPassword: string): Observable<ValueChart> {
		// Attach the password to the ValueChart.
		valueChart.password = chartPassword;

		let body = JSON.stringify(valueChart);
    	let headers = new Headers({ 'Content-Type': 'application/json' });
    	let options = new RequestOptions({ headers: headers });

	    return this.http.post(this.valueChartsUrl, body, options)
	                    .map(this.extractValueChartData)
	                    .catch(this.handleError);
	}

	getGroupValueChart(id: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + '/' + id + '?' + password)
	                    .map(this.extractValueChartData)
	                    .catch(this.handleError);
	}

	getValueChartStructure(id: string, password: string): Observable<ValueChart> {
		return this.http.get(this.valueChartsUrl + '/' + id + '/structure?' + password)
			            .map(this.extractValueChartData)
	                    .catch(this.handleError);
	}

	// This method extracts the data from the response object and returns it as an observable.l
	extractData = (res: Response): ValueChart => {
 		let body = res.json();
  		return body.data || { }; // Return the body of the response, or an empty object if it is undefined.
	}

	extractValueChartData = (res: Response): ValueChart => {
		let body = res.json();
  		return this.valueChartParser.parseValueChart(JSON.parse(body.data));
	}

	// This method handles any errors from the request.
	handleError = (error: any, caught: Observable<ValueChart> ): Observable<ValueChart> => {
		return caught;
	}

	initiateHosting(id: string): void {
		this.hostWebSocket = new WebSocket('ws://' + window.location.host + '/' + this.hostUrl + '/' + id);

		this.hostWebSocket.onopen = (event: MessageEvent) => { console.log('sending a websocket message'); this.hostWebSocket.send('This is a test Message'); }

		this.hostWebSocket.onmessage = (event: MessageEvent) => { console.log(event.data); }
	}



}