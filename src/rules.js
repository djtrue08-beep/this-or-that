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
  if (!["a", "b", "c"].includes(choice)) return 0;
  const counts = { a: 0, b: 0, c: 0 };
  for (const vote of votes) {
    if (Object.hasOwn(counts, vote.choice)) counts[vote.choice]++;
  }
  const usedChoices = new Set(votes.map(v => v.choice));
  const options = usedChoices.has("c") || choice === "c" ? ["a", "b", "c"] : ["a", "b"];
  const highest = Math.max(...options.map(option => counts[option]));
  if (highest === 0) return 0;
  const leaders = options.filter(option => counts[option] === highest);
  // For any tied first-place vote, all participating voters get one quarter.
  if (leaders.length > 1) return base / 4;
  return choice === leaders[0] ? base : base / 2;
}

export function ranks(players) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let previous = null;
  let rank = 0;
  return ordered.map((player, index) => {
    if (player.score !== previous) rank = index + 1;
    previous = player.score;
    return { ...player, rank };
  });
}

export function medal(rank) {
  return ({ 1: "🥇", 2: "🥈", 3: "🥉" })[rank] || "";
}

export function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(RULES.codeLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, number => alphabet[number % alphabet.length]).join("");
}
