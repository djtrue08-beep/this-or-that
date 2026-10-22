import { RULES, awardPoints, ranks } from "./rules.js";
import { shuffled } from "./questions.js";

/**
 * Pure game-show state machine. The host is the only clock authority.
 * Persist each emitted state on the server; clients render its phase.
 * This module does not itself grant room permissions or write to Supabase.
 */
export const PHASES = Object.freeze({
  INTRO: "intro",
  ROUND: "round_intro",
  VOTING: "voting",
  RESULTS: "results",
  LEADERBOARD: "leaderboard",
  INTERMISSION: "intermission",
  FINAL_INTRO: "final_intro",
  WINNERS: "winners"
});

const INTRO_MS = 10000;
const ROUND_INTRO_MS = 7000;
const LEADERBOARD_MS = 9000;
const FINAL_INTRO_MS = 9000;
const WINNERS_MS = 0;

export function buildSchedule(bank, mode, regularPerRound = 5) {
  const pool = shuffled(bank.filter(q => q.mode === mode));
  const needed = regularPerRound * 3 + 4;
  if (pool.length < needed) {
    throw new Error("Not enough unique questions for this mode. Need " + needed);
  }
  let cursor = 0;
  const rounds = [];
  for (let round = 0; round < 3; round++) {
    const regular = pool.slice(cursor, cursor + regularPerRound).map(question => ({
      question,
      type: "regular",
      basePoints: RULES.roundPoints[round],
      round
    }));
    cursor += regularPerRound;
    const wildCount = RULES.wildCardsByRound[round];
    const wild = pool.slice(cursor, cursor + wildCount).map(question => ({
      question,
      type: "wild",
      basePoints: RULES.wildCardPoints,
      round
    }));
    cursor += wildCount;
    // Insert surprise questions at distinct, non-adjacent positions.
    const positions = wildCount === 1
      ? [1 + Math.floor(Math.random() * Math.max(1, regular.length - 1))]
      : [1, Math.max(3, regular.length)];
    for (let i = wild.length - 1; i >= 0; i--) {
      regular.splice(positions[i], 0, wild[i]);
    }
    rounds.push(regular);
  }
  return {
    rounds,
    final: {
      question: pool[cursor],
      type: "final",
      basePoints: RULES.finalPoints,
      round: 3
    }
  };
}

export function createGame(schedule, players, now = Date.now()) {
  return {
    phase: PHASES.INTRO,
    deadline: now + INTRO_MS,
    schedule,
    round: 0,
    questionIndex: 0,
    votes: {},
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      score: 0,
      streak: 0,
      majorityCount: 0,
      minorityCount: 0,
      wildPoints: 0
    })),
    lastResults: null
  };
}

export function activeQuestion(game) {
  if (game.round === 3) return game.schedule.final;
  return game.schedule.rounds[game.round]?.[game.questionIndex] || null;
}

export function castVote(game, playerId, choice, now = Date.now()) {
  if (game.phase !== PHASES.VOTING || now >= game.deadline) return game;
  if (!["a", "b"].includes(choice) || !(game.players.some(p => p.id === playerId))) return game;
  if (Object.hasOwn(game.votes, playerId)) return game;
  return { ...game, votes: { ...game.votes, [playerId]: choice } };
}

function reveal(game, now) {
  const question = activeQuestion(game);
  const votes = Object.entries(game.votes).map(([playerId, choice]) => ({ playerId, choice }));
  const countA = votes.filter(v => v.choice === "a").length;
  const countB = votes.filter(v => v.choice === "b").length;
  const majority = countA === countB ? null : countA > countB ? "a" : "b";
  const players = game.players.map(player => {
    const choice = game.votes[player.id];
    const points = awardPoints(choice, votes, question.basePoints);
    const isMajority = !!majority && choice === majority;
    const isMinority = !!majority && !!choice && choice !== majority;
    return {
      ...player,
      score: player.score + points,
      streak: isMajority ? player.streak + 1 : 0,
      majorityCount: player.majorityCount + Number(isMajority),
      minorityCount: player.minorityCount + Number(isMinority),
      wildPoints: player.wildPoints + (question.type === "wild" ? points : 0)
    };
  });
  return {
    ...game,
    players,
    phase: PHASES.RESULTS,
    deadline: now + RULES.revealSeconds * 1000,
    lastResults: {
      questionId: question.question.id,
      a: countA,
      b: countB,
      percentageA: votes.length ? Math.round(countA * 100 / votes.length) : 0,
      percentageB: votes.length ? Math.round(countB * 100 / votes.length) : 0,
      majority,
      points: question.basePoints
    }
  };
}

export function awards(players) {
  const award = field => {
    const best = Math.max(0, ...players.map(p => p[field]));
    return best === 0 ? [] : players.filter(p => p[field] === best).map(p => p.name);
  };
  return {
    crowdFavorite: award("majorityCount"),
    rebel: award("minorityCount"),
    wildCard: award("wildPoints")
  };
}

export function champions(game) {
  const sorted = ranks(game.players);
  return { leaderboard: sorted, winners: sorted.filter(p => p.rank === 1), awards: awards(game.players) };
}

export function advance(game, now = Date.now()) {
  if (game.phase === PHASES.WINNERS || now < game.deadline) return game;
  switch (game.phase) {
    case PHASES.INTRO:
      return { ...game, phase: PHASES.ROUND, deadline: now + ROUND_INTRO_MS };
    case PHASES.ROUND:
    case PHASES.FINAL_INTRO:
      return { ...game, phase: PHASES.VOTING, votes: {}, deadline: now + (game.round === 3 ? RULES.finalVoteSeconds : RULES.voteSeconds) * 1000 };
    case PHASES.VOTING:
      return reveal(game, now);
    case PHASES.RESULTS: {
      const nextIndex = game.questionIndex + 1;
      const endOfRound = game.round === 3 || nextIndex >= game.schedule.rounds[game.round].length;
      if (!endOfRound) {
        return { ...game, questionIndex: nextIndex, votes: {}, phase: PHASES.VOTING, deadline: now + RULES.voteSeconds * 1000 };
      }
      return { ...game, phase: PHASES.LEADERBOARD, deadline: now + LEADERBOARD_MS };
    }
    case PHASES.LEADERBOARD:
      if (game.round === 3) return { ...game, phase: PHASES.WINNERS, deadline: now + WINNERS_MS };
      if (game.round === 2) return { ...game, round: 3, questionIndex: 0, phase: PHASES.FINAL_INTRO, deadline: now + FINAL_INTRO_MS };
      return { ...game, round: game.round + 1, questionIndex: 0, phase: PHASES.ROUND, deadline: now + ROUND_INTRO_MS };
    default:
      return game;
  }
}

export function tick(game, now = Date.now()) {
  let current = game;
  // Repeated ticks catch up if a host tab was suspended. One phase per tick
  // keeps every transition visible to clients after reconnection.
  if (current.deadline <= now) current = advance(current, now);
  return current;
}

export function timeRemaining(game, now = Date.now()) {
  return Math.max(0, Math.ceil((game.deadline - now) / 1000));
}
