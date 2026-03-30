export interface Country {
  name: string;
  nameEs?: string;      // Spanish common name (from translations.spa)
  cca2: string;
  capital: string;
  region: string;       // Continent
  subregion: string;    // Zone
  flagSvg: string;
  flagPng: string;
  flagAlt: string;
}

export interface GameHint {
  type: 'continent' | 'subregion' | 'firstLetter' | 'capital';
  rawValue: string;     // raw API value (untranslated)
  rawValueEs?: string;  // first letter in Spanish (only for firstLetter hint)
}

export interface Attempt {
  guess: string;
  correct: boolean;
}

export interface GameState {
  date: string;          // YYYY-MM-DD
  country: Country;
  attempts: Attempt[];
  hints: GameHint[];
  status: 'playing' | 'won' | 'lost';
  stars: number;
}

export interface SurvivalRun {
  score: number;
  timeMs: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface PlayerStats {
  streak: number;
  lastPlayedDate: string;
  totalPlayed: number;
  totalWon: number;
  starHistory: number[];  // last 10 results
  bestSurvivalScore: number;
  survivalLeaderboard: SurvivalRun[];
}
