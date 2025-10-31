export default class UIController {
  constructor({ onCellClick, onModeSelect, onDifficultyChange, onOnlineSubmit, onChatSubmit }) {
    this.boardEl = document.getElementById('board');
    this.statusEl = document.getElementById('status');
    this.modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    this.difficultyPanel = document.getElementById('difficulty-panel');
    this.difficultySelect = document.getElementById('difficulty-select');
    this.onlinePanel = document.getElementById('online-panel');
    this.onlineForm = document.getElementById('online-form');
    this.spectatorBanner = document.getElementById('spectator-banner');
    this.chatPanel = document.getElementById('chat-panel');
    this.chatLog = document.getElementById('chat-log');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.statsContent = document.getElementById('stats-content');

    this.onCellClick = onCellClick;
    this.onModeSelect = onModeSelect;
    this.onDifficultyChange = onDifficultyChange;
    this.onOnlineSubmit = onOnlineSubmit;
    this.onChatSubmit = onChatSubmit;

    this.bindEvents();
  }

  bindEvents() {
    this.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.modeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        const showDifficulty = mode === 'pvc';
        this.difficultyPanel.hidden = !showDifficulty;
        this.onlinePanel.hidden = mode !== 'online';
        this.onModeSelect(mode);
      });
    });

    this.difficultySelect.addEventListener('change', (event) => {
      this.onDifficultyChange(event.target.value);
    });

    this.onlineForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(this.onlineForm);
      const payload = {
        room: formData.get('room').trim(),
        nickname: formData.get('nickname').trim(),
        role: formData.get('role')
      };
      this.onOnlineSubmit(payload);
    });

    this.chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = this.chatInput.value.trim();
      if (!message) return;
      this.chatInput.value = '';
      this.onChatSubmit(message);
    });
  }

  renderBoard(cells, disabled = false) {
    this.boardEl.innerHTML = '';
    this.boardEl.classList.toggle('disabled', disabled);
    cells.forEach((value, index) => {
      const button = document.createElement('button');
      button.className = 'cell';
      button.dataset.index = index;
      button.dataset.value = value ?? '';
      button.textContent = value ?? '';
      button.disabled = disabled || Boolean(value);
      if (disabled || value) {
        button.classList.add('disabled');
      }
      button.addEventListener('click', () => this.onCellClick(index));
      this.boardEl.appendChild(button);
    });
  }

  updateStatus(message) {
    this.statusEl.textContent = message;
  }

  showSpectatorBanner(isSpectator) {
    this.spectatorBanner.hidden = !isSpectator;
  }

  toggleChat(visible) {
    this.chatPanel.hidden = !visible;
  }

  appendChatMessage({ nickname, text, system = false }) {
    const entry = document.createElement('div');
    entry.className = 'chat-entry';
    if (system) {
      entry.innerHTML = `<em>${text}</em>`;
    } else {
      const safeName = nickname.replace(/[<>]/g, '');
      entry.innerHTML = `<span class="nickname">${safeName}:</span> ${text}`;
    }
    this.chatLog.appendChild(entry);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  renderStats(stats) {
    const cards = [];
    cards.push(`
      <article class="stat-card">
        <h3>Local PvP</h3>
        <p>X Wins: <strong>${stats.local.winsX}</strong></p>
        <p>O Wins: <strong>${stats.local.winsO}</strong></p>
        <p>Draws: <strong>${stats.local.draws}</strong></p>
      </article>
    `);

    cards.push(`
      <article class="stat-card">
        <h3>PvC - Easy</h3>
        <p>Wins: <strong>${stats.pvc.easy.wins}</strong></p>
        <p>Losses: <strong>${stats.pvc.easy.losses}</strong></p>
        <p>Draws: <strong>${stats.pvc.easy.draws}</strong></p>
      </article>
    `);
    cards.push(`
      <article class="stat-card">
        <h3>PvC - Medium</h3>
        <p>Wins: <strong>${stats.pvc.medium.wins}</strong></p>
        <p>Losses: <strong>${stats.pvc.medium.losses}</strong></p>
        <p>Draws: <strong>${stats.pvc.medium.draws}</strong></p>
      </article>
    `);
    cards.push(`
      <article class="stat-card">
        <h3>PvC - Hard</h3>
        <p>Wins: <strong>${stats.pvc.hard.wins}</strong></p>
        <p>Losses: <strong>${stats.pvc.hard.losses}</strong></p>
        <p>Draws: <strong>${stats.pvc.hard.draws}</strong></p>
      </article>
    `);

    cards.push(`
      <article class="stat-card">
        <h3>Online</h3>
        <p>Wins: <strong>${stats.online.wins}</strong></p>
        <p>Losses: <strong>${stats.online.losses}</strong></p>
        <p>Draws: <strong>${stats.online.draws}</strong></p>
      </article>
    `);

    this.statsContent.innerHTML = cards.join('');
  }

  resetChat() {
    this.chatLog.innerHTML = '';
  }
}
