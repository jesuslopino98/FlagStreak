# 🚩 Flagstreak

[🇬🇧 English](#english) · [🇪🇸 Español](#español)

---

## English

A daily flag guessing game. Identify the country from its flag — the fewer attempts, the more stars you earn.

![Angular](https://img.shields.io/badge/Angular-21-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

### Game Modes

| Mode | Description |
|------|-------------|
| **Daily** | One flag per day, same for all players. Maintain your streak by playing every day. |
| **Survival** | Identify as many flags as you can without a single mistake. Race against yourself. |
| **Training** | Practice without limits or pressure. |

### How to Play

1. A flag is shown on screen
2. Type the country name and submit
3. Each wrong guess reveals a hint:
   - **1st miss** — Continent
   - **2nd miss** — Subregion
   - **3rd miss** — First letter
   - **4th miss** — Capital city
4. You have **5 attempts** — score from ⭐ to ⭐⭐⭐⭐⭐

Answers are accepted in both **English and Spanish**.

### Tech Stack

- [Angular 21](https://angular.dev) — standalone components, signals
- [TypeScript 5.9](https://www.typescriptlang.org)
- [REST Countries API](https://restcountries.com) — country and flag data
- No backend — all state lives in `localStorage`

### Development

```bash
# Install dependencies
npm install

# Start dev server at localhost:4200
npm start

# Production build → dist/flagstreak/browser/
npm run build

# Run tests
npm test
```

### Deployment

Built as a static SPA. Deploy the contents of `dist/flagstreak/browser/` to any static host.

The `public/_redirects` file is included for correct client-side routing on Cloudflare Pages:

```
/* /index.html 200
```

### Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/        # Country, GameState, PlayerStats types
│   │   └── services/      # GameService, CountriesService, LanguageService
│   ├── features/
│   │   ├── daily/         # Daily game mode
│   │   ├── survival/      # Survival mode
│   │   └── training/      # Training mode
│   └── shared/
│       └── components/    # FlagDisplay, CountryInput, HintPanel, StarsDisplay
└── public/                # Static assets
```

### License

MIT

---

## Español

Un juego diario para adivinar banderas. Identifica el país a partir de su bandera — cuantos menos intentos, más estrellas consigues.

### Modos de juego

| Modo | Descripción |
|------|-------------|
| **Diario** | Una bandera por día, la misma para todos los jugadores. Mantén tu racha jugando cada día. |
| **Supervivencia** | Identifica el mayor número de banderas posible sin cometer un solo error. Compite contra ti mismo. |
| **Entrenamiento** | Practica sin límites ni presión. |

### Cómo jugar

1. Se muestra una bandera en pantalla
2. Escribe el nombre del país y envíalo
3. Cada respuesta incorrecta revela una pista:
   - **1er fallo** — Continente
   - **2º fallo** — Subregión
   - **3er fallo** — Primera letra
   - **4º fallo** — Capital
4. Tienes **5 intentos** — puntuación de ⭐ a ⭐⭐⭐⭐⭐

Las respuestas se aceptan tanto en **español como en inglés**.

### Stack tecnológico

- [Angular 21](https://angular.dev) — componentes standalone, signals
- [TypeScript 5.9](https://www.typescriptlang.org)
- [REST Countries API](https://restcountries.com) — datos de países y banderas
- Sin backend — todo el estado vive en `localStorage`

### Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo en localhost:4200
npm start

# Build de producción → dist/flagstreak/browser/
npm run build

# Ejecutar tests
npm test
```

### Despliegue

Construida como SPA estática. Despliega el contenido de `dist/flagstreak/browser/` en cualquier hosting estático.

El archivo `public/_redirects` está incluido para el correcto funcionamiento del router en Cloudflare Pages:

```
/* /index.html 200
```

### Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── models/        # Tipos: Country, GameState, PlayerStats
│   │   └── services/      # GameService, CountriesService, LanguageService
│   ├── features/
│   │   ├── daily/         # Modo diario
│   │   ├── survival/      # Modo supervivencia
│   │   └── training/      # Modo entrenamiento
│   └── shared/
│       └── components/    # FlagDisplay, CountryInput, HintPanel, StarsDisplay
└── public/                # Assets estáticos
```

### Licencia

MIT
