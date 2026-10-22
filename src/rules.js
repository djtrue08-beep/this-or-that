export const RULES = Object.freeze({
  maxPlayers: 60,
  codeLength: 4,
  roundPoints: [100, 200, 300],
  voteSeconds: 12,
  revealSeconds: 8,
  wildCardPoints: 500,
  wildCardsByRound: [0, 1, 2],
  finalPoints: 750,
  finalVoteSeconds: 15,
  majorityStreakThreshold: 3,
  leaderboardSize: 5
});
export function awardPoints(choice, votes, base) {
  if (choice !== "a" && choice !== "b") return 0;
  const a=votes.filter(v=>v.choice==="a").length;
  const b=votes.filter(v=>v.choice==="b").length;
  if (a===b) return base/4;
  return choice===(a>b?"a":"b") ? base : base/2;
}
export function ranks(players) {
  const ordered=[...players].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
  let prior=null, rank=0;
  return ordered.map((player,index)=>{
    if (player.score!==prior) rank=index+1;
    prior=player.score;
    return {...player,rank};
  });
}
export function medal(rank) {
  return ({1:"🥇",2:"🥈",3:"🥉"})[rank]||"";
}
export function makeCode() {
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:RULES.codeLength},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join("");
}
