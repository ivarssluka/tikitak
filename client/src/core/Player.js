export default class Player {
  constructor({ id, nickname, symbol, isAI = false }) {
    this.id = id;
    this.nickname = nickname;
    this.symbol = symbol;
    this.isAI = isAI;
  }
}
