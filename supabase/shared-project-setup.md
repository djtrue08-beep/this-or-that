# This or That database isolation

This game uses the existing Supabase project hosting Quick Draw and WHO DAT?! due to the two-free-project limit.

Supabase project ID: `eymwxwiddhyikelvxbnx`.

Only these tables belong to This or That:
- `public.tot_rooms`
- `public.tot_players`
- `public.tot_votes`

Each has row-level security enabled and game-specific policies. Existing `game_*`, `players`, `questions`, and `wd_*` tables must not be modified.

## Important deployment notes
- Use only a public Supabase publishable key in the browser.
- Configure anonymous sign-in for players before using the authenticated RLS policies.
- The current application is not yet connected to these tables; no production readiness is claimed.
- Review authorization before launch: restrict room visibility to members, votes to active questions, and prevent direct score tampering. Host actions should use authenticated, server-validated transitions.
- Keep the frontend, static assets, Vercel project, and repository independent.
