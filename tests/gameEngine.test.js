import test from "node:test";
import assert from "node:assert/strict";
import { awardPoints, ranks } from "../src/rules.js";
import { buildSchedule, createGame, advance, castVote, PHASES, champions } from "../src/gameEngine.js";

test("regular question majority, minority and tied votes", () => {
  assert.equal(awardPoints("a", [{choice:"a"},{choice:"a"},{choice:"b"}],100),100);
  assert.equal(awardPoints("b", [{choice:"a"},{choice:"a"},{choice:"b"}],100),50);
  assert.equal(awardPoints("a", [{choice:"a"},{choice:"b"}],100),25);
  assert.equal(awardPoints(null, [{choice:"a"}],100),0);
});
test("wild cards support three options", () => {
  const votes=[{choice:"a"},{choice:"a"},{choice:"b"},{choice:"c"}];
  assert.equal(awardPoints("a",votes,500),500);
  assert.equal(awardPoints("b",votes,500),250);
  assert.equal(awardPoints("c",votes,500),250);
  assert.equal(awardPoints("a",[{choice:"a"},{choice:"b"},{choice:"c"}],500),125);
  assert.equal(awardPoints("c",[{choice:"a"},{choice:"b"},{choice:"c"}],500),125);
});
test("ties share ranks", () => {
  assert.deepEqual(ranks([{name:"C",score:100},{name:"B",score:200},{name:"A",score:200}]).map(p=>p.rank),[1,1,3]);
});
test("three rounds include exactly three wild cards and a separate final", () => {
  const bank=Array.from({length:25},(_,i)=>({id:String(i),mode:"family",a:"A",b:"B",c:"C"}));
  const schedule=buildSchedule(bank,"family",5);
  assert.deepEqual(schedule.rounds.map(round=>round.filter(q=>q.type==="wild").length),[0,1,2]);
  assert.equal(schedule.final.basePoints,750);
  for (const round of schedule.rounds) {
    const wildPositions=round.flatMap((q,i)=>q.type==="wild"?[i]:[]);
    for(let i=1;i<wildPositions.length;i++) assert.ok(wildPositions[i]-wildPositions[i-1]>1);
  }
});
test("automatic phases and voting lock", () => {
  const bank=Array.from({length:25},(_,i)=>({id:String(i),mode:"family",a:"A",b:"B",c:"C"}));
  const game=createGame(buildSchedule(bank,"family",5),[{id:"one",name:"One"},{id:"two",name:"Two"}],0);
  const round=advance(game,10000);
  assert.equal(round.phase,PHASES.ROUND);
  const voting=advance(round,17000);
  assert.equal(voting.phase,PHASES.VOTING);
  const first=castVote(voting,"one","a",17001);
  assert.equal(castVote(first,"one","b",17002).votes.one,"a");
  const second=castVote(first,"two","b",17003);
  const results=advance(second,29000);
  assert.equal(results.phase,PHASES.RESULTS);
  assert.equal(results.players[0].score,25);
  assert.equal(results.players[1].score,25);
});
test("champions include shared winners", () => {
  const result=champions({players:[{id:"1",name:"One",score:100,majorityCount:1,minorityCount:0,wildPoints:0},{id:"2",name:"Two",score:100,majorityCount:0,minorityCount:1,wildPoints:50}]});
  assert.equal(result.winners.length,2);
});
