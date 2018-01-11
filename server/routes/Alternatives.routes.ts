/*
* @Author: aaronpmishkin
* @Date:   2017-07-18 11:07:37
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-18 11:07:37
*/

var hotelAlternatives: any[] = [
	{ "name": "Sheraton", "description": "Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "highspeed"], ["rate_23", 150], ["skytrain-distance_19", 7], ["size_21", 350], ["area_18", "Bronx"]], "id": "Sheraton_24" },
	{ "name": "BestWestern", "description": "Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "highspeed"], ["rate_23", 350], ["skytrain-distance_19", 2], ["size_21", 200], ["area_18", "Manhattan"]], "id": "BestWestern_25" }, 
	{ "name": "Hyatt", "description": "Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.", "objectiveValues": [["internet-access_22", "lowspeed"], ["rate_23", 175], ["skytrain-distance_19", 6], ["size_21", 275], ["area_18", "Queens"]], "id": "Hyatt_26" }, 
	{ "name": "Marriott", "description": "The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.", "objectiveValues": [["internet-access_22", "lowspeed"], ["rate_23", 250], ["skytrain-distance_19", 2], ["size_21", 200], ["area_18", "Manhattan"]], "id": "Marriott_27" }, 
	{ "name": "Ramada", "description": "1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control", "objectiveValues": [["internet-access_22", "none"], ["rate_23", 125], ["skytrain-distance_19", 8], ["size_21", 312.5], ["area_18", "Queens"]], "id": "Ramada_29" }
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

var residenceAlternatives: any[] = [
	{"name":"Mountain View","description":"A brand new, beautiful apartment located in the gateway of Vancouver at Cambie and South West Marine Drive. This one year-old, 16th floor unit is one 1 bedroom, plus den and a balcony.","objectiveValues":[["_61",532],["_15",1750],["_62","Excellent"],["_63","Apartment"],["_14","South Van"]],"id":"_40"},
	{"name":"Garden Suite","description":"Fully furnished 500sqft lovely garden suite. Bedroom has queen size bed. Bathroom has stand-alone shower. Located in safe and friendly Dunbar neighbourhood, one block from Dunbar village (shopping), major bus lines to UBC, Kits beach and downtown. Private entrance with cycle storage and access to large backyard garden. ","objectiveValues":[["_14","Dunbar"],["_15",1500],["_61",500],["_62","Intermediate"],["_63","Basement Suite"]],"id":"_41"},
	{"name":"Kingsway Tower","description":"A four year-old apartment tower located in Collingwood, East Vancouver. Apartment is complete with in-suite laundry. Rent includes one parking stall.","objectiveValues":[["_15",1800],["_61",536],["_62","Excellent"],["_63","Apartment"],["_14","East Van"]],"id":"_42"},
	{"name":"Mini 1-Bedroom","description":"Located just off of trendy Commercial Drive, which is home to funky shops and fine restaurants and is only 10 minutes from downtown Vancouver via public transit. Has washer/drasher in the unit.","objectiveValues":[["_15",650],["_61",400],["_62","Poor"],["_63","Basement Suite"],["_14","East Van"]],"id":"_43"},
	{"name":"Shared Basement","description":"The suite comes furnished, with utilities and wifi included. The kitchen is newly renovated and includes a dishwasher, microwave, and oven/stove! The house is in a quiet neighbourhood with lots of free street parking. ","objectiveValues":[["_15",925],["_63","Share House"],["_61",800],["_62","Intermediate"],["_14","Dunbar"]],"id":"_44"},
	{"name":"Downtown Tower","description":"Luxury condo located in the Coal Harbour area of downtown Vancouver. Comes fully furnished and with city and bay-side windows.","objectiveValues":[["_14","Downtown"],["_15",2650],["_61",662],["_62","Excellent"],["_63","Apartment"]],"id":"_45"},
	{"name":"Arbutus House","description":"Spacious 4 level home for rent in Vancouver West Arbutus area. 2986 sqft and 6000 sqft lot featuring 4 bedrooms and 2 full baths. Gas fire place, wood flooring, and upgraded balcony. Large deck adjacent to kitchen and dinning room. Breathtaking & unobstructed views of city/water/mountains.","objectiveValues":[["_62","Intermediate"],["_63","Share House"],["_15",1000],["_14","Dunbar"],["_61",1000]],"id":"_212"},
	{"name":"Pinnacle South","description":"In heart of Kitsilano, on the quiet side of the building is a beautiful  1 bedroom + 1 Bath + Flex room/ Large in-suite storage room + solarium + 158 sqft patio This 5 year old building still feels brand new, very clean and well maintained.  This south facing unit gets lots of light and sun, over looking a quite street with no power lines in sight.","objectiveValues":[["_14","Kitsilano"],["_61",708],["_15",2380],["_62","Excellent"],["_63","Apartment"]],"id":"_213"},
	{"name":"Esse","description":"","objectiveValues":[["_14","UBC"],["_15",1400],["_61",500],["_62","Intermediate"],["_63","Apartment"]],"id":"_214"},
	{"name":"West Ender","description":"Great location in Vancouver's West End. In the midst of Downtown Vancouver but perfectly located as to not hear the noise of Vancouver's downtown nightlife. Apartment is located on the third floor and includes hardwood floors. Card operated laundry is in the building.","objectiveValues":[["_14","Downtown"],["_15",875],["_61",480],["_62","Intermediate"],["_63","Apartment"]],"id":"_215"},
	{"name":"Gastown Room","description":"Hotel Room for Rent in recently renovated Heritage Hotel in trendy Gastown, Downtown Vancouver. This room is done in an old New York Style.  There is no better location to live in Downtown Vancouver than Gastown.","objectiveValues":[["_14","Downtown"],["_63","Share House"],["_61",250],["_15",800],["_62","Excellent"]],"id":"_216"},
	{"name":"Kits Basement","description":"Lovely 2 bedroom basement suite of a house in Kitsilano. TWo blocks from West Broadway Street.","objectiveValues":[["_63","Basement Suite"],["_14","Kitsilano"],["_15",700],["_61",900],["_62","Poor"]],"id":"_379"},
	{"name":"Marpole Share","description":"Designed by esteemed Formwerks Architectural, Osler Residences is an exclusive collection of traditionally designed townhomes inspired by the grand estates of nearby Shaughnessy. This 3 bedroom homes have warm and modern interiors by acclaimed Occupy Design, featuring Bosch appliances, Fisher & Paykel fridge, central air-conditioning, 9 feet main floor ceiling height, en-suite large format designer tiles, Kohler fixtures and NuHeat flooring. Each home will also feature a den for an office or additional storage space, a generously-sized flex room in lower level with direct access to parking, and private patio. ","objectiveValues":[["_15",760],["_61",400],["_62","Intermediate"],["_63","Share House"],["_14","South Van"]],"id":"_380"},
	{"name":"Wesbrook","description":"Elegant 4 Bedroom Townhome at The Wesbrook UBC. Has in-suite laundry and a double car garage.","objectiveValues":[["_15",1175],["_61",500],["_62","Excellent"],["_63","Share House"],["_14","UBC"]],"id":"_381"},
	{"name":"Granite House","description":"Charming, very well maintained 5 bed, 3 bath Point Grey home in a prime location on a quiet street near Queen Elizabeth and Lord Byng schools, within minutes of UBC and Pt Grey Shops. Front living room and dining room lead onto the front veranda overlooking the front garden and street escape. New granite custom kitchen with the family room steps out to the private back garden, offering a peaceful oasis of spring & summer flowers. The main floor also has 1 bed, 1 bath, large mud room/laundry/pantry. No basement! Numerous skylights upstairs let in all the natural light into the 2 bedrooms & 1 bathroom up. ","objectiveValues":[["_14","Kitsilano"],["_63","Share House"],["_62","Intermediate"],["_61",600],["_15",1020]],"id":"_382"},
	{"name":"Keats Hall","description":"This wonderfully kept unit at Keats Hall is centrally located in UBC and a just a few steps to a number of commuting options. Fully furnished with maple cabinets, stainless steel appliances, and living room furniture - you're ready to move in from day one. A spacious, lit living room also includes a gas fireplace to keep you warm as fall goes into winter. The apartment is flooded with natural light, with large windows and 9 ft ceilings. A large balcony looks on a well-landscaped and quiet private street, and will be wonderful for entertaining or dining outdoors during summer. The spacious master bedroom comes with an ensuite bathroom and offers plenty of room for relaxation and studying.","objectiveValues":[["_61",700],["_15",2150],["_63","Apartment"],["_62","Excellent"],["_14","UBC"]],"id":"_383"},
	{"name":"East Dunbar","description":"","objectiveValues":[["_14","Dunbar"],["_63","Share House"],["_62","Poor"],["_15",750],["_61",640]],"id":"_494"},
	{"name":"Kits 360","description":"Boutique studio (bachelor apartment). Unfurnished, so you can imaginatively place your own, clean furniture.  Modern conveniences, lovely lookout: beautiful view, ocean and mountain views towards English Bay and beyond, sunsets, plant covered roof. Next to 5th Avenue Cinema. Bright, comfortable, private. ","objectiveValues":[["_61",474],["_15",1650],["_62","Excellent"],["_63","Apartment"],["_14","Kitsilano"]],"id":"_495"},
	{"name":"Walter Gage","description":"Walter Gage is known for its positive energy and superb location. Three high-rise towers are conveniently located near the The Nest, bus loop, and many campus recreational facilities. A number of low-rise apartments behind the main towers are ideal for mature students and couples.","objectiveValues":[["_14","UBC"],["_63","University Residence"],["_15",900],["_61",300],["_62","Intermediate"]],"id":"_496"},
	{"name":"Thunderbird","description":"Thunderbird offers private-entrance condominium living for independent singles and couples. Thunderbird’s five blocks are connected by winding cobbled walkways and manicured greenery. There is always an air of sociability among mature residents.","objectiveValues":[["_63","University Residence"],["_14","UBC"],["_15",800],["_62","Poor"],["_61",300]],"id":"_497"},
	{"name":"Marine Drive","description":"Marine Drive is a mix of high-rise and low-rise buildings, surrounding beautiful green space and a modern Commonsblock. Suites are designed for students seeking space, privacy, and a relaxed communal atmosphere. Through floor-to-ceiling windows, the views of the ocean and campus can be spectacular.","objectiveValues":[["_14","UBC"],["_62","Excellent"],["_63","University Residence"],["_15",1080],["_61",400]],"id":"_498"},
	{"name":"Fairview","description":"Fairview Crescent offers townhouse-style suites in a vibrant, friendly community. All suites have private entrances, multilevel layouts and comfortable furnishings. Residents can play pool at the local café, take a walk through neighbourhood green spaces and cobbled streets, and easily access UBC’s two main shopping areas.","objectiveValues":[["_15",920],["_61",450],["_62","Intermediate"],["_63","University Residence"],["_14","UBC"]],"id":"_499"}
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

const problems: any = { "Demo_Hotel": hotelAlternatives, "Cell_Phone_Selection": cellPhoneAlternatives, "Residence_Selection": residenceAlternatives, "Date_Night": dateNightAlternatives };


const fs = require('fs');

// Import Libraries and Express Middleware:
import * as express from 'express';
import * as path from 'path';
import * as MongoDB from 'mongodb';
import * as Monk from 'monk';
import * as _ from 'lodash';

export var alternativesRoutes: express.Router = express.Router();

alternativesRoutes.post('/:chart/:username', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var username = req.params.username;
	var chartname = req.params.chart;



	var nextAlternatives: any[] = [];
	var selectedAlternatives = req.body.alternatives;
	var unselectedAlternatives = _.differenceBy(problems[chartname], selectedAlternatives, 'name')

	nextAlternatives.push(unselectedAlternatives[_.random(0, (unselectedAlternatives.length - 1))])

	if (selectedAlternatives.length == 0) {
		unselectedAlternatives = _.differenceBy(problems[chartname], nextAlternatives, 'name')
		nextAlternatives.push(unselectedAlternatives[_.random(0, (unselectedAlternatives.length - 1))])
	}

	fs.appendFile('data/' + chartname + '_' + username + '.txt', "Preferences: " + JSON.stringify(req.body.user) + "\n Alternative: " + JSON.stringify(nextAlternatives) + "\n", (err: any) => {
	 	if (err) throw err;
		console.log('The data was appended to file!');
	});

	res.status(200)
		.json({ data: nextAlternatives });

});

alternativesRoutes.get('/:chart/all', function(req: express.Request, res: express.Response, next: express.NextFunction) {
	var chartname = req.params.chart;

	var alternatives = problems[chartname];
	
	res.status(200)
		.json({ data: alternatives });
});
