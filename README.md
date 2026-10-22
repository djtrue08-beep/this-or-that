# This or That

A multiplayer party voting game hosted by Crixus the Centaur.

## Development status

**Initial UI and data model scaffold only. Not playable end-to-end yet.** The game currently has sample questions and unfinished gameplay progression. Supabase requires a secure server-side API and RLS policies before clients can create rooms or vote.

## Planned rules

- Family mode: 300 questions; Adult mode: 200 questions. The included sample set is not the complete bank.
- 3 rounds at 100, 200, and 300 base points.
- Majority: full points; minority: half; tied vote: quarter; no vote: zero.
- Voting: 12 seconds; reveal: 8 seconds.
- 3 surprise Wild Cards (one in round 2, two in round 3), each worth 500 base points.
- Final Showdown after round 3: 750 base points, 15-second vote, 8-second reveal.
- Top-five round leaderboard, shared ranks, all tied champions displayed.
- Crowd Favorite, Rebel, Wild Card awards; three-vote majority streak flame.
- Up to 60 players using four-character room codes and QR join.
- Crixus host commentary and show-style transitions.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set credentials in `.env.local` only after a secure backend and RLS policies exist. Do not deploy the sample schema with public write access.
