const STORAGE_KEY = 'ttt_stats_v1';

const DEFAULT_STATS = {
  local: { winsX: 0, winsO: 0, draws: 0 },
  pvc: {
    easy: { wins: 0, losses: 0, draws: 0 },
    medium: { wins: 0, losses: 0, draws: 0 },
    hard: { wins: 0, losses: 0, draws: 0 }
  },
  online: { wins: 0, losses: 0, draws: 0 }
};

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_STATS));
}

function mergeStats(saved) {
  const base = cloneDefault();
  if (!saved) return base;
  if (saved.local) {
    base.local = { ...base.local, ...saved.local };
  }
  if (saved.pvc) {
    base.pvc = {
      easy: { ...base.pvc.easy, ...(saved.pvc.easy || {}) },
      medium: { ...base.pvc.medium, ...(saved.pvc.medium || {}) },
      hard: { ...base.pvc.hard, ...(saved.pvc.hard || {}) }
    };
  }
  if (saved.online) {
    base.online = { ...base.online, ...saved.online };
  }
  return base;
}

export default class StatsService {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.state = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefault();
      }
      const parsed = JSON.parse(raw);
      return mergeStats(parsed);
    } catch (error) {
      console.error('Failed to parse stats from storage', error);
      return cloneDefault();
    }
  }

  save() {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  recordLocal(result, winnerSymbol) {
    if (result === 'draw') {
      this.state.local.draws += 1;
    } else if (winnerSymbol === 'X') {
      this.state.local.winsX += 1;
    } else if (winnerSymbol === 'O') {
      this.state.local.winsO += 1;
    }
    this.save();
  }

  recordPVC(result, difficulty) {
    const bucket = this.state.pvc[difficulty];
    if (!bucket) return;
    bucket[result] += 1;
    this.save();
  }

  recordOnline(result) {
    const bucket = this.state.online;
    bucket[result] += 1;
    this.save();
  }
}

export { DEFAULT_STATS };
