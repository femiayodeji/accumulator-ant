import Phaser from 'phaser';
import { GameConfig } from '../core/config';

export type AntState = 'seeking' | 'balanced' | 'burdened';

export class Ant extends Phaser.GameObjects.Container {
  private antSprite!: Phaser.GameObjects.Image;
  private sack!: Phaser.GameObjects.Ellipse;
  private antBaseScale: number = 0.32;
  
  private currentState: AntState = 'seeking';
  public baseSpeed: number = GameConfig.ant.baseSpeed;
  public currentSpeed: number = this.baseSpeed;
  private baseY: number;
  private minX: number = 40;
  private maxX: number = GameConfig.width - 40;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.baseY = y;
    
    this.createAntParts();
    scene.add.existing(this);
    this.setSize(172, 126);
  }
  
  private createAntParts(): void {
    this.antSprite = this.scene.add.image(0, -4, 'ant-gameplay');
    this.antSprite.setOrigin(0.5, 0.5);
    this.antSprite.setScale(this.antBaseScale);
    this.antSprite.setAngle(0);
    this.antSprite.setAlpha(0.98);
    this.add(this.antSprite);

    const sackFill = this.shadeColor(GameConfig.colors.antBody, -6);
    this.sack = this.scene.add.ellipse(0, -2, 16, 12, sackFill, 0.9);
    this.sack.setStrokeStyle(2, GameConfig.colors.sackSeeking);
    this.add(this.sack);
  }
  
  updateState(current: number, target: number): void {
    const diff = target - current;
    
    if (diff === 0) {
      this.applyState('balanced');
    } else if (diff > 0) {
      this.applyState('seeking');
    } else {
      this.applyState('burdened');
    }
    
    this.updateSackVisual(current, target);
  }
  
  private applyState(state: AntState): void {
    if (this.currentState === state) return;
    
    this.currentState = state;
    
    switch (state) {
      case 'balanced':
        this.currentSpeed = this.baseSpeed * 0.9;
        this.setAntennaAngle(-40);
        this.applyVerticalOffset(-5);
        this.antSprite.setScale(this.antBaseScale * 0.99);
        break;
        
      case 'seeking':
        this.currentSpeed = this.baseSpeed;
        this.setAntennaAngle(-35);
        this.applyVerticalOffset(2);
        this.antSprite.setScale(this.antBaseScale);
        break;
        
      case 'burdened':
        this.currentSpeed = this.baseSpeed * 0.5;
        this.setAntennaAngle(-10);
        this.applyVerticalOffset(10);
        this.antSprite.setScale(this.antBaseScale * 1.03);
        break;
    }
  }

  private applyVerticalOffset(offset: number): void {
    this.y = this.baseY + offset;
  }
  
  private setAntennaAngle(angle: number): void {
    void angle;
  }
  
  private updateSackVisual(current: number, target: number): void {
    const ratio = target > 0 ? current / target : 1;
    const scale = Math.max(0.4, Math.min(ratio, 1.8));
    
    this.sack.setScale(scale * 0.95);
    this.sack.setPosition((scale - 1) * 1, -2 + (scale - 1) * 2);
    
    // Color based on state
    let color: number;
    if (ratio === 1) {
      color = GameConfig.colors.sackBalanced;
    } else if (ratio < 1) {
      color = GameConfig.colors.sackSeeking;
    } else {
      color = GameConfig.colors.sackBurdened;
    }
    
    this.sack.setStrokeStyle(3, color);
    
    // Add glow effect when balanced
    if (this.currentState === 'balanced') {
      this.sack.setStrokeStyle(4, color);
    }
  }

  private shadeColor(color: number, amount: number): number {
    const rgb = Phaser.Display.Color.IntegerToRGB(color);
    const clamp = (value: number): number => Phaser.Math.Clamp(value, 0, 255);
    const r = clamp(rgb.r + amount);
    const g = clamp(rgb.g + amount);
    const b = clamp(rgb.b + amount);
    return Phaser.Display.Color.GetColor(r, g, b);
  }
  
  moveLeft(delta: number): void {
    const newX = this.x - (this.currentSpeed * delta / 1000);
    this.x = Math.max(this.minX, newX);
  }
  
  moveRight(delta: number): void {
    const newX = this.x + (this.currentSpeed * delta / 1000);
    this.x = Math.min(this.maxX, newX);
  }

  moveToX(x: number): void {
    this.x = Phaser.Math.Clamp(x, this.minX, this.maxX);
  }

  setMovementBounds(minX: number, maxX: number): void {
    this.minX = minX;
    this.maxX = maxX;
    this.moveToX(this.x);
  }

  setBaseY(y: number): void {
    this.baseY = y;
    this.applyState(this.currentState);
  }
  
  getState(): AntState {
    return this.currentState;
  }
}
