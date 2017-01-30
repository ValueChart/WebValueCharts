/*
* @Author: aaronpmishkin
* @Date:   2016-07-07 15:55:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-07 15:59:41
*/

export var singleHotel: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts creator="Aaron Mishkin" name="Hotel" password="password" version="2.0">
	<ChartStructure>
		<Objectives>
			<Objective name="Hotel" type="abstract">
				<Objective name="location" type="abstract">
					<Objective color="#C0392B" name="area" type="primitive">
						<Domain ordered="false" type="categorical"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
					<Objective color="#7D3C98" name="skytrain-distance" type="primitive">
						<Domain max="9" min="1" type="continuous" unit="blocks"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
				</Objective>
				<Objective name="room" type="abstract">
					<Objective color="#2980B9" name="size" type="primitive">
						<Domain max="350" min="200" type="continuous" unit="sq-ft"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
					<Objective color="#27AE60" name="internet-access" type="primitive">
						<Domain ordered="false" type="categorical"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
				</Objective>
				<Objective color="#F1C40F" name="rate" type="primitive">
					<Domain max="200" min="100" type="continuous" unit="CAD"/>
					<Description>Description Information Goes Here
	                </Description>
				</Objective>
			</Objective>
		</Objectives>
		<Alternatives>
			<Alternative name="Sheraton">
				<AlternativeValue objective="area" value="nightlife"/>
				<AlternativeValue objective="internet-access" value="highspeed"/>
				<AlternativeValue objective="rate" value="150"/>
				<AlternativeValue objective="skytrain-distance" value="7"/>
				<AlternativeValue objective="size" value="350"/>
				<Description>Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="BestWestern">
				<AlternativeValue objective="area" value="nightlife"/>
				<AlternativeValue objective="internet-access" value="highspeed"/>
				<AlternativeValue objective="rate" value="100"/>
				<AlternativeValue objective="skytrain-distance" value="2"/>
				<AlternativeValue objective="size" value="200"/>
				<Description>Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="Hyatt">
				<AlternativeValue objective="area" value="beach"/>
				<AlternativeValue objective="internet-access" value="lowspeed"/>
				<AlternativeValue objective="rate" value="200"/>
				<AlternativeValue objective="skytrain-distance" value="2"/>
				<AlternativeValue objective="size" value="275"/>
				<Description>Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>
			</Alternative>
			<Alternative name="Marriott">
				<AlternativeValue objective="area" value="airport"/>
				<AlternativeValue objective="internet-access" value="lowspeed"/>
				<AlternativeValue objective="rate" value="175"/>
				<AlternativeValue objective="skytrain-distance" value="9"/>
				<AlternativeValue objective="size" value="200"/>
				<Description>The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="HolidayInn">
				<AlternativeValue objective="area" value="airport"/>
				<AlternativeValue objective="internet-access" value="none"/>
				<AlternativeValue objective="rate" value="100"/>
				<AlternativeValue objective="skytrain-distance" value="1"/>
				<AlternativeValue objective="size" value="237.5"/>
				<Description>The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="Ramada">
				<AlternativeValue objective="area" value="beach"/>
				<AlternativeValue objective="internet-access" value="none"/>
				<AlternativeValue objective="rate" value="125"/>
				<AlternativeValue objective="skytrain-distance" value="1"/>
				<AlternativeValue objective="size" value="312.5"/>
				<Description>1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>
			</Alternative>
		</Alternatives>
	</ChartStructure>
	<Users>
		<User name="Aaron Mishkin">
			<Weights>
				<Weight objective="area" value="0.2"/>
				<Weight objective="internet-access" value="0.1"/>
				<Weight objective="rate" value="0.3"/>
				<Weight objective="skytrain-distance" value="0.2"/>
				<Weight objective="size" value="0.2"/>
			</Weights>
			<ScoreFunctions>
				<ScoreFunction objective="area" type="discrete">
					<Score domain-element="nightlife" value="0.0"/>
					<Score domain-element="beach" value="0.5"/>
					<Score domain-element="airport" value="1"/>
				</ScoreFunction>
				<ScoreFunction objective="skytrain-distance" type="continuous">
					<Score domain-element="1" value="1"/>
					<Score domain-element="3" value="0.5"/>
					<Score domain-element="5" value="0.2"/>
					<Score domain-element="7" value="0.1"/>
					<Score domain-element="9" value="0"/>
				</ScoreFunction>
				<ScoreFunction objective="size" type="continuous">
					<Score domain-element="200" value="1"/>
					<Score domain-element="237.5" value="0.8"/>
					<Score domain-element="275" value="0.6"/>
					<Score domain-element="312.5" value="0.4"/>
					<Score domain-element="350" value="0.0"/>
				</ScoreFunction>
				<ScoreFunction objective="internet-access" type="discrete">
					<Score domain-element="none" value="0"/>
					<Score domain-element="highspeed" value="1"/>
					<Score domain-element="lowspeed" value="0.5"/>
				</ScoreFunction>
				<ScoreFunction objective="rate" type="continuous">
					<Score domain-element="100" value="1"/>
					<Score domain-element="125" value="0.75"/>
					<Score domain-element="150" value="0.5"/>
					<Score domain-element="175" value="0.25"/>
					<Score domain-element="200" value="0"/>
				</ScoreFunction>
			</ScoreFunctions>
		</User>
	</Users>
</ValueCharts>`;




export var groupHotel: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts creator="Aaron" name="Hotel" password="password" version="2.0">
	<ChartStructure>
		<Objectives>
			<Objective name="Hotel" type="abstract">
				<Objective name="location" type="abstract">
					<Objective color="#C0392B" name="area" type="primitive">
						<Domain ordered="false" type="categorical"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
					<Objective color="#7D3C98" name="skytrain-distance" type="primitive">
						<Domain max="9" min="1" type="continuous" unit="blocks"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
				</Objective>
				<Objective name="room" type="abstract">
					<Objective color="#2980B9" name="size" type="primitive">
						<Domain max="350" min="200" type="continuous" unit="sq-ft"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
					<Objective color="#27AE60" name="internet-access" type="primitive">
						<Domain ordered="false" type="categorical"/>
						<Description>Description Information Goes Here
	                    </Description>
					</Objective>
				</Objective>
				<Objective color="#F1C40F" name="rate" type="primitive">
					<Domain max="200" min="100" type="continuous" unit="CAD"/>
					<Description>Description Information Goes Here
	                </Description>
				</Objective>
			</Objective>
		</Objectives>
		<Alternatives>
			<Alternative name="Sheraton">
				<AlternativeValue objective="area" value="nightlife"/>
				<AlternativeValue objective="internet-access" value="highspeed"/>
				<AlternativeValue objective="rate" value="150"/>
				<AlternativeValue objective="skytrain-distance" value="7"/>
				<AlternativeValue objective="size" value="350"/>
				<Description>Get a good night's sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="BestWestern">
				<AlternativeValue objective="area" value="nightlife"/>
				<AlternativeValue objective="internet-access" value="highspeed"/>
				<AlternativeValue objective="rate" value="100"/>
				<AlternativeValue objective="skytrain-distance" value="2"/>
				<AlternativeValue objective="size" value="200"/>
				<Description>Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="Hyatt">
				<AlternativeValue objective="area" value="beach"/>
				<AlternativeValue objective="internet-access" value="lowspeed"/>
				<AlternativeValue objective="rate" value="200"/>
				<AlternativeValue objective="skytrain-distance" value="2"/>
				<AlternativeValue objective="size" value="275"/>
				<Description>Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description>
			</Alternative>
			<Alternative name="Marriott">
				<AlternativeValue objective="area" value="airport"/>
				<AlternativeValue objective="internet-access" value="lowspeed"/>
				<AlternativeValue objective="rate" value="175"/>
				<AlternativeValue objective="skytrain-distance" value="9"/>
				<AlternativeValue objective="size" value="200"/>
				<Description>The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="HolidayInn">
				<AlternativeValue objective="area" value="airport"/>
				<AlternativeValue objective="internet-access" value="none"/>
				<AlternativeValue objective="rate" value="100"/>
				<AlternativeValue objective="skytrain-distance" value="1"/>
				<AlternativeValue objective="size" value="237.5"/>
				<Description>The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description>
			</Alternative>
			<Alternative name="Ramada">
				<AlternativeValue objective="area" value="beach"/>
				<AlternativeValue objective="internet-access" value="none"/>
				<AlternativeValue objective="rate" value="125"/>
				<AlternativeValue objective="skytrain-distance" value="1"/>
				<AlternativeValue objective="size" value="312.5"/>
				<Description>1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description>
			</Alternative>
		</Alternatives>
	</ChartStructure>
	<Users>
		<User name="Aaron">
			<Weights>
				<Weight objective="area" value="0.2"/>
				<Weight objective="internet-access" value="0.1"/>
				<Weight objective="rate" value="0.3"/>
				<Weight objective="skytrain-distance" value="0.2"/>
				<Weight objective="size" value="0.2"/>
			</Weights>
			<ScoreFunctions>
				<ScoreFunction objective="area" type="discrete">
					<Score domain-element="nightlife" value="0.0"/>
					<Score domain-element="beach" value="0.5"/>
					<Score domain-element="airport" value="1"/>
				</ScoreFunction>
				<ScoreFunction objective="skytrain-distance" type="continuous">
					<Score domain-element="1" value="1"/>
					<Score domain-element="3" value="0.5"/>
					<Score domain-element="5" value="0.2"/>
					<Score domain-element="7" value="0.1"/>
					<Score domain-element="9" value="0"/>
				</ScoreFunction>
				<ScoreFunction objective="size" type="continuous">
					<Score domain-element="200" value="1"/>
					<Score domain-element="237.5" value="0.8"/>
					<Score domain-element="275" value="0.6"/>
					<Score domain-element="312.5" value="0.4"/>
					<Score domain-element="350" value="0.0"/>
				</ScoreFunction>
				<ScoreFunction objective="internet-access" type="discrete">
					<Score domain-element="none" value="0"/>
					<Score domain-element="highspeed" value="1"/>
					<Score domain-element="lowspeed" value="0.5"/>
				</ScoreFunction>
				<ScoreFunction objective="rate" type="continuous">
					<Score domain-element="100" value="1"/>
					<Score domain-element="125" value="0.75"/>
					<Score domain-element="150" value="0.5"/>
					<Score domain-element="175" value="0.25"/>
					<Score domain-element="200" value="0"/>
				</ScoreFunction>
			</ScoreFunctions>
		</User>
		<User name="Samuel">
			<Weights>
				<Weight objective="area" value="0.05"/>
				<Weight objective="internet-access" value="0.4"/>
				<Weight objective="rate" value="0.4"/>
				<Weight objective="skytrain-distance" value="0.05"/>
				<Weight objective="size" value="0.1"/>
			</Weights>
			<ScoreFunctions>
				<ScoreFunction objective="area" type="discrete">
					<Score domain-element="nightlife" value="0.0"/>
					<Score domain-element="beach" value="0.5"/>
					<Score domain-element="airport" value="1"/>
				</ScoreFunction>
				<ScoreFunction objective="skytrain-distance" type="continuous">
					<Score domain-element="1" value="1"/>
					<Score domain-element="3" value="0.8"/>
					<Score domain-element="5" value="0.6"/>
					<Score domain-element="7" value="0.4"/>
					<Score domain-element="9" value="0.0"/>
				</ScoreFunction>
				<ScoreFunction objective="size" type="continuous">
					<Score domain-element="200" value="0"/>
					<Score domain-element="237.5" value="0.4"/>
					<Score domain-element="275" value="0.6"/>
					<Score domain-element="312.5" value="0.8"/>
					<Score domain-element="350" value="1"/>
				</ScoreFunction>
				<ScoreFunction objective="internet-access" type="discrete">
					<Score domain-element="none" value="0"/>
					<Score domain-element="highspeed" value="1"/>
					<Score domain-element="lowspeed" value="0.5"/>
				</ScoreFunction>
				<ScoreFunction objective="rate" type="continuous">
					<Score domain-element="100" value="1"/>
					<Score domain-element="125" value="0.75"/>
					<Score domain-element="150" value="0.5"/>
					<Score domain-element="175" value="0.25"/>
					<Score domain-element="200" value="0"/>
				</ScoreFunction>
			</ScoreFunctions>
		</User>
	</Users>
</ValueCharts>`;



export var waterManagement: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts problem="OCRunoffMng">
	<Colors>
		<Color b="0" g="115" name="Potential_Domino_Effects" r="0"/>
		<Color b="0" g="102" name="Disruption_to_stakeholders" r="0"/>
		<Color b="0" g="51" name="Risk" r="0"/>
		<Color b="128" g="0" name="Innovation_Support" r="0"/>
		<Color b="115" g="0" name="Cliff_Erosion" r="0"/>
		<Color b="89" g="0" name="Reuse_Capacity" r="0"/>
	</Colors>
	<Criteria>
		<Criterion name="OCRunoffMng" type="abstract">
			<Criterion name="Operation" type="abstract">
				<Criterion name="Potential_Domino_Effects" type="primitive" weight="0.15">
					<Domain type="continuous" unit="Unit3">
						<ContinuousValue x="4.0" y="1.0"/>
						<ContinuousValue x="10.0" y="0.66"/>
						<ContinuousValue x="15.0" y="0.33"/>
						<ContinuousValue x="20.0" y="0.0"/>
					</Domain>
				</Criterion>
				<Criterion name="Disruption_to_stakeholders" type="primitive" weight="0.15">
					<Domain type="discrete">
						<DiscreteValue x="None" y="1.0"/>
						<DiscreteValue x="Somewhat" y="0.5"/>
						<DiscreteValue x="Very" y="0.0"/>
					</Domain>
				</Criterion>
				<Criterion name="Risk" type="primitive" weight="0.2">
					<Domain type="continuous" unit="Unit2">
						<ContinuousValue x="2.0" y="1.0"/>
						<ContinuousValue x="4.0" y="0.6"/>
						<ContinuousValue x="6.0" y="0.4"/>
						<ContinuousValue x="8.0" y="0.3"/>
						<ContinuousValue x="10.0" y="0.2"/>
						<ContinuousValue x="12.0" y="0.0"/>
					</Domain>
				</Criterion>
			</Criterion>
			<Criterion name="Sustainability" type="abstract">
				<Criterion name="Innovation_Support" type="primitive" weight="0.15">
					<Domain type="discrete">
						<DiscreteValue x="No" y="0.0"/>
						<DiscreteValue x="Medium" y="0.5"/>
						<DiscreteValue x="High" y="1.0"/>
					</Domain>
				</Criterion>
				<Criterion name="Cliff_Erosion" type="primitive" weight="0.15">
					<Domain type="discrete">
						<DiscreteValue x="None" y="1.0"/>
						<DiscreteValue x="Medium" y="0.2"/>
						<DiscreteValue x="Large" y="0.0"/>
					</Domain>
				</Criterion>
				<Criterion name="Reuse_Capacity" type="primitive" weight="0.2">
					<Domain type="continuous" unit="m3/month">
						<ContinuousValue x="0.0" y="0.1"/>
						<ContinuousValue x="20.0" y="0.0"/>
						<ContinuousValue x="80.0" y="1.0"/>
						<ContinuousValue x="100.0" y="1.0"/>
					</Domain>
				</Criterion>
			</Criterion>
		</Criterion>
	</Criteria>
	<Alternatives>
		<Alternative name="Site Unchanged">
			<AlternativeValue criterion="Risk" value="3.0"/>
			<AlternativeValue criterion="Disruption_to_stakeholders" value="None"/>
			<AlternativeValue criterion="Cliff_Erosion" value="None"/>
			<AlternativeValue criterion="Innovation_Support" value="No"/>
			<AlternativeValue criterion="Potential_Domino_Effects" value="4.0"/>
			<AlternativeValue criterion="Reuse_Capacity" value="0.0"/>
		</Alternative>
		<Alternative name="Vantage College. Conventional Runoff Management">
			<AlternativeValue criterion="Risk" value="2.0"/>
			<AlternativeValue criterion="Disruption_to_stakeholders" value="Somewhat"/>
			<AlternativeValue criterion="Cliff_Erosion" value="Medium"/>
			<AlternativeValue criterion="Innovation_Support" value="No"/>
			<AlternativeValue criterion="Potential_Domino_Effects" value="7.0"/>
			<AlternativeValue criterion="Reuse_Capacity" value="0.0"/>
		</Alternative>
		<Alternative name="Vantage College. Best practice Onsite Runoff">
			<AlternativeValue criterion="Risk" value="6.0"/>
			<AlternativeValue criterion="Disruption_to_stakeholders" value="Somewhat"/>
			<AlternativeValue criterion="Cliff_Erosion" value="Large"/>
			<AlternativeValue criterion="Innovation_Support" value="Medium"/>
			<AlternativeValue criterion="Potential_Domino_Effects" value="12.0"/>
			<AlternativeValue criterion="Reuse_Capacity" value="50.0"/>
		</Alternative>
		<Alternative name="Direct Runoff to Sustainability Street">
			<AlternativeValue criterion="Risk" value="12.0"/>
			<AlternativeValue criterion="Disruption_to_stakeholders" value="Very"/>
			<AlternativeValue criterion="Cliff_Erosion" value="Medium"/>
			<AlternativeValue criterion="Innovation_Support" value="High"/>
			<AlternativeValue criterion="Potential_Domino_Effects" value="20.0"/>
			<AlternativeValue criterion="Reuse_Capacity" value="100.0"/>
		</Alternative>
	</Alternatives>
</ValueCharts>`;

