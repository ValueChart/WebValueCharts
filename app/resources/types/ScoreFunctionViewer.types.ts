/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 15:42:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-12 12:55:17
*/

import { User }							from '../model/User';	

export interface DomainElement {
	element: (string | number);
	user: User;
}

export interface UserDomainElements {
	elements: DomainElement[];
	user: User;
}