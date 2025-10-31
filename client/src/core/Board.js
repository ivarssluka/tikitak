export default class Board {
  constructor() {
    this.reset();
  }

  reset() {
    this.cells = Array(9).fill(null);
  }

  clone() {
    const board = new Board();
    board.cells = [...this.cells];
    return board;
  }

  isCellEmpty(index) {
    return this.cells[index] === null;
  }

  applyMove(index, symbol) {
    if (!this.isCellEmpty(index)) {
      throw new Error('Cell is already occupied');
    }
    this.cells[index] = symbol;
  }

  availableMoves() {
    return this.cells
      .map((value, idx) => (value === null ? idx : null))
      .filter((value) => value !== null);
  }
}
