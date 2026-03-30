import { Injectable, inject, signal, computed } from '@angular/core';
import { CountriesService } from './countries.service';
import { Country, GameState, GameHint, PlayerStats, Attempt, SurvivalRun } from '../models/country.model';

const STATS_KEY = 'flagstreak_stats';
const STATE_KEY = 'flagstreak_daily_state';
const MAX_ATTEMPTS = 5;

@Injectable({ providedIn: 'root' })
export class GameService {
  private countriesService = inject(CountriesService);

  countries = signal<Country[]>([]);
  gameState = signal<GameState | null>(null);
  stats = signal<PlayerStats>(this.loadStats());
  loading = signal(true);
  loadError = signal(false);

  currentHints = computed(() => this.gameState()?.hints ?? []);
  attempts = computed(() => this.gameState()?.attempts ?? []);
  status = computed(() => this.gameState()?.status ?? 'playing');
  stars = computed(() => this.gameState()?.stars ?? 5);

  init(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.countriesService.getAll().subscribe(countries => {
      this.loading.set(false);
      if (countries.length === 0) {
        this.loadError.set(true);
        return;
      }
      this.countries.set(countries);
      this.initDailyGame(countries);
    });
  }

  // Deterministic daily country: same for all players on same date.
  // Uses a seeded Fisher-Yates shuffle per year so no country repeats
  // within the same year (each country appears at most twice: once for
  // years where days > countries.length).
  private getDailyCountry(countries: Country[], date: string): Country {
    const year = parseInt(date.slice(0, 4), 10);
    const shuffled = this.seededShuffle([...countries], year);
    const day = this.dayOfYear(date); // 0-based, 0–364/365
    return shuffled[day % shuffled.length];
  }

  // Days elapsed since Jan 1 of the same year (0-based).
  // Uses calendar arithmetic to avoid DST issues with timestamp subtraction.
  private dayOfYear(date: string): number {
    const [y, m, d] = date.split('-').map(Number);
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInMonth = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let day = d - 1;
    for (let i = 1; i < m; i++) day += daysInMonth[i];
    return day;
  }

  // Fisher-Yates shuffle seeded by year via FNV-1a + mulberry32 PRNG.
  private seededShuffle(arr: Country[], year: number): Country[] {
    const seed = this.fnv1a(String(year));
    let s = seed;
    const rand = (): number => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private fnv1a(input: string): number {
    const salted = `fs:${input}:7q2w`;
    let h = 2166136261;
    for (let i = 0; i < salted.length; i++) {
      h ^= salted.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private todayStr(): string {
    return this.localDateStr(new Date());
  }

  private initDailyGame(countries: Country[]): void {
    const today = this.todayStr();
    const saved = this.loadState();

    if (saved && saved.date === today) {
      this.gameState.set(saved);
      return;
    }

    // Check if streak should reset (missed a day)
    const stats = this.stats();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = this.localDateStr(yest);

    if (stats.lastPlayedDate && stats.lastPlayedDate !== yesterdayStr && stats.lastPlayedDate !== today) {
      this.stats.set({ ...stats, streak: 0 });
      this.saveStats(this.stats());
    }

    const country = this.getDailyCountry(countries, today);
    const state: GameState = {
      date: today,
      country,
      attempts: [],
      hints: [],
      status: 'playing',
      stars: MAX_ATTEMPTS,
    };
    this.gameState.set(state);
    this.saveState(state);
  }

  private normStr(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  guess(input: string): 'correct' | 'wrong' | 'invalid' | 'already_guessed' {
    const state = this.gameState();
    if (!state || state.status !== 'playing') return 'invalid';

    const normalized = this.normStr(input);
    const answer = this.normStr(state.country.name);
    const answerEs = state.country.nameEs ? this.normStr(state.country.nameEs) : null;

    const alreadyGuessed = state.attempts.some(a => this.normStr(a.guess) === normalized);
    if (alreadyGuessed) return 'already_guessed';

    const correct = normalized === answer || (answerEs !== null && normalized === answerEs);
    const attempt: Attempt = { guess: input.trim(), correct };
    const newAttempts = [...state.attempts, attempt];

    if (correct) {
      const starsEarned = MAX_ATTEMPTS - newAttempts.length + 1;
      const newState: GameState = {
        ...state,
        attempts: newAttempts,
        status: 'won',
        stars: starsEarned,
      };
      this.gameState.set(newState);
      this.saveState(newState);
      this.updateStatsOnWin(starsEarned);
      return 'correct';
    }

    const hints = this.buildHints(state.country, newAttempts.length);
    const lost = newAttempts.length >= MAX_ATTEMPTS;
    const newState: GameState = {
      ...state,
      attempts: newAttempts,
      hints,
      status: lost ? 'lost' : 'playing',
      stars: lost ? 0 : MAX_ATTEMPTS - newAttempts.length,
    };
    this.gameState.set(newState);
    this.saveState(newState);

    if (lost) this.updateStatsOnLoss();
    return 'wrong';
  }

  private buildHints(country: Country, failCount: number): GameHint[] {
    const hints: GameHint[] = [];

    if (failCount >= 1) hints.push({ type: 'continent', rawValue: country.region });
    if (failCount >= 2) hints.push({ type: 'subregion', rawValue: country.subregion });
    if (failCount >= 3) hints.push({
      type: 'firstLetter',
      rawValue: country.name[0].toUpperCase(),
      rawValueEs: (country.nameEs ?? country.name)[0].toUpperCase(),
    });
    if (failCount >= 4) hints.push({ type: 'capital', rawValue: country.capital });

    return hints;
  }

  private updateStatsOnWin(stars: number): void {
    const stats = this.stats();
    const today = this.todayStr();
    const updated: PlayerStats = {
      ...stats,
      streak: stats.streak + 1,
      lastPlayedDate: today,
      totalPlayed: stats.totalPlayed + 1,
      totalWon: stats.totalWon + 1,
      starHistory: [...stats.starHistory.slice(-9), stars],
    };
    this.stats.set(updated);
    this.saveStats(updated);
  }

  private updateStatsOnLoss(): void {
    const stats = this.stats();
    const today = this.todayStr();
    const updated: PlayerStats = {
      ...stats,
      streak: 0,
      lastPlayedDate: today,
      totalPlayed: stats.totalPlayed + 1,
      starHistory: [...stats.starHistory.slice(-9), 0],
    };
    this.stats.set(updated);
    this.saveStats(updated);
  }

  shareText = computed(() => {
    const state = this.gameState();
    if (!state) return '';
    const stars = '⭐'.repeat(state.stars) + '☆'.repeat(MAX_ATTEMPTS - state.stars);
    return `🚩 Flagstreak ${state.date}\n${stars}\nhttps://flagstreak.com`;
  });

  private loadStats(): PlayerStats {
    try {
      const item = localStorage.getItem(STATS_KEY);
      if (!item) return this.defaultStats();
      const parsed = JSON.parse(item);
      if (!this.isValidStats(parsed)) return this.defaultStats();
      // Migrate: add survivalLeaderboard if missing
      if (!Array.isArray((parsed as PlayerStats).survivalLeaderboard)) {
        (parsed as PlayerStats).survivalLeaderboard = [];
      }
      return parsed as PlayerStats;
    } catch {
      return this.defaultStats();
    }
  }

  private isValidStats(obj: unknown): obj is PlayerStats {
    if (!obj || typeof obj !== 'object') return false;
    const s = obj as Record<string, unknown>;
    return typeof s['streak'] === 'number'
      && typeof s['totalPlayed'] === 'number'
      && typeof s['totalWon'] === 'number'
      && Array.isArray(s['starHistory'])
      && typeof s['bestSurvivalScore'] === 'number';
  }

  private defaultStats(): PlayerStats {
    return { streak: 0, lastPlayedDate: '', totalPlayed: 0, totalWon: 0, starHistory: [], bestSurvivalScore: 0, survivalLeaderboard: [] };
  }

  private saveStats(stats: PlayerStats): void {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  private loadState(): GameState | null {
    try {
      const item = localStorage.getItem(STATE_KEY);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (!this.isValidState(parsed)) return null;
      // Migrate old hint format (label/value) to new format (rawValue)
      if (parsed.hints.some((h: unknown) => typeof h === 'object' && h !== null && 'value' in h)) {
        parsed.hints = [];
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private isValidState(obj: unknown): obj is GameState {
    if (!obj || typeof obj !== 'object') return false;
    const s = obj as Record<string, unknown>;
    return typeof s['date'] === 'string'
      && s['country'] !== null && typeof s['country'] === 'object'
      && Array.isArray(s['attempts'])
      && Array.isArray(s['hints'])
      && (s['status'] === 'playing' || s['status'] === 'won' || s['status'] === 'lost');
  }

  private saveState(state: GameState): void {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  recordSurvivalRun(run: SurvivalRun): void {
    const stats = this.stats();
    const leaderboard = [...(stats.survivalLeaderboard ?? []), run]
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? -1 : 1;
        if (b.score !== a.score) return b.score - a.score;
        return a.timeMs - b.timeMs;
      })
      .slice(0, 5);
    const updated: PlayerStats = { ...stats, survivalLeaderboard: leaderboard };
    this.stats.set(updated);
    this.saveStats(updated);
  }
}
