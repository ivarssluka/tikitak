# AGENTS.md (server/)

## Purpose
Provide online capabilities for the Tic-Tac-Toe app:
- Room creation/listing
- Player + spectator join
- Server-authoritative moves
- Chat broadcast (sanitized)
- Tournament stubs
- WebSocket transport

## Agents
1. **Server Lead**
   - Owns `server.js`
   - Configures Express, WS, and port.
   - Adds CORS/helmet if needed.
2. **Room Manager Agent**
   - Owns `roomManager.js`
   - Responsible for:
     - createRoom
     - listPublicRooms
     - joinRoom (player/spectator)
     - applyMove (enforce turn, empty cell)
     - broadcast to all connections
   - Keeps room state minimal and serializable.
3. **Game Rules Agent**
   - Owns `tttLogic.js`
   - Exposes `checkWin(board, symbol)` and `checkDraw(board)`
   - Ensures parity with client rules.
4. **Chat & Spectator Agent**
   - Extends WS message handling:
     - `chat:message` → sanitize → broadcast
     - spectator join event
   - Enforces spectator cannot send `game:move`.
   - Adds rate limiting (later).
5. **Tournament Agent**
   - Adds simple room-grouping by `isTournament=true`
   - Exposes endpoint to list tournament rooms
   - Future: round-robin or bracket

## Workflow
1. **Bootstrap HTTP**
   - `/api/v1/auth/guest` → returns `{playerId, nickname, token}`
   - `/api/v1/rooms` → returns public rooms
2. **Start WS server**
   - Accept query params: `roomId`, `playerId`, `role`
   - Delegate to room manager
3. **Game loop (WS)**
   - On `game:move` → validate in room manager
   - On success → broadcast `room_update`
   - On win/draw → broadcast `game_over`
4. **Chat**
   - On `chat:message` → check role → sanitize → broadcast
5. **Cleanup**
   - On WS close → optionally remove spectator/player → broadcast

## Communication Protocol
- **Incoming WS events (from client):**
  - `game:move` → `{roomId, playerId, cellIndex}`
  - `chat:message` → `{roomId, playerId, text}`
- **Outgoing WS events (to clients):**
  - `room_update` → `{room:{...}}`
  - `game_over` → `{winner|draw}`
  - `error` → `{message}`

## Quality Gates
- Invalid room → send `error`.
- Spectator sending move → send `error`.
- 2 simultaneous players, 1 spectator → all receive state.
- Server prevents overwriting of non-null cells.
- Uses same win rules as client.

## Deliverables
- `server.js`
- `roomManager.js`
- `tttLogic.js`
- This `AGENTS.md` in `/server`
