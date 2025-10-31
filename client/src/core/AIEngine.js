import { checkDraw, checkWin } from './win.js';

export default class AIEngine {
  constructor(symbol = 'O') {
    this.symbol = symbol;
  }

  getMove(board, difficulty = 'easy', opponentSymbol = 'X') {
    const moves = board.availableMoves();
    if (moves.length === 0) {
      return null;
    }

    if (difficulty === 'easy') {
      return this.randomMove(moves);
    }

    if (difficulty === 'medium') {
      return this.mediumMove(board, moves, opponentSymbol);
    }

    return this.minimaxMove(board, opponentSymbol);
  }

  randomMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  mediumMove(board, moves, opponentSymbol) {
    // Try winning move
    for (const move of moves) {
      const clone = board.clone();
      clone.applyMove(move, this.symbol);
      if (checkWin(clone.cells, this.symbol)) {
        return move;
      }
    }

    // Block opponent win
    for (const move of moves) {
      const clone = board.clone();
      clone.applyMove(move, opponentSymbol);
      if (checkWin(clone.cells, opponentSymbol)) {
        return move;
      }
    }

    return this.randomMove(moves);
  }

  minimaxMove(board, opponentSymbol) {
    let bestScore = -Infinity;
    let bestMove = null;

    for (const move of board.availableMoves()) {
      const clone = board.clone();
      clone.applyMove(move, this.symbol);
      const score = this.minimax(clone, false, this.symbol, opponentSymbol);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  minimax(board, isMaximizing, aiSymbol, opponentSymbol) {
    if (checkWin(board.cells, aiSymbol)) {
      return 10;
    }
    if (checkWin(board.cells, opponentSymbol)) {
      return -10;
    }
    if (checkDraw(board.cells)) {
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const move of board.availableMoves()) {
        const clone = board.clone();
        clone.applyMove(move, aiSymbol);
        const score = this.minimax(clone, false, aiSymbol, opponentSymbol);
        bestScore = Math.max(bestScore, score);
      }
      return bestScore;
    }

    let bestScore = Infinity;
    for (const move of board.availableMoves()) {
      const clone = board.clone();
      clone.applyMove(move, opponentSymbol);
      const score = this.minimax(clone, true, aiSymbol, opponentSymbol);
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}
