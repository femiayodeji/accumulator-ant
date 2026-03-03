# Accumulator - Mobile Math Game

A minimalist educational game teaching mental arithmetic through the philosophy of discipline and intentional accumulation.

## Game Concept

Control an ant that catches falling numbers (+/-) to reach an exact target sum. The game embodies:
- **Precision**: Reach the exact target, not more or less
- **Discipline**: Choose what to catch, avoid excess
- **Consequences**: Overflow slows you down, requiring negative numbers to correct

## Features

- ✅ **Endless Progression**: Mathematical difficulty scaling
- ✅ **Mobile-First**: Touch controls for left/right movement
- ✅ **TypeScript**: Type-safe game development
- ✅ **Phaser 3**: Professional game engine
- ✅ **Dynamic Difficulty**: Formulas adjust target, speed, number range per level
- ✅ **Progress Persistence**: Current level saved in localStorage
- ✅ **Sound Effects**: Procedural collect and level-complete audio cues

## Tech Stack

- **Phaser 3.70**: Game engine
- **TypeScript 5.3**: Language
- **Vite**: Build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens browser at `http://localhost:3000` with hot reload.

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Game Controls

- **Desktop**: Arrow keys (← →) to move ant
- **Touch/Mouse**: Drag the ant left/right

## Responsive Layout

- Canvas now resizes with the viewport
- UI, ant position bounds, and spawn area adapt to screen width/height changes

## Difficulty Progression

### Level Formulas

- **Target**: `10 + (level × 5) + (log(level + 1) × 10)`
- **Number Range**: `±(3 + floor(level / 5))` capped at ±15
- **Fall Speed**: `100 + (level × 5)` px/s capped at 400
- **Spawn Rate**: `2000 - (level × 30)` ms, minimum 800ms

### Example Progression

| Level | Target | Range | Speed | Spawn Rate |
|-------|--------|-------|-------|------------|
| 1     | 10     | ±3    | 105   | 1970ms     |
| 5     | 45     | ±4    | 125   | 1850ms     |
| 10    | 84     | ±5    | 150   | 1700ms     |
| 50    | 299    | ±13   | 350   | 500ms      |

## Game States

### Ant States

1. **Seeking** (C < T): Blue sack, normal speed, looking for positive numbers
2. **Balanced** (C = T): Green sack glow, slight celebration, level complete
3. **Burdened** (C > T): Red sack, 50% speed reduction, needs negative numbers

## Project Structure

```
accumulator-game/
├── src/
│   ├── main.ts          # Entry point
│   ├── config.ts        # Game constants and difficulty formulas
│   ├── GameScene.ts     # Main game scene
│   ├── Ant.ts           # Player character
│   └── FallingNumber.ts # Collectible numbers
├── index.html           # HTML entry
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── vite.config.ts       # Vite config
```

## Future Enhancements

- [ ] Menu scene with instructions
- [ ] Game over on missed critical numbers
- [ ] Local storage for high scores
- [ ] Sound effects and music
- [ ] Particle effects for collections
- [ ] Special numbers (multipliers, freeze, wildcard)
- [ ] Different backgrounds per 10 levels
- [ ] Unlockable ant skins
- [ ] Leaderboard integration

## Philosophy

> "Life as a System of Choices"

The ant represents the individual navigating life's experiences (numbers). True resilience means having the discipline to accept only what aligns with your purpose—neither more nor less.

## License

MIT
