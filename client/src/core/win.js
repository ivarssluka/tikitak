const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function checkWin(cells, symbol) {
  return WIN_PATTERNS.some((pattern) =>
    pattern.every((index) => cells[index] === symbol)
  );
}

export function checkDraw(cells) {
  return cells.every((cell) => cell !== null);
}

export { WIN_PATTERNS };
