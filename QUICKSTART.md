# 🚀 Quick Start Guide

## Get It Running in 3 Steps

### 1. Install Dependencies
```bash
cd accumulator-game
npm install
```

This will install:
- Phaser 3.70 (game engine)
- TypeScript 5.3 (language)
- Vite 5.0 (dev server & build tool)

### 2. Start Development Server
```bash
npm run dev
```

Your browser will open automatically at `http://localhost:3000`

### 3. Play!
- **Desktop**: Use arrow keys ← → to move the ant
- **Mobile**: Tap left/right sides of screen

## How to Play

1. Watch numbers fall from the top (blue = positive, orange = negative)
2. Move your ant left/right to catch numbers
3. Your goal: reach the **exact** TARGET sum shown in green at top-left
4. Your CURRENT sum is shown in red above the ant

### Game Philosophy

- **Too low?** Catch positive numbers
- **Too high?** Catch negative numbers to reduce
- **Overloaded?** Your ant slows down (the burden mechanic)
- **Perfect?** Level complete! On to the next challenge

## Controls

### Desktop
- `←` Left Arrow: Move ant left
- `→` Right Arrow: Move ant right

### Mobile/Touch
- Tap **left half** of screen: Move left
- Tap **right half** of screen: Move right

## Difficulty Progression

Each level automatically:
- ✅ Increases target sum
- ✅ Expands number range (bigger +/- values)
- ✅ Speeds up falling numbers
- ✅ Reduces spawn time (more numbers)

The game gets progressively harder using mathematical formulas - truly endless!

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Mobile Testing

To test on your phone:

1. Start dev server: `npm run dev`
2. Find your computer's IP address
3. On your phone, visit: `http://YOUR-IP:3000`

Example: `http://192.168.1.5:3000`

## Next Steps

Once you validate the core mechanics work well, you can add:
- Main menu scene
- Sound effects
- Particle effects
- Local storage for high scores
- More visual polish
- Additional game modes

## Troubleshooting

**Issue**: Game doesn't load
- Check browser console (F12) for errors
- Make sure you ran `npm install` first

**Issue**: Touch controls not working
- Make sure you're on a touch device or using Chrome DevTools device simulation

**Issue**: TypeScript errors
- Try: `npm install` again
- Delete `node_modules` folder and reinstall

## File Structure

```
src/
├── main.ts          → Initializes Phaser game
├── config.ts        → Game constants & difficulty formulas
├── GameScene.ts     → Main game logic
├── Ant.ts           → Player character with states
└── FallingNumber.ts → Falling number objects
```

## Philosophy Reminder

This game teaches:
- **Precision**: Exact targets, no approximations
- **Discipline**: Choose wisely what to accept
- **Consequences**: Excess creates burden
- **Balance**: The goal is equilibrium, not maximum

Enjoy building your game! 🐜✨
