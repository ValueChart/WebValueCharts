/*
* @Author: aaronpmishkin
* @Date:   2016-08-01 15:27:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-06-09 16:31:23
*/

export interface HostConnectionStatus {
	chartId: string;
	connectionStatus: string;
}

export var hostConnections: Map<string, HostConnectionStatus> = new Map<string, HostConnectionStatus>();