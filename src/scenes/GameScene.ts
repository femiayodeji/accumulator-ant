import Phaser from 'phaser';
import { Ant } from '../entities/Ant';
import { FallingNumber } from '../entities/FallingNumber';
import { GameSfx } from '../audio/GameSfx';
import { GAME_FONT, DifficultySystem, LevelStatsStorage } from '../core/config';
import { startAntsTransition } from '../transitions/SceneTransition';
import { UiSfx } from '../audio/UiSfx';
import { trackEvent, trackScreenView } from '../analytics/telemetry';
import { registerSceneBackNavigation } from '../navigation/backNavigation';

export class GameScene extends Phaser.Scene {
  private static readonly LEVEL_STORAGE_KEY = 'accumulator.currentLevel';
  private static readonly MAX_LEVEL_STORAGE_KEY = 'accumulator.maxLevel';
  private static readonly MOBILE_CONTROL_CLEARANCE = 72;

  private ant!: Ant;
  private sfx!: GameSfx;
  private numbers: FallingNumber[] = [];
  
  private currentTotal: number = 0;
  private targetTotal: number = 0;
  private currentLevel: number = 1;
  
  private targetText!: Phaser.GameObjects.Text;
  private currentText!: Phaser.GameObjects.Text;
  private equilibriumCheckText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  
  private spawnTimer: number = 0;
  private spawnRate: number = 2000;
  private levelCompleting: boolean = false;
  
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private dragTargetX: number | null = null;
  private readonly dragSmoothing: number = 16;
  private isPointerDraggingAnt: boolean = false;
  private activeDragPointerId: number | null = null;
  private readonly antDragGrabRadius: number = 68;
  private collectedNumbers: number[] = [];
  private levelStartTime: number = 0;
  private wasOverflowing: boolean = false;
  private wasAligned: boolean = false;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create(data?: { level?: number; target?: number }): void {
    trackScreenView('GameScene');
    registerSceneBackNavigation(this, { fallbackScene: 'LevelScene' });

    // Gradient background
    this.drawGradientBackground();
    this.cameras.main.fadeIn(300);

    // Determine starting level
    const startLevel = data?.level ?? this.loadCurrentLevel();
    const fixedTarget = data?.target;
    
    // Create ant
    this.ant = new Ant(this, this.scale.width / 2, this.getAntBaseY());
    this.ant.setMovementBounds(40, this.scale.width - 40);
    this.sfx = new GameSfx();
    
    // Setup UI
    this.createUI();
    
    // Setup controls
    this.setupControls();

    // Initial layout and responsive resize handling
    this.layoutUI();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.input.keyboard?.on('keydown', () => {
      this.sfx.unlock();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sfx.destroy();
    });

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.sfx.destroy();
    });
    
    // Start from saved level (or level 1)
    this.startLevel(startLevel, fixedTarget);
  }
  
  private createUI(): void {
    // Quit / back button (top-left corner)
    this.createQuitButton();

    // Target display (below quit button)
    this.targetText = this.add.text(20, 50, 'TARGET: 0', {
      fontSize: '24px',
      fontFamily: GAME_FONT,
      color: '#00b894',
      fontStyle: 'bold',
      stroke: '#004d40',
      strokeThickness: 4,
    });
    
    // Level display (top right)
    this.levelText = this.add.text(this.scale.width - 20, 20, 'LEVEL 1', {
      fontSize: '20px',
      fontFamily: GAME_FONT,
      color: '#2c3e50',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
    });
    this.levelText.setOrigin(1, 0);
    
    // Current total (above ant)
    this.currentText = this.add.text(this.scale.width / 2, this.scale.height - 110, 'CURRENT: 0', {
      fontSize: '20px',
      fontFamily: GAME_FONT,
      color: '#ff4757',
      fontStyle: 'bold',
      stroke: '#3d0c0c',
      strokeThickness: 2,
    });
    this.currentText.setOrigin(0.5, 0.5);

    this.equilibriumCheckText = this.add.text(this.scale.width / 2 + 84, this.scale.height - 110, '✔', {
      fontSize: '28px',
      fontFamily: GAME_FONT,
      color: '#2ecc71',
      fontStyle: 'bold',
      stroke: '#145a32',
      strokeThickness: 3,
    });
    this.equilibriumCheckText.setOrigin(0.5, 0.5);
    this.equilibriumCheckText.setVisible(false);
    
    // Hint text (dynamic guidance)
    this.hintText = this.add.text(this.scale.width / 2, this.scale.height - 70, '', {
      fontSize: '14px',
      fontFamily: GAME_FONT,
      color: '#34495e',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
    });
    this.hintText.setOrigin(0.5, 0.5);
  }

  private createQuitButton(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(14, 10, 36, 30, 8);
    bg.fillStyle(0xe74c3c, 1);
    bg.fillRoundedRect(12, 8, 36, 30, 8);

    const icon = this.add.text(30, 23, '✕', {
      fontSize: '18px',
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    icon.setOrigin(0.5);
    icon.setDepth(1);

    const hitZone = this.add.rectangle(30, 23, 44, 38, 0x000000, 0);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => icon.setColor('#f5b7b1'));
    hitZone.on('pointerout', () => icon.setColor('#ffffff'));
    hitZone.on('pointerup', () => {
      UiSfx.unlock();
      UiSfx.playClick();
      trackEvent('game_quit_clicked', {
        level: this.currentLevel,
        current_total: this.currentTotal,
        target_total: this.targetTotal,
      });
      startAntsTransition(this, 'LevelScene');
    });
  }
  
  private setupControls(): void {
    // Keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Forgiving horizontal pointer drag (touch + mouse)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.sfx.unlock();
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.ant.x, this.ant.y);
      if (distance <= this.antDragGrabRadius) {
        this.isPointerDraggingAnt = true;
        this.activeDragPointerId = pointer.id;
        this.dragTargetX = pointer.x;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerDraggingAnt && this.activeDragPointerId === pointer.id) {
        this.dragTargetX = pointer.x;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.activeDragPointerId === pointer.id) {
        this.isPointerDraggingAnt = false;
        this.activeDragPointerId = null;
        this.dragTargetX = null;
      }
    });

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      if (this.activeDragPointerId === pointer.id) {
        this.isPointerDraggingAnt = false;
        this.activeDragPointerId = null;
        this.dragTargetX = null;
      }
    });
  }

  private getAntBaseY(): number {
    return this.scale.height - 68 - this.getBottomControlPadding();
  }

  private getBottomControlPadding(): number {
    const touchCapable = this.sys.game.device.input.touch;
    const smallViewport = this.scale.width <= 900 && this.scale.height <= 1100;
    if (!touchCapable && !smallViewport) {
      return 0;
    }

    const visualViewportInset = window.visualViewport
      ? Math.max(0, window.innerHeight - window.visualViewport.height)
      : 0;

    const baseClearance = GameScene.MOBILE_CONTROL_CLEARANCE;
    const maxExtra = Math.floor(this.scale.height * 0.2);
    return Phaser.Math.Clamp(baseClearance + Math.round(visualViewportInset), 0, maxExtra);
  }

  private layoutUI(): void {
    const width = this.scale.width;
    const antBaseY = this.getAntBaseY();

    this.ant.setBaseY(antBaseY);
    this.ant.setMovementBounds(40, width - 40);

    this.targetText.setPosition(20, 50);
    this.levelText.setPosition(width - 20, 20);
    this.currentText.setPosition(width / 2, this.scale.height / 2 - 18);
    this.hintText.setPosition(this.currentText.x, this.currentText.y + 28);
    this.equilibriumCheckText.setPosition(this.currentText.x + this.currentText.width / 2 + 24, this.currentText.y);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.layoutUI();
  }
  
  private startLevel(level: number, fixedTarget?: number): void {
    this.currentLevel = level;
    this.currentTotal = 0;
    this.targetTotal = fixedTarget ?? DifficultySystem.getTarget(level);
    this.spawnRate = DifficultySystem.getSpawnRate(level);
    this.levelCompleting = false;
    this.wasOverflowing = false;
    this.wasAligned = false;
    this.collectedNumbers = [];
    this.levelStartTime = Date.now();
    const range = DifficultySystem.getNumberRange(level);
    
    // Clear existing numbers
    this.numbers.forEach(num => num.destroy());
    this.numbers = [];
    
    // Update UI
    this.updateUI();

    // Persist latest reachable level
    this.saveCurrentLevel(level);

    trackEvent('level_started', {
      level,
      target_total: this.targetTotal,
      spawn_rate_ms: this.spawnRate,
      number_min: range.min,
      number_max: range.max,
    });
    
    console.log(`Level ${level} started - Target: ${this.targetTotal}`);
  }
  
  private updateUI(): void {
    this.targetText.setText(`TARGET: ${this.targetTotal}`);
    this.currentText.setText(`CURRENT: ${this.currentTotal}`);
    this.levelText.setText(`LEVEL ${this.currentLevel}`);

    const checkX = this.currentText.x + this.currentText.width / 2 + 24;
    const checkY = this.currentText.y;
    this.equilibriumCheckText.setPosition(checkX, checkY);
    this.hintText.setPosition(this.currentText.x, this.currentText.y + 28);
    
    // Update ant state
    this.ant.updateState(this.currentTotal, this.targetTotal);
    
    // Update hint text
    const diff = this.targetTotal - this.currentTotal;
    const isAligned = diff === 0;
    if (isAligned) {
      this.hintText.setText('ALIGNED! 🎯');
      this.hintText.setColor('#27ae60');
    } else if (diff > 0) {
      this.hintText.setText(`Seek: +${diff}`);
      this.hintText.setColor('#3498db');
    } else {
      this.hintText.setText(`Release: ${diff}`);
      this.hintText.setColor('#e74c3c');
    }

    if (isAligned) {
      this.equilibriumCheckText.setVisible(true);
      if (!this.wasAligned) {
        this.equilibriumCheckText.setScale(0.65);
        this.equilibriumCheckText.setAlpha(0.6);
        this.tweens.add({
          targets: this.equilibriumCheckText,
          scale: 1,
          alpha: 1,
          ease: 'Back.easeOut',
          duration: 240,
        });
        this.sfx.playEquilibriumChime();
        this.spawnEquilibriumBurst(checkX, checkY);
      }
    } else {
      this.equilibriumCheckText.setVisible(false);
      this.equilibriumCheckText.setAlpha(1);
      this.equilibriumCheckText.setScale(1);
    }

    this.wasAligned = isAligned;

    const isOverflowing = this.currentTotal > this.targetTotal;
    if (!this.wasOverflowing && isOverflowing) {
      trackEvent('overflow_entered', {
        level: this.currentLevel,
        current_total: this.currentTotal,
        target_total: this.targetTotal,
      });
    }

    if (this.wasOverflowing && !isOverflowing) {
      trackEvent('overflow_cleared', {
        level: this.currentLevel,
        current_total: this.currentTotal,
        target_total: this.targetTotal,
      });
    }

    this.wasOverflowing = isOverflowing;
  }

  private spawnEquilibriumBurst(x: number, y: number): void {
    const colors = [0x2ecc71, 0x58d68d, 0x27ae60, 0x82e0aa, 0xc8f7c5];
    const emitWave = (count: number, minDistance: number, maxDistance: number): void => {
      for (let i = 0; i < count; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(minDistance, maxDistance);
        const size = Phaser.Math.Between(4, 9);
        const color = Phaser.Utils.Array.GetRandom(colors);
        const tx = x + Math.cos(angle) * distance;
        const ty = y + Math.sin(angle) * distance - Phaser.Math.Between(16, 52);
        const useRect = Math.random() < 0.65;
        const particle = useRect
          ? this.add.rectangle(x, y, size * 1.4, size * 0.9, color, 1)
          : this.add.circle(x, y, size * 0.7, color, 1);

        particle.setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));
        particle.setDepth(18);

        this.tweens.add({
          targets: particle,
          x: tx,
          y: ty,
          alpha: 0,
          scaleX: 0.15,
          scaleY: 0.15,
          rotation: particle.rotation + Phaser.Math.FloatBetween(-3.2, 3.2),
          duration: Phaser.Math.Between(620, 980),
          ease: 'Quart.easeOut',
          onComplete: () => particle.destroy(),
        });
      }
    };

    const flash = this.add.circle(x, y, 14, 0x7dff9e, 0.65);
    flash.setDepth(17);
    this.tweens.add({
      targets: flash,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    const ring = this.add.circle(x, y, 10, 0x000000, 0);
    ring.setStrokeStyle(4, 0x2ecc71, 0.95);
    ring.setDepth(17);
    this.tweens.add({
      targets: ring,
      scaleX: 4.8,
      scaleY: 4.8,
      alpha: 0,
      duration: 460,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy(),
    });

    emitWave(34, 46, 130);
    this.time.delayedCall(90, () => emitWave(24, 42, 112));
    this.cameras.main.shake(110, 0.0016, true);
  }
  
  private spawnNumber(): void {
    const range = DifficultySystem.getNumberRange(this.currentLevel);
    const fallSpeed = DifficultySystem.getFallSpeed(this.currentLevel);
    
    // Generate random number within range (excluding 0)
    let value: number;
    do {
      value = Phaser.Math.Between(range.min, range.max);
    } while (value === 0);
    
    // Random X position
    const minX = Math.max(40, Math.floor(this.scale.width * 0.12));
    const maxX = Math.min(this.scale.width - 40, Math.floor(this.scale.width * 0.88));
    const x = Phaser.Math.Between(minX, maxX);
    
    const number = new FallingNumber(this, x, value, fallSpeed);
    this.numbers.push(number);
  }
  
  private checkCollisions(): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const number = this.numbers[i];
      
      // Simple collision detection
      const distance = Phaser.Math.Distance.Between(
        this.ant.x, this.ant.y,
        number.x, number.y
      );
      
      if (distance < 40) {
        // Collect the number
        this.collectNumber(number, i);
      }
    }
  }
  
  private collectNumber(number: FallingNumber, index: number): void {
    this.currentTotal += number.value;
    this.collectedNumbers.push(number.value);
    this.ant.playCatchImpact();
    if (number.value >= 0) {
      this.sfx.playTopUp();
    } else {
      this.sfx.playTopDown();
    }
    
    // Play collection animation
    number.playCollectAnimation(() => {
      number.destroy();
    });
    
    // Remove from array
    this.numbers.splice(index, 1);
    
    // Update UI
    this.updateUI();

    trackEvent('number_collected', {
      level: this.currentLevel,
      value: number.value,
      current_total: this.currentTotal,
      target_total: this.targetTotal,
      collection_count: this.collectedNumbers.length,
    });
    
    // Check win condition
    this.checkWinCondition();
  }
  
  private checkWinCondition(): void {
    if (this.currentTotal === this.targetTotal && !this.levelCompleting) {
      this.levelCompleting = true;
      this.clearFallingNumbers();
      this.sfx.playLevelComplete();

      // Level complete!
      this.time.delayedCall(500, () => {
        this.onLevelComplete();
      });
    }
  }

  private clearFallingNumbers(): void {
    this.numbers.forEach(num => num.destroy());
    this.numbers = [];
    this.spawnTimer = 0;
  }
  
  private onLevelComplete(): void {
    const nextLevel = this.currentLevel + 1;
    this.saveCurrentLevel(nextLevel);
    this.saveMaxLevel(nextLevel);

    // Save run stats
    const elapsedSec = Math.round(((Date.now() - this.levelStartTime) / 1000) * 10) / 10;
    const isNewBest = LevelStatsStorage.save(
      this.currentLevel, [...this.collectedNumbers], elapsedSec, this.targetTotal,
    );

    trackEvent('level_completed', {
      level: this.currentLevel,
      elapsed_seconds: elapsedSec,
      number_count: this.collectedNumbers.length,
      target_total: this.targetTotal,
      is_new_best: isNewBest,
    });

    const w = this.scale.width;
    const h = this.scale.height;

    // Dim overlay
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.35);
    overlay.setDepth(50);

    // "LEVEL X COMPLETE!"
    const title = this.add.text(w / 2, h * 0.3, `LEVEL ${this.currentLevel}\nCOMPLETE!`, {
      fontSize: '34px',
      fontFamily: GAME_FONT,
      color: '#27ae60',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#0a3d2e',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(51);
    this.tweens.add({ targets: title, scale: 1.12, duration: 400, yoyo: true, ease: 'Back.easeOut' });

    // Time + new best indicator
    const timeLabel = `\u23F1 ${elapsedSec.toFixed(1)}s${isNewBest ? '   \u2605 NEW BEST!' : ''}`;
    const timeLine = this.add.text(w / 2, h * 0.52, timeLabel, {
      fontSize: '20px',
      fontFamily: GAME_FONT,
      color: isNewBest ? '#f1c40f' : '#ecf0f1',
      fontStyle: 'bold',
      stroke: '#1a252f',
      strokeThickness: 2,
    });
    timeLine.setOrigin(0.5);
    timeLine.setDepth(51);

    // Numbers collected
    const numStr = LevelStatsStorage.formatNumbers(this.collectedNumbers);
    const numLine = this.add.text(w / 2, h * 0.63, numStr, {
      fontSize: '14px',
      fontFamily: GAME_FONT,
      color: '#bdc3c7',
      align: 'center',
      wordWrap: { width: w - 40 },
      stroke: '#1a252f',
      strokeThickness: 1,
    });
    numLine.setOrigin(0.5);
    numLine.setDepth(51);

    // Sum line
    const sumLine = this.add.text(w / 2, h * 0.73, `= ${this.targetTotal}`, {
      fontSize: '22px',
      fontFamily: GAME_FONT,
      color: '#1abc9c',
      fontStyle: 'bold',
      stroke: '#0a3d2e',
      strokeThickness: 2,
    });
    sumLine.setOrigin(0.5);
    sumLine.setDepth(51);

    // Transition to level screen
    this.time.delayedCall(3500, () => {
      overlay.destroy();
      title.destroy();
      timeLine.destroy();
      numLine.destroy();
      sumLine.destroy();
      startAntsTransition(this, 'LevelScene');
    });
  }

  private drawGradientBackground(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const gfx = this.add.graphics();
    const steps = 32;
    const topColor = Phaser.Display.Color.ValueToColor(0xa8d8ea);
    const bottomColor = Phaser.Display.Color.ValueToColor(0x73c8a9);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        topColor, bottomColor, 1, t,
      );
      const rgb = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      gfx.fillStyle(rgb, 1);
      gfx.fillRect(0, Math.floor(t * h), w, Math.ceil(h / steps) + 1);
    }
  }

  private saveCurrentLevel(level: number): void {
    try {
      const previousCurrent = this.loadCurrentLevel();
      const previousMax = this.loadMaxLevel();
      const highest = Math.max(previousCurrent, previousMax);
      window.localStorage.setItem(GameScene.MAX_LEVEL_STORAGE_KEY, String(highest));
      window.localStorage.setItem(GameScene.LEVEL_STORAGE_KEY, String(level));
    } catch {
      // Ignore storage failures (private mode/quota)
    }
  }

  private saveMaxLevel(level: number): void {
    try {
      const existing = this.loadMaxLevel();
      const highest = Math.max(existing, level);
      window.localStorage.setItem(GameScene.MAX_LEVEL_STORAGE_KEY, String(highest));
    } catch {
      // Ignore storage failures (private mode/quota)
    }
  }

  private loadCurrentLevel(): number {
    try {
      const saved = window.localStorage.getItem(GameScene.LEVEL_STORAGE_KEY);
      const parsed = Number(saved);
      if (Number.isInteger(parsed) && parsed >= 1) {
        return parsed;
      }
    } catch {
      // Ignore storage failures and fallback to level 1
    }

    return 1;
  }

  private loadMaxLevel(): number {
    try {
      const saved = window.localStorage.getItem(GameScene.MAX_LEVEL_STORAGE_KEY);
      const parsed = Number(saved);
      if (Number.isInteger(parsed) && parsed >= 1) {
        return parsed;
      }
    } catch {
      // Ignore storage failures and fallback to 1
    }

    return 1;
  }
  
  update(_time: number, delta: number): void {
    // Handle movement
    if (this.cursors.left.isDown) {
      this.dragTargetX = null;
      this.ant.moveLeft(delta);
    } else if (this.cursors.right.isDown) {
      this.dragTargetX = null;
      this.ant.moveRight(delta);
    } else if (this.dragTargetX !== null) {
      const lerpFactor = 1 - Math.exp(-(this.dragSmoothing * delta) / 1000);
      const smoothedX = Phaser.Math.Linear(this.ant.x, this.dragTargetX, lerpFactor);
      this.ant.moveToX(smoothedX);
    }
    
    // Update falling numbers
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const number = this.numbers[i];
      number.update(delta);
      
      // Remove off-screen numbers
      if (number.isOffScreen()) {
        number.destroy();
        this.numbers.splice(i, 1);
      }
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Spawn new numbers based on timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnTimer = 0;
      
      // Don't spawn if level is complete
      if (this.currentTotal !== this.targetTotal && !this.levelCompleting) {
        this.spawnNumber();
      }
    }
  }
}
