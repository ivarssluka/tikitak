# AGENTS.md (Root Project)

## Purpose
Coordinate a multi-agent build of the Neon/Cyberpunk Tic-Tac-Toe web app with 3 modes (Local PvP, Player vs Computer with 3 difficulties, Online PvP with chat/spectators/tournament), shared OOP game core, Render hosting, and persistent stats.

## Agents
1. **Context & Scope Agent (Lead)**
   - Owns problem statement, assumptions, non-goals.
   - Keeps requirements consistent across client and server.
   - Approves any scope changes (e.g. new tournament format).
2. **Frontend/UI Agent**
   - Owns `/client` HTML/CSS/JS, layout, responsiveness, neon style.
   - Implements controllers for game modes on the client.
   - Integrates localStorage stats display.
3. **Game Logic/OOP Agent**
   - Owns shared JS OOP core (Board, Game, Player, AIEngine, win/draw).
   - Ensures logic is DOM-agnostic and testable.
   - Exports same rules to server for validation.
4. **Backend/Online Agent**
   - Owns `/server` Node.js/Express/WS.
   - Builds room manager, chat broadcast, spectators, and tournament stubs.
5. **Security & QA Agent**
   - Defines auth-lite model (guest token).
   - Defines test matrix (unit, integration, E2E).
   - Verifies spectators cannot move.
6. **DevOps/Delivery Agent**
   - Owns Render setup (static + web service).
   - Owns build pipelines and environment variables.
7. **UX & Data Agent**
   - Owns flows (mode select → game → stats).
   - Defines analytics/events and local stats schema.

## Global Workflow
1. **Plan** (Context Agent)  
   - Confirm 3 modes, AI levels, and online spectator rule.
   - Freeze public API for `/api/v1/auth/guest`, `/api/v1/rooms`.
2. **Build client** (Frontend/UI + Game Logic)  
   - Implement core OOP.
   - Implement Local PvP, then PvC, then Online.
3. **Build server** (Backend/Online)  
   - Implement room manager and WS events.
   - Enforce server-side validation.
4. **Integrate**  
   - Connect client OnlineController → server WS.
   - Test with 2 players + 1 spectator.
5. **QA & Hardening**  
   - Run test matrix.
   - Sanitize chat.
6. **Deploy**  
   - Render static + Render web service.
   - Smoke test.

## Communication Protocol
- Channel: project chat (or GitHub Issues).
- Messages are tagged: `[client]`, `[server]`, `[core]`, `[infra]`, `[ux]`.
- Client and server changes must reference API version (`v1`).
- Breaking changes require an announcement from Context Agent.

## Quality Gates
- Local PvP playable on desktop + mobile.
- PvC supports easy/medium/hard.
- Online: 2 players + 1 spectator working at once.
- Chat cannot inject HTML.
- Stats stored in localStorage and visible.
- Lint/test pass.

## Deliverables
- `/client` folder with working SPA-like page.
- `/server` folder with Express + WS service.
- This `AGENTS.md` (root).
