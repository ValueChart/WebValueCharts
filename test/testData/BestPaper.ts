/*
* @Author: aaronpmishkin
* @Date:   2017-05-29 20:49:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-29 20:57:39
*/

export var BestPaperChartData: string = 
`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ValueCharts creator="carenini" id="57e9b25f8eab4348a11ff1a7" name="BestPaper" password="bestpaper" type="group" version="2.0">
   <Description>a simple model to select the best paper out of five nominees</Description>
   <ChartStructure>
      <Objectives>
         <Objective name="BestPaper" type="abstract">
            <Description/>
            <Objective color="green" name="Originality" type="primitive">
               <Description>How original is the approach? Does this paper break new ground in topic, methodology, or content? How exciting and innovative is the research it describes?</Description>
               <Domain ordered="true" type="categorical">
                  <Category>DoneBefore</Category>
                  <Category>ObviousExtension</Category>
                  <Category>Respectable</Category>
                  <Category>CreativeIntriguing</Category>
                  <Category>ExtremelyNovelResearch</Category>
               </Domain>
               <DefaultScoreFunction type="discrete">
                  <Score domain-element="DoneBefore" value="0.5"/>
                  <Score domain-element="ObviousExtension" value="0.5"/>
                  <Score domain-element="Respectable" value="0.5"/>
                  <Score domain-element="CreativeIntriguing" value="0.5"/>
                  <Score domain-element="ExtremelyNovelResearch" value="0.5"/>
               </DefaultScoreFunction>
            </Objective>
            <Objective color="red" name="Clarity" type="primitive">
               <Description>For a reasonably well-prepared reader, is it clear what was done and why? Is the paper well-written and well-structured?</Description>
               <Domain ordered="true" type="categorical">
                  <Category>confusing</Category>
                  <Category>NotVeryUnderstandable</Category>
                  <Category>MostlyUnderstandable</Category>
                  <Category>Understandable</Category>
                  <Category>VeryClear</Category>
               </Domain>
               <DefaultScoreFunction type="discrete">
                  <Score domain-element="confusing" value="0.5"/>
                  <Score domain-element="NotVeryUnderstandable" value="0.5"/>
                  <Score domain-element="MostlyUnderstandable" value="0.5"/>
                  <Score domain-element="Understandable" value="0.5"/>
                  <Score domain-element="VeryClear" value="0.5"/>
               </DefaultScoreFunction>
            </Objective>
            <Objective color="blue" name="Impact of Ideas or Results " type="primitive">
               <Description>How significant is the work described? If the ideas are novel, will they also be useful or inspirational? Does the paper bring new insights into the nature of the problem?</Description>
               <Domain ordered="true" type="categorical">
                  <Category>NoImpact</Category>
                  <Category>MarginallyInteresting</Category>
                  <Category>INterestingNotTooInfluential</Category>
                  <Category>IdeasWillHelpOthers</Category>
                  <Category>WillAffectOthersResearch</Category>
               </Domain>
               <DefaultScoreFunction type="discrete">
                  <Score domain-element="NoImpact" value="0.5"/>
                  <Score domain-element="MarginallyInteresting" value="0.5"/>
                  <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
                  <Score domain-element="IdeasWillHelpOthers" value="0.5"/>
                  <Score domain-element="WillAffectOthersResearch" value="0.5"/>
               </DefaultScoreFunction>
            </Objective>
         </Objective>
      </Objectives>
      <Alternatives>
         <Alternative name="Summarizing news">
            <AlternativeValue objective="Originality" value="CreativeIntriguing"/>
            <AlternativeValue objective="Clarity" value="MostlyUnderstandable"/>
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers"/>
            <Description>Summarizing news</Description>
         </Alternative>
         <Alternative name="Summarizing opinions">
            <AlternativeValue objective="Originality" value="Respectable"/>
            <AlternativeValue objective="Clarity" value="Understandable"/>
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers"/>
            <Description>Summarizing opinions</Description>
         </Alternative>
         <Alternative name="Summarizing conversations">
            <AlternativeValue objective="Originality" value="Respectable"/>
            <AlternativeValue objective="Clarity" value="MostlyUnderstandable"/>
            <AlternativeValue objective="Impact of Ideas or Results " value="WillAffectOthersResearch"/>
            <Description>Summarizing conversations</Description>
         </Alternative>
         <Alternative name="Summarizing lectures">
            <AlternativeValue objective="Clarity" value="NotVeryUnderstandable"/>
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers"/>
            <AlternativeValue objective="Originality" value="ExtremelyNovelResearch"/>
            <Description>Summarizing lectures</Description>
         </Alternative>
      </Alternatives>
   </ChartStructure>
   <Users>
      <User color="#F3C300" name="carenini">
         <Weights>
            <Weight objective="Originality" value="0.3464715915992036"/>
            <Weight objective="Impact of Ideas or Results " value="0.3"/>
            <Weight objective="Clarity" value="0.35352840840079647"/>
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score domain-element="DoneBefore" value="0"/>
               <Score domain-element="ObviousExtension" value="0.17008356165002894"/>
               <Score domain-element="Respectable" value="0.4995729234483507"/>
               <Score domain-element="CreativeIntriguing" value="0.8766550699869792"/>
               <Score domain-element="ExtremelyNovelResearch" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score domain-element="confusing" value="0"/>
               <Score domain-element="NotVeryUnderstandable" value="0.25"/>
               <Score domain-element="MostlyUnderstandable" value="0.5"/>
               <Score domain-element="Understandable" value="0.75"/>
               <Score domain-element="VeryClear" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score domain-element="NoImpact" value="0"/>
               <Score domain-element="MarginallyInteresting" value="0.25"/>
               <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
               <Score domain-element="IdeasWillHelpOthers" value="0.75"/>
               <Score domain-element="WillAffectOthersResearch" value="1"/>
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User color="#7915dd" name="Emily!">
         <Weights>
            <Weight objective="Impact of Ideas or Results " value="0.4644425145944904"/>
            <Weight objective="Clarity" value="0.3086553770444348"/>
            <Weight objective="Originality" value="0.22690210836107494"/>
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score domain-element="DoneBefore" value="1"/>
               <Score domain-element="ObviousExtension" value="0.75"/>
               <Score domain-element="Respectable" value="0.5"/>
               <Score domain-element="CreativeIntriguing" value="0.25"/>
               <Score domain-element="ExtremelyNovelResearch" value="0"/>
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score domain-element="confusing" value="0"/>
               <Score domain-element="NotVeryUnderstandable" value="0.25"/>
               <Score domain-element="MostlyUnderstandable" value="0.5"/>
               <Score domain-element="Understandable" value="0.75"/>
               <Score domain-element="VeryClear" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score domain-element="NoImpact" value="0"/>
               <Score domain-element="MarginallyInteresting" value="0.25"/>
               <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
               <Score domain-element="IdeasWillHelpOthers" value="0.75"/>
               <Score domain-element="WillAffectOthersResearch" value="1"/>
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User color="#F38400" name="amishkin">
         <Weights>
            <Weight objective="Clarity" value="0.09147422322910649"/>
            <Weight objective="Impact of Ideas or Results " value="0.2777777777777777"/>
            <Weight objective="Originality" value="0.6307479989931158"/>
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score domain-element="DoneBefore" value="0"/>
               <Score domain-element="ObviousExtension" value="0.25"/>
               <Score domain-element="Respectable" value="0.5"/>
               <Score domain-element="CreativeIntriguing" value="0.75"/>
               <Score domain-element="ExtremelyNovelResearch" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score domain-element="confusing" value="0"/>
               <Score domain-element="NotVeryUnderstandable" value="0.25"/>
               <Score domain-element="MostlyUnderstandable" value="0.5"/>
               <Score domain-element="Understandable" value="0.75"/>
               <Score domain-element="VeryClear" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score domain-element="NoImpact" value="0"/>
               <Score domain-element="MarginallyInteresting" value="0.25"/>
               <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
               <Score domain-element="IdeasWillHelpOthers" value="0.75"/>
               <Score domain-element="WillAffectOthersResearch" value="1"/>
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User color="#A1CAF1" name="tempUser">
         <Weights>
            <Weight objective="Originality" value="0.611111111111111"/>
            <Weight objective="Impact of Ideas or Results " value="0.27777777777777773"/>
            <Weight objective="Clarity" value="0.1111111111111111"/>
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score domain-element="DoneBefore" value="1"/>
               <Score domain-element="ObviousExtension" value="0.75"/>
               <Score domain-element="Respectable" value="0.5"/>
               <Score domain-element="CreativeIntriguing" value="0.25"/>
               <Score domain-element="ExtremelyNovelResearch" value="0"/>
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score domain-element="confusing" value="0"/>
               <Score domain-element="NotVeryUnderstandable" value="0.25"/>
               <Score domain-element="MostlyUnderstandable" value="0.5"/>
               <Score domain-element="Understandable" value="0.75"/>
               <Score domain-element="VeryClear" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score domain-element="NoImpact" value="0"/>
               <Score domain-element="MarginallyInteresting" value="0.25"/>
               <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
               <Score domain-element="IdeasWillHelpOthers" value="0.75"/>
               <Score domain-element="WillAffectOthersResearch" value="1"/>
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User color="#BE0032" name="temp">
         <Weights>
            <Weight objective="Originality" value="0.611111111111111"/>
            <Weight objective="Impact of Ideas or Results " value="0.27777777777777773"/>
            <Weight objective="Clarity" value="0.1111111111111111"/>
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score domain-element="DoneBefore" value="0"/>
               <Score domain-element="ObviousExtension" value="0.25"/>
               <Score domain-element="Respectable" value="0.5"/>
               <Score domain-element="CreativeIntriguing" value="0.75"/>
               <Score domain-element="ExtremelyNovelResearch" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score domain-element="confusing" value="0"/>
               <Score domain-element="NotVeryUnderstandable" value="0.25"/>
               <Score domain-element="MostlyUnderstandable" value="0.5"/>
               <Score domain-element="Understandable" value="0.75"/>
               <Score domain-element="VeryClear" value="1"/>
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score domain-element="NoImpact" value="0"/>
               <Score domain-element="MarginallyInteresting" value="0.25"/>
               <Score domain-element="INterestingNotTooInfluential" value="0.5"/>
               <Score domain-element="IdeasWillHelpOthers" value="0.75"/>
               <Score domain-element="WillAffectOthersResearch" value="1"/>
            </ScoreFunction>
         </ScoreFunctions>
      </User>
   </Users>
</ValueCharts>`;