/*
* @Author: aaronpmishkin
* @Date:   2016-07-31 16:48:20
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-01 15:30:01
*/

export interface HostMessage {
	type: string;
	data: any;
	chartId: string;
}