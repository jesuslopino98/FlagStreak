import { Injectable, signal, effect } from '@angular/core';

export type Lang = 'es' | 'en';

const TRANSLATIONS = {
  es: {
    // Nav
    navMenu: 'Menú de navegación',
    navDaily: 'Diario',
    navSurvival: 'Supervivencia',
    navTraining: 'Entrenamiento',
    navCapitalStreak: 'CapitalStreak',
    settings: 'Ajustes',
    labelTheme: 'Tema',
    labelLang: 'Idioma',
    themeLight: 'Activar modo claro',
    themeDark: 'Activar modo oscuro',
    selectLang: 'Seleccionar idioma',
    // Loading
    loading: 'Cargando banderas del mundo...',
    loadingShort: 'Cargando...',
    loadError: 'No se pudieron cargar los países. Comprueba tu conexión e inténtalo de nuevo.',
    retry: 'Reintentar',
    // Game
    streakLabel: 'Racha',
    record: 'Récord',
    hintsLabel: 'Pistas reveladas',
    unrevealedSuffix: 'sin revelar',
    correctFeedback: '¡Correcto! 🎉',
    wrongFeedback: 'Incorrecto — ¡nueva pista!',
    wrongFeedbackSurvival: 'Incorrecto — pista desbloqueada.',
    alreadyGuessed: 'Ya lo intentaste',
    // Result
    won: '¡Lo conseguiste!',
    answerLabel: 'Respuesta',
    shareBtn: 'Compartir resultado',
    // Game over survival
    gameOver: 'Fin de la partida',
    gotCountriesPre: 'Adivinaste',
    gotCountriesPost: 'países',
    wasAnswer: 'Era',
    newRecord: '🏆 ¡Nuevo récord!',
    playAgain: 'Jugar de nuevo',
    // Survival lobby / new
    leaderboard: 'Tabla de Récords',
    startBtn: 'Iniciar',
    noRuns: 'Sin partidas todavía',
    timeLabel: 'Tiempo',
    dateLabel: 'Fecha',
    completedBadge: '✓ Completo',
    survivalCompleted: '¡Reto Completado!',
    allCountriesGuessed: '¡Adivinaste todos los países!',
    backToLobby: 'Volver',
    finalTime: 'Tiempo final',
    // Training
    trainingLives: 'Vidas',
    trainingGuessed: 'Adivinadas',
    trainingErrors: 'Errores',
    trainingCorrect: '¡Correcto!',
    trainingWrong: 'Incorrecto',
    trainingAnswer: 'La respuesta era',
    trainingNext: 'Siguiente',
    trainingGameOver: '¡Sin vidas!',
    trainingGameOverSub: 'Se acabaron las vidas',
    trainingStart: 'Comenzar',
    // Share modal
    yourResult: 'Tu resultado',
    copy: 'Copiar',
    copied: '¡Copiado! ✓',
    share: 'Compartir',
    // Country input
    inputPlaceholder: 'Escribe el nombre del país...',
    inputLabel: 'Nombre del país',
    suggestionsLabel: 'Sugerencias de países',
    confirmLabel: 'Confirmar respuesta',
    // Hint labels
    continent: 'Continente',
    zone: 'Zona',
    firstLetter: 'Empieza por',
    capital: 'Capital',
    hintsTitle: 'Pistas',
  },
  en: {
    // Nav
    navMenu: 'Navigation menu',
    navDaily: 'Daily',
    navSurvival: 'Survival',
    navTraining: 'Training',
    navCapitalStreak: 'CapitalStreak',
    settings: 'Settings',
    labelTheme: 'Theme',
    labelLang: 'Language',
    themeLight: 'Enable light mode',
    themeDark: 'Enable dark mode',
    selectLang: 'Select language',
    // Loading
    loading: 'Loading world flags...',
    loadingShort: 'Loading...',
    loadError: "Couldn't load countries. Check your connection and try again.",
    retry: 'Retry',
    // Game
    streakLabel: 'Streak',
    record: 'Record',
    hintsLabel: 'Revealed hints',
    unrevealedSuffix: 'unrevealed',
    correctFeedback: 'Correct! 🎉',
    wrongFeedback: 'Wrong — new hint!',
    wrongFeedbackSurvival: 'Wrong — hint unlocked.',
    alreadyGuessed: 'Already tried',
    // Result
    won: 'You got it!',
    answerLabel: 'Answer',
    shareBtn: 'Share result',
    // Game over survival
    gameOver: 'Game Over',
    gotCountriesPre: 'You got',
    gotCountriesPost: 'countries',
    wasAnswer: 'It was',
    newRecord: '🏆 New record!',
    playAgain: 'Play again',
    // Survival lobby / new
    leaderboard: 'Leaderboard',
    startBtn: 'Start',
    noRuns: 'No games yet',
    timeLabel: 'Time',
    dateLabel: 'Date',
    completedBadge: '✓ Full',
    survivalCompleted: 'Challenge Completed!',
    allCountriesGuessed: 'You guessed all the countries!',
    backToLobby: 'Back',
    finalTime: 'Final time',
    // Training
    trainingLives: 'Lives',
    trainingGuessed: 'Guessed',
    trainingErrors: 'Errors',
    trainingCorrect: 'Correct!',
    trainingWrong: 'Wrong',
    trainingAnswer: 'The answer was',
    trainingNext: 'Next',
    trainingGameOver: 'No lives left!',
    trainingGameOverSub: 'You ran out of lives',
    trainingStart: 'Start',
    // Share modal
    yourResult: 'Your result',
    copy: 'Copy',
    copied: 'Copied! ✓',
    share: 'Share',
    // Country input
    inputPlaceholder: 'Type the country name...',
    inputLabel: 'Country name',
    suggestionsLabel: 'Country suggestions',
    confirmLabel: 'Submit answer',
    // Hint labels
    continent: 'Continent',
    zone: 'Region',
    firstLetter: 'Starts with',
    capital: 'Capital',
    hintsTitle: 'Hints',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS['es'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<Lang>(this.initLang());

  constructor() {
    effect(() => {
      localStorage.setItem('flagstreak-lang', this.lang());
    });
  }

  toggle(): void {
    this.lang.update(l => l === 'es' ? 'en' : 'es');
  }

  t(key: TranslationKey): string {
    return TRANSLATIONS[this.lang()][key];
  }

  translateRegion(region: string): string {
    if (this.lang() === 'en') return region;
    const map: Record<string, string> = {
      Africa: 'África', Americas: 'América', Asia: 'Asia',
      Europe: 'Europa', Oceania: 'Oceanía', Antarctic: 'Antártida',
    };
    return map[region] ?? region;
  }

  translateSubregion(sub: string): string {
    if (this.lang() === 'en') return sub;
    const map: Record<string, string> = {
      'Northern Africa': 'Norte de África', 'Eastern Africa': 'Este de África',
      'Western Africa': 'Oeste de África', 'Middle Africa': 'Centro de África',
      'Southern Africa': 'Sur de África', 'Northern Europe': 'Norte de Europa',
      'Southern Europe': 'Sur de Europa', 'Western Europe': 'Oeste de Europa',
      'Eastern Europe': 'Este de Europa', 'Central Europe': 'Centro de Europa',
      'Northern America': 'Norte de América', 'Central America': 'Centro de América',
      'South America': 'Sur de América', 'Caribbean': 'Caribe',
      'Eastern Asia': 'Este de Asia', 'Southern Asia': 'Sur de Asia',
      'South-Eastern Asia': 'Sudeste de Asia', 'Central Asia': 'Asia Central',
      'Western Asia': 'Oeste de Asia', 'Australia and New Zealand': 'Australia y NZ',
      'Melanesia': 'Melanesia', 'Micronesia': 'Micronesia', 'Polynesia': 'Polinesia',
    };
    return map[sub] ?? sub;
  }

  private initLang(): Lang {
    const saved = localStorage.getItem('flagstreak-lang');
    return saved === 'en' ? 'en' : 'es';
  }
}
