import Board from './Board.js';
import { checkDraw, checkWin } from './win.js';

export default class Game {
  constructor(playerX, playerO) {
    this.board = new Board();
    this.playerX = playerX;
    this.playerO = playerO;
    this.currentSymbol = 'X';
    this.isOver = false;
  }

  reset() {
    this.board.reset();
    this.currentSymbol = 'X';
    this.isOver = false;
  }

  get currentPlayer() {
    return this.currentSymbol === 'X' ? this.playerX : this.playerO;
  }

  makeMove(index) {
    if (this.isOver) {
      return { status: 'finished' };
    }

    if (!this.board.isCellEmpty(index)) {
      return { status: 'invalid' };
    }

    this.board.applyMove(index, this.currentSymbol);

    if (checkWin(this.board.cells, this.currentSymbol)) {
      this.isOver = true;
      return { status: 'win', winner: this.currentSymbol };
    }

    if (checkDraw(this.board.cells)) {
      this.isOver = true;
      return { status: 'draw' };
    }

    this.currentSymbol = this.currentSymbol === 'X' ? 'O' : 'X';
    return { status: 'continue' };
  }
}
