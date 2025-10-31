import UIController from './ui/UIController.js';
import StatsService from './core/StatsService.js';
import LocalPvPController from './modes/LocalPvPController.js';
import PvCController from './modes/PvCController.js';
import OnlineController from './modes/OnlineController.js';

const statsService = new StatsService();
let currentMode = null;
let currentController = null;

const ui = new UIController({
  onCellClick: handleCellClick,
  onModeSelect: handleModeSelect,
  onDifficultyChange: handleDifficultyChange,
  onOnlineSubmit: handleOnlineSubmit,
  onChatSubmit: handleChatSubmit
});

const localController = new LocalPvPController({
  ui,
  stats: statsService,
  onStatsUpdate: () => renderStats()
});

const pvcController = new PvCController({
  ui,
  stats: statsService,
  onStatsUpdate: () => renderStats()
});

let onlineController = null;

renderStats();
ui.renderBoard(Array(9).fill(null), true);
ui.updateStatus('Choose a mode to begin.');
ui.toggleChat(false);

function renderStats() {
  ui.renderStats(statsService.state);
}

function handleCellClick(index) {
  if (!currentController) return;
  if (currentMode === 'online') {
    currentController.handleCellClick(index);
  } else if (typeof currentController.handleMove === 'function') {
    currentController.handleMove(index);
  }
}

function handleModeSelect(mode) {
  currentMode = mode;
  if (mode !== 'online' && onlineController) {
    onlineController.disconnect();
  }

  if (mode === 'local') {
    ui.toggleChat(false);
    ui.showSpectatorBanner(false);
    currentController = localController;
    currentController.start();
  } else if (mode === 'pvc') {
    ui.toggleChat(false);
    ui.showSpectatorBanner(false);
    currentController = pvcController;
    currentController.start();
  } else if (mode === 'online') {
    ui.toggleChat(true);
    ui.resetChat();
    ui.renderBoard(Array(9).fill(null), true);
    ui.updateStatus('Enter room details to connect.');
    ui.showSpectatorBanner(false);
    currentController = null;
  }
}

function handleDifficultyChange(level) {
  pvcController.setDifficulty(level);
  if (currentMode === 'pvc') {
    pvcController.start();
  }
}

function ensureOnlineController() {
  if (!onlineController) {
    onlineController = new OnlineController({
      ui,
      stats: statsService,
      onStatsUpdate: () => renderStats()
    });
  }
  return onlineController;
}

async function handleOnlineSubmit(payload) {
  currentMode = 'online';
  const controller = ensureOnlineController();
  currentController = controller;
  try {
    await controller.connect(payload);
  } catch (error) {
    console.error(error);
  }
}

function handleChatSubmit(message) {
  if (!onlineController) return;
  onlineController.sendChat(message);
}

window.addEventListener('beforeunload', () => {
  onlineController?.disconnect();
});
