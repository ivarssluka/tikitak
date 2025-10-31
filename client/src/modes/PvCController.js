import Game from '../core/Game.js';
import Player from '../core/Player.js';
import AIEngine from '../core/AIEngine.js';

const AI_DELAY_MS = 600;

export default class PvCController {
  constructor({ ui, stats, onStatsUpdate }) {
    this.ui = ui;
    this.stats = stats;
    this.onStatsUpdate = onStatsUpdate;
    this.human = new Player({ id: 'human', nickname: 'You', symbol: 'X' });
    this.ai = new Player({ id: 'ai', nickname: 'AI', symbol: 'O', isAI: true });
    this.game = new Game(this.human, this.ai);
    this.engine = new AIEngine(this.ai.symbol);
    this.difficulty = 'easy';
    this.isProcessingAI = false;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  start() {
    this.game.reset();
    this.render();
    this.isProcessingAI = false;
    this.ui.updateStatus(`PvC (${this.difficulty.toUpperCase()}): Your move.`);
  }

  handleMove(index) {
    if (this.game.currentPlayer.isAI || this.isProcessingAI) {
      return;
    }

    const result = this.game.makeMove(index);
    if (result.status === 'invalid') {
      this.ui.updateStatus('Cell already taken.');
      return;
    }

    this.render();
    if (this.handleOutcome(result)) {
      return;
    }

    this.queueAiMove();
  }

  queueAiMove() {
    this.isProcessingAI = true;
    this.ui.updateStatus('AI thinking...');
    setTimeout(() => {
      const move = this.engine.getMove(this.game.board, this.difficulty, this.human.symbol);
      if (move !== null) {
        const result = this.game.makeMove(move);
        this.render();
        if (this.handleOutcome(result)) {
          this.isProcessingAI = false;
          return;
        }
      }
      this.isProcessingAI = false;
      this.ui.updateStatus('Your move.');
    }, AI_DELAY_MS);
  }

  handleOutcome(result) {
    if (result.status === 'win') {
      const winner = result.winner === this.human.symbol ? 'wins' : 'losses';
      this.stats.recordPVC(winner, this.difficulty);
      this.onStatsUpdate?.();
      this.ui.updateStatus(result.winner === this.human.symbol ? 'You win!' : 'AI wins!');
      return true;
    }

    if (result.status === 'draw') {
      this.stats.recordPVC('draws', this.difficulty);
      this.onStatsUpdate?.();
      this.ui.updateStatus('Draw game.');
      return true;
    }

    return false;
  }

  render() {
    const disabled = this.game.currentPlayer.isAI || this.isProcessingAI;
    this.ui.renderBoard(this.game.board.cells, disabled);
  }
}
