/*
* @Author: aaronpmishkin
* @Date:   2017-05-18 12:59:38
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-07-09 22:22:20
*/

export var HotelChartData: string = 
`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts name="Hotel" creator="Aaron Mishkin" version="2.0" type="individual" password="password">
    <Description>Description Information Goes Here</Description>
    <ChartStructure>
        <Objectives>
            <Objective name="Hotel" type="abstract">
                <Description>Description Information Goes Here</Description>
                <Objective name="location" type="abstract">
                    <Description>Description Information Goes Here</Description>
                    <Objective name="area" type="primitive" color="#C0392B">
                        <Description>Description Information Goes Here</Description>
                        <Domain type="categorical" ordered="false">
                            <Category>airport</Category>
                            <Category>beach</Category>
                            <Category>nightlife</Category>
                        </Domain>
                    </Objective>
                    <Objective name="skytrain-distance" type="primitive" color="#7D3C98">
                        <Description>Description Information Goes Here</Description>
                        <Domain type="continuous" unit="blocks" min="1" max="9"/>
                    </Objective>
                </Objective>
                <Objective name="room" type="abstract">
                    <Description>Description Information Goes Here</Description>
                    <Objective name="size" type="primitive" color="#2980B9">
                        <Description>Description Information Goes Here</Description>
                        <Domain type="continuous" unit="sq-ft" min="200" max="350"/>
                    </Objective>
                    <Objective name="internet-access" type="primitive" color="#27AE60">
                        <Description>Description Information Goes Here</Description>
                        <Domain type="categorical" ordered="false">
                            <Category>none</Category>
                            <Category>highspeed</Category>
                            <Category>lowspeed</Category>
                        </Domain>
                    </Objective>
                </Objective>
                <Objective name="rate" type="primitive" color="#F1C40F">
                    <Description>Description Information Goes Here</Description>
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
</ValueCharts>`
