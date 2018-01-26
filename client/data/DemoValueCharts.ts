/*
* @Author: aaronpmishkin
* @Date:   2016-07-07 15:55:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-09 19:26:04
*/

export var singleHotel: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts name="Hotel" creator="Aaron Mishkin" version="2.0" type="individual" password="password">
    <Description>Description Information Goes Here
	                    </Description>
    <ChartStructure>
        <Objectives>
            <Objective name="Hotel" type="abstract">
                <Description>Description Information Goes Here
	                    </Description>
                <Objective name="location" type="abstract">
                    <Description>Description Information Goes Here
	                    </Description>
                    <Objective name="area" type="primitive" color="#C0392B">
                        <Description>Description Information Goes Here
	                    </Description>
                        <Domain type="categorical" ordered="false">
                            <Category>airport</Category>
                            <Category>beach</Category>
                            <Category>nightlife</Category>
                        </Domain>
                    </Objective>
                    <Objective name="skytrain-distance" type="primitive" color="#7D3C98">
                        <Description>Description Information Goes Here
	                    </Description>
                        <Domain type="continuous" unit="blocks" min="1" max="9"/>
                    </Objective>
                </Objective>
                <Objective name="room" type="abstract">
                    <Description>Description Information Goes Here
	                    </Description>
                    <Objective name="size" type="primitive" color="#2980B9">
                        <Description>Description Information Goes Here
	                    </Description>
                        <Domain type="continuous" unit="sq-ft" min="200" max="350"/>
                    </Objective>
                    <Objective name="internet-access" type="primitive" color="#27AE60">
                        <Description>Description Information Goes Here
	                    </Description>
                        <Domain type="categorical" ordered="false">
                            <Category>none</Category>
                            <Category>highspeed</Category>
                            <Category>lowspeed</Category>
                        </Domain>
                    </Objective>
                </Objective>
                <Objective name="rate" type="primitive" color="#F1C40F">
                    <Description>Description Information Goes Here
	                </Description>
                    <Domain type="continuous" unit="CAD" min="100" max="200"/>
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
                    <Score value="0" domain-element="nightlife"/>
                    <Score value="0.5" domain-element="beach"/>
                    <Score value="1" domain-element="airport"/>
                </ScoreFunction>
                <ScoreFunction objective="skytrain-distance" type="continuous">
                    <Score value="1" domain-element="1"/>
                    <Score value="0.5" domain-element="3"/>
                    <Score value="0.2" domain-element="5"/>
                    <Score value="0.1" domain-element="7"/>
                    <Score value="0" domain-element="9"/>
                </ScoreFunction>
                <ScoreFunction objective="size" type="continuous">
                    <Score value="1" domain-element="200"/>
                    <Score value="0.8" domain-element="237.5"/>
                    <Score value="0.6" domain-element="275"/>
                    <Score value="0.4" domain-element="312.5"/>
                    <Score value="0" domain-element="350"/>
                </ScoreFunction>
                <ScoreFunction objective="internet-access" type="discrete">
                    <Score value="0" domain-element="none"/>
                    <Score value="1" domain-element="highspeed"/>
                    <Score value="0.5" domain-element="lowspeed"/>
                </ScoreFunction>
                <ScoreFunction objective="rate" type="continuous">
                    <Score value="1" domain-element="100"/>
                    <Score value="0.75" domain-element="125"/>
                    <Score value="0.5" domain-element="150"/>
                    <Score value="0.25" domain-element="175"/>
                    <Score value="0" domain-element="200"/>
                </ScoreFunction>
            </ScoreFunctions>
        </User>
    </Users>
</ValueCharts>`;




export var groupHotel: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts creator="Aaron" name="Hotel" password="password" type="group" version="2.0">
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
		<User name="Aaron" color="#F3C300">
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
		<User name="Samuel" color="#875692">
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
<ValueCharts name="OCRunoffMng" creator="amishkin" version="2.0" type="individual">
	<ChartStructure>
		<Objectives>
			<Objective name="OCRunoffMng" type="abstract">
				<Objective name="Operation" type="abstract">
					<Objective name="Potential_Domino_Effects" type="primitive" color="rgb(0, 115, 0)">
						<Domain type="continuous" unit="undefined" min="4" max="20"/>
						<Description>undefined</Description>
					</Objective>
					<Objective name="Disruption_to_stakeholders" type="primitive" color="rgb(0, 102, 0)">
						<Domain type="categorical" ordered="false"/>
						<Description>undefined</Description>
					</Objective>
					<Objective name="Risk" type="primitive" color="rgb(0, 51, 0)">
						<Domain type="continuous" unit="undefined" min="2" max="12"/>
						<Description>undefined</Description>
					</Objective>
				</Objective>
				<Objective name="Sustainability" type="abstract">
					<Objective name="Innovation_Support" type="primitive" color="rgb(0, 0, 128)">
						<Domain type="categorical" ordered="false"/>
						<Description>undefined</Description>
					</Objective>
					<Objective name="Cliff_Erosion" type="primitive" color="rgb(0, 0, 115)">
						<Domain type="categorical" ordered="false"/>
						<Description>undefined</Description>
					</Objective>
					<Objective name="Reuse_Capacity" type="primitive" color="rgb(0, 0, 89)">
						<Domain type="continuous" unit="undefined" min="0" max="100"/>
						<Description>undefined</Description>
					</Objective>
				</Objective>
			</Objective>
		</Objectives>
		<Alternatives>
			<Alternative name="Site Unchanged">
				<AlternativeValue objective="Risk" value="3"/>
				<AlternativeValue objective="Disruption_to_stakeholders" value="None"/>
				<AlternativeValue objective="Cliff_Erosion" value="None"/>
				<AlternativeValue objective="Innovation_Support" value="No"/>
				<AlternativeValue objective="Potential_Domino_Effects" value="4"/>
				<AlternativeValue objective="Reuse_Capacity" value="0"/>
				<Description/>
			</Alternative>
			<Alternative name="Vantage College. Conventional Runoff Management">
				<AlternativeValue objective="Risk" value="2"/>
				<AlternativeValue objective="Disruption_to_stakeholders" value="Somewhat"/>
				<AlternativeValue objective="Cliff_Erosion" value="Medium"/>
				<AlternativeValue objective="Innovation_Support" value="No"/>
				<AlternativeValue objective="Potential_Domino_Effects" value="7"/>
				<AlternativeValue objective="Reuse_Capacity" value="0"/>
				<Description/>
			</Alternative>
			<Alternative name="Vantage College. Best practice Onsite Runoff">
				<AlternativeValue objective="Risk" value="6"/>
				<AlternativeValue objective="Disruption_to_stakeholders" value="Somewhat"/>
				<AlternativeValue objective="Cliff_Erosion" value="Large"/>
				<AlternativeValue objective="Innovation_Support" value="Medium"/>
				<AlternativeValue objective="Potential_Domino_Effects" value="12"/>
				<AlternativeValue objective="Reuse_Capacity" value="50"/>
				<Description/>
			</Alternative>
			<Alternative name="Direct Runoff to Sustainability Street">
				<AlternativeValue objective="Risk" value="12"/>
				<AlternativeValue objective="Disruption_to_stakeholders" value="Very"/>
				<AlternativeValue objective="Cliff_Erosion" value="Medium"/>
				<AlternativeValue objective="Innovation_Support" value="High"/>
				<AlternativeValue objective="Potential_Domino_Effects" value="20"/>
				<AlternativeValue objective="Reuse_Capacity" value="100"/>
				<Description/>
			</Alternative>
		</Alternatives>
	</ChartStructure>
	<Users>
		<User name="temp" color="#F3C300">
			<Weights>
				<Weight objective="Potential_Domino_Effects" value="0.15"/>
				<Weight objective="Disruption_to_stakeholders" value="0.15"/>
				<Weight objective="Risk" value="0.2"/>
				<Weight objective="Innovation_Support" value="0.15"/>
				<Weight objective="Cliff_Erosion" value="0.15"/>
				<Weight objective="Reuse_Capacity" value="0.2"/>
			</Weights>
			<ScoreFunctions>
				<ScoreFunction objective="Potential_Domino_Effects" type="continuous">
					<Score value="1" domain-element="4"/>
					<Score value="0.66" domain-element="10"/>
					<Score value="0.33" domain-element="15"/>
					<Score value="0" domain-element="20"/>
				</ScoreFunction>
				<ScoreFunction objective="Disruption_to_stakeholders" type="discrete">
					<Score value="1" domain-element="None"/>
					<Score value="0.5" domain-element="Somewhat"/>
					<Score value="0" domain-element="Very"/>
				</ScoreFunction>
				<ScoreFunction objective="Risk" type="continuous">
					<Score value="1" domain-element="2"/>
					<Score value="0.6" domain-element="4"/>
					<Score value="0.4" domain-element="6"/>
					<Score value="0.3" domain-element="8"/>
					<Score value="0.2" domain-element="10"/>
					<Score value="0" domain-element="12"/>
				</ScoreFunction>
				<ScoreFunction objective="Innovation_Support" type="discrete">
					<Score value="0" domain-element="No"/>
					<Score value="0.5" domain-element="Medium"/>
					<Score value="1" domain-element="High"/>
				</ScoreFunction>
				<ScoreFunction objective="Cliff_Erosion" type="discrete">
					<Score value="1" domain-element="None"/>
					<Score value="0.2" domain-element="Medium"/>
					<Score value="0" domain-element="Large"/>
				</ScoreFunction>
				<ScoreFunction objective="Reuse_Capacity" type="continuous">
					<Score value="0.1" domain-element="0"/>
					<Score value="0" domain-element="20"/>
					<Score value="1" domain-element="80"/>
					<Score value="1" domain-element="100"/>
				</ScoreFunction>
			</ScoreFunctions>
		</User>
	</Users>
</ValueCharts>`;

