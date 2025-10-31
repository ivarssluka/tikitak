import Player from '../core/Player.js';

export default class OnlineController {
  constructor({ ui, stats, onStatsUpdate, httpBase = '' }) {
    this.ui = ui;
    this.stats = stats;
    this.onStatsUpdate = onStatsUpdate;
    this.httpBase = httpBase;
    this.ws = null;
    this.player = null;
    this.opponent = null;
    this.roomId = null;
    this.role = 'player';
    this.isSpectator = false;
    this.lastBoard = Array(9).fill(null);

    this.ui.toggleChat(true);
  }

  async connect({ room, nickname, role }) {
    this.disconnect();
    this.ui.resetChat();
    this.ui.updateStatus('Joining room...');

    try {
      const auth = await this.fetchGuest(nickname);
      this.player = new Player({ id: auth.playerId, nickname: auth.nickname, symbol: 'X' });
      this.role = role;
      this.roomId = room;
      this.isSpectator = role === 'spectator';
      this.ui.showSpectatorBanner(this.isSpectator);

      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${window.location.host}/ws?roomId=${encodeURIComponent(room)}&playerId=${encodeURIComponent(auth.playerId)}&role=${encodeURIComponent(role)}&token=${encodeURIComponent(auth.token)}`;
      this.ws = new WebSocket(wsUrl);
      this.bindSocketEvents();
    } catch (error) {
      console.error(error);
      this.ui.updateStatus('Failed to join room.');
    }
  }

  async fetchGuest(nickname) {
    const response = await fetch(`${this.httpBase}/api/v1/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    if (!response.ok) {
      throw new Error('Auth failed');
    }
    return response.json();
  }

  bindSocketEvents() {
    this.ws.addEventListener('open', () => {
      this.ui.appendChatMessage({ nickname: 'System', text: 'Connected to room.', system: true });
      this.ui.updateStatus('Connected. Waiting for opponent.');
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleServerEvent(payload);
      } catch (error) {
        console.error('Failed to parse WS message', error);
      }
    });

    this.ws.addEventListener('close', () => {
      this.ui.appendChatMessage({ nickname: 'System', text: 'Disconnected.', system: true });
      this.ui.updateStatus('Disconnected from room.');
      this.ws = null;
    });
  }

  handleServerEvent(payload) {
    const { type, data } = payload;
    switch (type) {
      case 'room_update':
        this.handleRoomUpdate(data.room);
        break;
      case 'game_over':
        this.handleGameOver(data);
        break;
      case 'chat':
        this.ui.appendChatMessage({ nickname: data.nickname, text: data.text });
        break;
      case 'error':
        this.ui.appendChatMessage({ nickname: 'System', text: data.message, system: true });
        this.ui.updateStatus(data.message);
        break;
      default:
        break;
    }
  }

  handleRoomUpdate(room) {
    this.lastBoard = room.board;
    const symbol = room.assignments?.[this.player?.id];
    if (symbol) {
      this.player.symbol = symbol;
    }

    const opponentEntry = Object.entries(room.assignments || {}).find(
      ([playerId, sym]) => playerId !== this.player?.id && (sym === 'X' || sym === 'O')
    );
    if (opponentEntry) {
      const opponentId = opponentEntry[0];
      const nickname = room.players?.[opponentId]?.nickname || 'Opponent';
      this.opponent = new Player({ id: opponentId, nickname, symbol: opponentEntry[1] });
    }

    const isPlayerTurn = room.currentTurn === this.player?.symbol;
    const disabled = this.isSpectator || !isPlayerTurn || room.status !== 'active';
    this.ui.renderBoard(room.board, disabled);

    if (room.status === 'waiting') {
      this.ui.updateStatus('Waiting for another player to join.');
    } else if (room.status === 'active') {
      this.ui.updateStatus(isPlayerTurn ? 'Your turn.' : `Waiting for ${this.opponent?.nickname || 'opponent'}...`);
    } else if (room.status === 'finished') {
      this.ui.updateStatus('Game finished. Start a new room to play again.');
    }
  }

  handleGameOver({ winner, draw }) {
    if (draw) {
      this.stats.recordOnline('draws');
      this.ui.updateStatus('Draw game.');
    } else if (winner === this.player?.symbol) {
      this.stats.recordOnline('wins');
      this.ui.updateStatus('You win!');
    } else {
      this.stats.recordOnline('losses');
      this.ui.updateStatus('You lost.');
    }
    this.onStatsUpdate?.();
  }

  sendMove(index) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.isSpectator) {
      return;
    }
    this.ws.send(
      JSON.stringify({
        type: 'game:move',
        data: { roomId: this.roomId, playerId: this.player.id, cellIndex: index }
      })
    );
  }

  sendChat(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(
      JSON.stringify({
        type: 'chat:message',
        data: { roomId: this.roomId, playerId: this.player.id, text }
      })
    );
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  handleCellClick(index) {
    this.sendMove(index);
  }
}
