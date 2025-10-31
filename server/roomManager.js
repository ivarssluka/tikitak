import { checkDraw, checkWin } from './tttLogic.js';

export default class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, options = {}) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const room = {
      id: roomId,
      isPublic: options.isPublic ?? true,
      isTournament: options.isTournament ?? false,
      board: Array(9).fill(null),
      status: 'waiting',
      currentTurn: 'X',
      assignments: {},
      players: {},
      spectators: new Map(),
      sockets: new Map()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  listPublicRooms() {
    return Array.from(this.rooms.values())
      .filter((room) => room.isPublic)
      .map((room) => ({
        id: room.id,
        status: room.status,
        isTournament: room.isTournament,
        playerCount: Object.keys(room.assignments).length,
        spectatorCount: room.spectators.size
      }));
  }

  joinRoom({ roomId, playerId, nickname, role, socket, isTournament = false }) {
    const room = this.createRoom(roomId, { isTournament });
    room.players[playerId] = { nickname, role };

    if (role === 'spectator') {
      room.spectators.set(playerId, socket);
      room.sockets.set(playerId, socket);
      this.sendState(room);
      return { room, symbol: null };
    }

    const existingSymbol = room.assignments[playerId];
    if (!existingSymbol) {
      const takenSymbols = new Set(Object.values(room.assignments));
      const availableSymbol = ['X', 'O'].find((symbol) => !takenSymbols.has(symbol));
      if (!availableSymbol) {
        throw new Error('Room is full');
      }
      room.assignments[playerId] = availableSymbol;
    }

    room.sockets.set(playerId, socket);

    room.status = Object.keys(room.assignments).length === 2 ? 'active' : 'waiting';

    this.sendState(room);

    return { room, symbol: room.assignments[playerId] };
  }

  applyMove({ roomId, playerId, cellIndex }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const symbol = room.assignments[playerId];
    if (!symbol) {
      throw new Error('You are not an active player in this room');
    }

    if (room.status !== 'active') {
      throw new Error('Game is not active');
    }

    if (room.currentTurn !== symbol) {
      throw new Error('Not your turn');
    }

    if (room.board[cellIndex] !== null) {
      throw new Error('Cell already occupied');
    }

    room.board[cellIndex] = symbol;
    const winner = checkWin(room.board, symbol) ? symbol : null;
    const draw = !winner && checkDraw(room.board);

    if (winner || draw) {
      room.status = 'finished';
    } else {
      room.currentTurn = symbol === 'X' ? 'O' : 'X';
    }

    this.sendState(room);

    if (winner || draw) {
      this.broadcast(room, 'game_over', { winner, draw });
    }
  }

  sanitize(text) {
    return text.replace(/[<>]/g, '').slice(0, 200);
  }

  broadcast(room, type, data) {
    for (const socket of room.sockets.values()) {
      if (socket.readyState === socket.OPEN || socket.readyState === 1) {
        socket.send(JSON.stringify({ type, data }));
      }
    }
  }

  serialize(room) {
    return {
      id: room.id,
      board: room.board,
      status: room.status,
      currentTurn: room.currentTurn,
      assignments: room.assignments,
      players: room.players,
      isTournament: room.isTournament
    };
  }

  sendState(room) {
    this.broadcast(room, 'room_update', { room: this.serialize(room) });
  }

  handleChat({ roomId, playerId, text }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = room.players[playerId];
    if (!player) {
      throw new Error('Unknown player');
    }

    const sanitized = this.sanitize(text);
    this.broadcast(room, 'chat', {
      nickname: `${player.nickname}${player.role === 'spectator' ? ' (Spectator)' : ''}`,
      text: sanitized
    });
  }

  removeConnection({ roomId, playerId }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    room.sockets.delete(playerId);
    room.spectators.delete(playerId);

    if (room.assignments[playerId]) {
      delete room.assignments[playerId];
      delete room.players[playerId];
      if (room.status === 'active') {
        room.status = 'waiting';
      }
      if (!room.board.every((cell) => cell === null)) {
        room.board = Array(9).fill(null);
        room.currentTurn = 'X';
      }
    } else {
      delete room.players[playerId];
    }

    if (room.sockets.size === 0) {
      this.rooms.delete(roomId);
      return;
    }

    this.sendState(room);
  }
}
