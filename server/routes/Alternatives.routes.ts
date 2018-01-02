/*
* @Author: aaronpmishkin
* @Date:   2017-07-18 11:07:37
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-18 11:07:37
*/

var hotelAlternatives: any[] = [
	{ "name": "Sheraton", "description": "Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "highspeed"], ["rate_23", 150], ["skytrain-distance_19", 7], ["size_21", 350], ["area_18", "Yaletown"]], "id": "Sheraton_24" },
	{ "name": "BestWestern", "description": "Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "highspeed"], ["rate_23", 100], ["skytrain-distance_19", 2], ["size_21", 200], ["area_18", "Yaletown"]], "id": "BestWestern_25" }, 
	{ "name": "Hyatt", "description": "Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.", "objectiveValues": [["internet-access_22", "lowspeed"], ["rate_23", 200], ["skytrain-distance_19", 6], ["size_21", 275], ["area_18", "Kitsilano"]], "id": "Hyatt_26" }, 
	{ "name": "Marriott", "description": "The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "lowspeed"], ["rate_23", 175], ["skytrain-distance_19", 2], ["size_21", 200], ["area_18", "Airport"]], "id": "Marriott_27" }, 
	{ "name": "Ramada", "description": "1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control", "objectiveValues": [["internet-access_22", "none"], ["rate_23", 125], ["skytrain-distance_19", 8], ["size_21", 312.5], ["area_18", "Kitsilano"]], "id": "Ramada_29" }
];

var cellPhoneAlternatives: any[] = [
	{"name":"iPhone X","description":"","objectiveValues":[["_5",97],["_62",4016],["_3",5.8],["_6","IOS"],["_4",9.5],["_7",1320]],"id":"_15"},
	{"name":"iPhone 8 Plus","description":"","objectiveValues":[["_5",94],["_62",3936],["_3",5.5],["_6","IOS"],["_4",12.5],["_7",1060]],"id":"_16"},
	{"name":"Pixel 2 XL","description":"","objectiveValues":[["_5",98],["_62",4763],["_3",6],["_6","Google Android"],["_4",10],["_7",1160]],"id":"_17"},
	{"name":"Pixel 2","description":"","objectiveValues":[["_5",98],["_62",4192],["_3",5],["_6","Google Android"],["_4",12],["_7",900]],"id":"_18"},
	{"name":"Pixel 1","description":"","objectiveValues":[["_5",90],["_62",3208],["_3",5],["_6","Google Android"],["_4",7.5],["_7",700]],"id":"_19"},
	{"name":"Mate 10 Pro","description":"","objectiveValues":[["_5",97],["_62",3263],["_3",6],["_6","Android"],["_4",15],["_7",1200]],"id":"_20"},
	{"name":"HTC U11","description":"","objectiveValues":[["_5",90],["_62",3973],["_3",5.5],["_6","Android"],["_4",10.5],["_7",900]],"id":"_21"},
	{"name":"iPhone 7","description":"","objectiveValues":[["_5",85],["_62",2514],["_3",4.7],["_6","IOS"],["_4",12],["_7",740]],"id":"_22"},
	{"name":"iPhone 7 Plus","description":"","objectiveValues":[["_5",88],["_62",2516],["_3",5.5],["_6","IOS"],["_4",13.5],["_7",900]],"id":"_23"},
	{"name":"Xperia XZ Premium","description":"","objectiveValues":[["_5",83],["_62",4103],["_3",5.5],["_6","Android"],["_4",10],["_7",800]],"id":"_24"},
	{"name":"Galaxy S6 Edge","description":"","objectiveValues":[["_5",82],["_62",1536],["_3",5.1],["_6","Android"],["_4",10.5],["_7",500]],"id":"_25"},
	{"name":"Galaxy Note 8","description":"","objectiveValues":[["_5",94],["_62",4775],["_3",6.3],["_6","Android"],["_4",10.5],["_7",1200]],"id":"_26"},
	{"name":"Meizu Pro 6","description":"","objectiveValues":[["_5",74],["_62",1224],["_3",5.2],["_6","Android"],["_4",7.5],["_7",600]],"id":"_28"},
	{"name":"OnePlus 5","description":"","objectiveValues":[["_5",87],["_62",4357],["_3",5.5],["_6","Android"],["_4",11],["_7",760]],"id":"_29"},
	{"name":"BlackBerry Priv","description":"","objectiveValues":[["_5",82],["_62",1455],["_3",5.4],["_6","Android"],["_4",8.5],["_7",320]],"id":"_30"},
	{"name":"HTC One M9","description":"","objectiveValues":[["_5",69],["_62",1829],["_3",5],["_6","Android"],["_4",7.5],["_7",340]],"id":"_31"},
	{"name":"LG G6","description":"","objectiveValues":[["_5",84],["_62",2848],["_3",5.7],["_6","Android"],["_4",8.5],["_7",730]],"id":"_32"},
	{"name":"Xiaomi Mi 5s","description":"","objectiveValues":[["_5",78],["_62",2614],["_3",5.15],["_6","Android"],["_4",12.5],["_7",700]],"id":"_33"},
	{"name":"Moto Z Force","description":"","objectiveValues":[["_5",87],["_62",2887],["_3",5.5],["_6","Android"],["_4",11],["_7",500]],"id":"_34"}
];

var vacationAlternatives: any[] = [

];

var dateNightAlternatives: any[] = [
	{"name":"Superhero Movie","description":"Go to see DC Comics most recent superhero movie in theatres.","objectiveValues":[["_2",40],["_3","Minor"],["_4",2.5],["_5","Mild"],["_6","None"]],"id":"_13"},
	{"name":"Romantic Movie","description":"Go to see a romantic movie in theatres","objectiveValues":[["_2",40],["_3","Minor"],["_4",2.5],["_5","Intermediate"],["_6","None"]],"id":"_13"},
	{"name":"Ski Trip","description":"Go for an overnight ski trip in Whistler.","objectiveValues":[["_3","Major"],["_5","Very Intense"],["_6","Strenuous"],["_4",12],["_2",500]],"id":"_100"},
	{"name":"Victoria Trip","description":"Go for a day trip over to Victoria on Vancouver Island.","objectiveValues":[["_3","Major"],["_5","Very Intense"],["_6","Moderate"],["_2",180],["_4",12]],"id":"_16"},
	{"name":"Fast Food","description":"Go to McDonalds for dinner.","objectiveValues":[["_2",20],["_3","Intermediate"],["_5","Dull"],["_6","None"],["_4",0.5]],"id":"_17"},
	{"name":"3-Star Restaurant","description":"Go to an average restaurant in Vancouver for a dinner date. Not fancy, but not plain either.","objectiveValues":[["_2",95],["_3","Intermediate"],["_5","Intermediate"],["_4",2],["_6","None"]],"id":"_51"},
	{"name":"4-Star Restaurant","description":"Go to an excellent restaurant in Vancouver for a dinner date.","objectiveValues":[["_2",150],["_3","Intermediate"],["_4",2.5],["_5","Intense"],["_6","None"]],"id":"_52"},
	{"name":"5-Star Restaurant","description":"Go to an outstanding restaurant in Vancouver for a dinner date","objectiveValues":[["_4",3],["_3","Major"],["_2",250],["_5","Intense"],["_6","None"]],"id":"_53"},
	{"name":"Beach Picnic","description":"Head to the beach for a picnic.","objectiveValues":[["_2",25],["_3","Intermediate"],["_4",3],["_5","Intense"],["_6","Mild"]],"id":"_54"},
	{"name":"Day at the Beach","description":"Head to the beach for a day of fun in the sun.","objectiveValues":[["_2",0],["_3","Intermediate"],["_5","Mild"],["_4",9],["_6","Moderate"]],"id":"_55"},
	{"name":"Day Hike","description":"Drive to the North Shore for a day hike in the mountains.","objectiveValues":[["_2",0],["_3","Intermediate"],["_4",12],["_5","Intermediate"],["_6","Strenuous"]],"id":"_83"},
	{"name":"Seawall Walk","description":"Go for a walk along the seawall.","objectiveValues":[["_2",0],["_3","Intermediate"],["_4",2],["_5","Intense"],["_6","Mild"]],"id":"_84"},
	{"name":"Comedy Club","description":"Head to the improve night at the local comedy club.","objectiveValues":[["_2",60],["_3","Minor"],["_4",3],["_5","Intermediate"],["_6","None"]],"id":"_85"},
	{"name":"Coffee","description":"Grab a cup of coffee at a hip place in Vancouver.","objectiveValues":[["_2",15],["_3","Intermediate"],["_5","Mild"],["_4",1],["_6","None"]],"id":"_86"},
	{"name":"Bowling","description":"Go bowling at the nearest bowling alley.","objectiveValues":[["_2",45],["_3","Minor"],["_4",1],["_5","Dull"],["_6","Moderate"]],"id":"_87"},
	{"name":"Art Gallery","description":"Go to the Vancouver Art Gallery and see the traveling exhibits.","objectiveValues":[["_2",48],["_3","Intermediate"],["_4",2],["_5","Intermediate"],["_6","Moderate"]],"id":"_88"},
	{"name":"Dancing","description":"Seek out the nearest club and cut some rug.","objectiveValues":[["_3","Major"],["_6","Strenuous"],["_4",3],["_5","Intense"],["_2",75]],"id":"_89"}
];

const problems: any = { "Demo_Hotel": hotelAlternatives, "Cell_Phone_Selection": cellPhoneAlternatives, "vacation": vacationAlternatives, "Date_Night": dateNightAlternatives };


const fs = require('fs');

// Import Libraries and Express Middleware:
import * as express from 'express';
import * as path from 'path';
import * as MongoDB from 'mongodb';
import * as Monk from 'monk';
import * as _ from 'lodash';

// Import Application Classes:
import { HostEventEmitter, hostEventEmitter } from '../utilities/HostEventEmitters';
import { valueChartUsersRoutes } from './ValueChartsUsers.routes';

export var alternativesRoutes: express.Router = express.Router();

alternativesRoutes.post('/:chart/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var username = req.params.username;
	var chartname = req.params.chart;

	fs.appendFile('data/' + chartname + '_' + username + '.txt', JSON.stringify(req.body.user) + "\n", (err: any) => {
	 	if (err) throw err;
		console.log('The data was appended to file!');
	});


	var nextAlternatives: any[] = [];
	var selectedAlternatives = req.body.alternatives;
	var unselectedAlternatives = _.differenceBy(problems[chartname], selectedAlternatives, 'name')

	nextAlternatives.push(unselectedAlternatives[_.random(0, (unselectedAlternatives.length - 1))])

	res.status(200)
		.json({ data: nextAlternatives });

});

alternativesRoutes.get('/:chart/all', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var chartname = req.params.chart;

	var alternatives = problems[chartname];
	
	res.status(200)
		.json({ data: alternatives });
});
