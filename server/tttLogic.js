export function checkWin(board, symbol) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  return lines.some((line) => line.every((index) => board[index] === symbol));
}

export function checkDraw(board) {
  return board.every((cell) => cell !== null);
}
