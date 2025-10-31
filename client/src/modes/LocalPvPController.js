import Game from '../core/Game.js';
import Player from '../core/Player.js';

export default class LocalPvPController {
  constructor({ ui, stats, onStatsUpdate }) {
    this.ui = ui;
    this.stats = stats;
    this.onStatsUpdate = onStatsUpdate;
    this.playerX = new Player({ id: 'local-x', nickname: 'Player X', symbol: 'X' });
    this.playerO = new Player({ id: 'local-o', nickname: 'Player O', symbol: 'O' });
    this.game = new Game(this.playerX, this.playerO);
  }

  start() {
    this.game.reset();
    this.render();
    this.ui.updateStatus('Local PvP: X to move.');
  }

  handleMove(index) {
    const result = this.game.makeMove(index);
    if (result.status === 'invalid') {
      this.ui.updateStatus('Cell already taken. Choose another.');
      return;
    }

    this.render();
    if (result.status === 'win') {
      this.stats.recordLocal('win', result.winner);
      this.onStatsUpdate?.();
      this.ui.updateStatus(`${result.winner} wins! Tap a mode to play again.`);
      return;
    }

    if (result.status === 'draw') {
      this.stats.recordLocal('draw', null);
      this.onStatsUpdate?.();
      this.ui.updateStatus('Draw! Tap a mode to play again.');
      return;
    }

    this.ui.updateStatus(`${this.game.currentSymbol} to move.`);
  }

  render() {
    this.ui.renderBoard(this.game.board.cells);
  }
}
