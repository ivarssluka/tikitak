# AGENTS.md (client/)

## Purpose
Implement the browser-side experience of the Neon/Cyberpunk Tic-Tac-Toe, including:
- 3 game modes (Local PvP, PvC with 3 difficulties, Online PvP).
- Fully responsive neon UI.
- Local stats and stats view.
- Online chat panel (enabled only in online mode).
- Spectator banner and interaction lock.

## Agents
1. **Client Lead**
   - Owns `/client/index.html`, `/client/style.css`, `/client/src/main.js`.
   - Ensures ES modules are used and imports resolve.
2. **UI/Styling Agent**
   - Maintains neon/cyberpunk theme.
   - Ensures responsive layout for mobile/tablet/desktop.
   - Manages chat panel visibility and spectator banner.
3. **Client OOP/Game Agent**
   - Owns `/client/src/core/*`:
     - `Board.js`
     - `Game.js`
     - `Player.js`
     - `AIEngine.js`
     - `win.js`
     - `StatsService.js`
   - Guarantees logic is framework-free and testable in isolation.
4. **Modes Agent**
   - Owns `/client/src/modes/*` for:
     - `LocalPvPController.js`
     - `PvCController.js`
     - `OnlineController.js`
   - Ensures all controllers use the same UIController contract.
5. **UI Controller Agent**
   - Owns `/client/src/ui/UIController.js`
   - Wires DOM ↔ controllers (render board, status, chat, spectator).
   - Ensures click handlers are rebound on every render.

## Workflow
1. **Bootstrap UI**
   - Render 3x3 board, header, side panel.
   - Implement `UIController.renderBoard(cells, onClick)`.
2. **Local PvP first**
   - Use `Board` + `Game` + two `Player` instances.
   - Update `StatsService` on game end.
3. **PvC next**
   - Integrate `AIEngine` with 3 levels.
   - Add small delay for UX.
4. **Online last**
   - Ensure WS URL + player/room IDs are configurable.
   - On `room_update` → re-render board.
   - If spectator → disable clicks + show banner.
5. **Stats view**
   - Read from `localStorage` key `ttt_stats_v1`.
   - Show per-mode cards.

## Communication Protocol
- Client emits events (to server or to log):
  - `mode_selected`
  - `ai_difficulty_selected`
  - `online_room_joined`
  - `spectator_joined`
  - `game_finished`
- For online, client only sends:
  - `game:move`
  - `chat:message`
- Client must gracefully handle `error` events from WS.

## Quality Gates
- Board is playable on 360px wide screens.
- All three AI levels produce legal moves.
- Spectator cannot interact with board or send moves.
- No uncaught JS errors on normal flow.
- Stats persist after refresh.

## Deliverables
- Working `/client` folder.
- Documented `main.js` entry.
- This `AGENTS.md` in `/client`.
