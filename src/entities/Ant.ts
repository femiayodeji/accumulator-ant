import Phaser from 'phaser';
import { GameConfig } from '../core/config';

export type AntState = 'seeking' | 'balanced' | 'burdened';

export class Ant extends Phaser.GameObjects.Container {
  private abdomen!: Phaser.GameObjects.Ellipse;
  private head!: Phaser.GameObjects.Arc;
  private sack!: Phaser.GameObjects.Ellipse;
  private leftAntenna!: Phaser.GameObjects.Line;
  private rightAntenna!: Phaser.GameObjects.Line;
  private leftEye!: Phaser.GameObjects.Arc;
  private rightEye!: Phaser.GameObjects.Arc;
  
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
    this.setSize(60, 40);
  }
  
  private createAntParts(): void {
    // Abdomen (back section)
    this.abdomen = this.scene.add.ellipse(15, 0, 36, 28, GameConfig.colors.antBody);
    this.abdomen.setStrokeStyle(2, GameConfig.colors.antHead);
    this.add(this.abdomen);
    
    // Sack on back
    this.sack = this.scene.add.ellipse(20, -5, 24, 20, 0xD2B48C);
    this.sack.setStrokeStyle(2, GameConfig.colors.sackSeeking);
    this.add(this.sack);
    
    // Thorax (middle section)
    const thorax = this.scene.add.ellipse(-5, 0, 24, 20, GameConfig.colors.antBody);
    thorax.setStrokeStyle(2, GameConfig.colors.antHead);
    this.add(thorax);
    
    // Head
    this.head = this.scene.add.circle(-20, 0, 12, GameConfig.colors.antHead);
    this.add(this.head);
    
    // Antennae
    this.leftAntenna = this.scene.add.line(0, 0, -22, -8, -35, -22, GameConfig.colors.antHead);
    this.leftAntenna.setLineWidth(2.5);
    this.leftAntenna.setOrigin(0, 0);
    this.add(this.leftAntenna);
    
    this.rightAntenna = this.scene.add.line(0, 0, -18, -8, -28, -22, GameConfig.colors.antHead);
    this.rightAntenna.setLineWidth(2.5);
    this.rightAntenna.setOrigin(0, 0);
    this.add(this.rightAntenna);
    
    // Eyes
    const leftEyeWhite = this.scene.add.circle(-23, -2, 6, 0xffffff);
    const rightEyeWhite = this.scene.add.circle(-17, -2, 6, 0xffffff);
    this.add(leftEyeWhite);
    this.add(rightEyeWhite);
    
    this.leftEye = this.scene.add.circle(-23, -2, 3, 0x2c3e50);
    this.rightEye = this.scene.add.circle(-17, -2, 3, 0x2c3e50);
    this.add(this.leftEye);
    this.add(this.rightEye);
    
    // Legs (simplified)
    const legs = [
      [-15, 10, -20, 20],
      [-8, 10, -10, 20],
      [0, 10, 0, 20],
      [8, 10, 10, 20],
      [15, 10, 18, 20],
    ];
    
    legs.forEach(([x1, y1, x2, y2]) => {
      const leg = this.scene.add.line(0, 0, x1, y1, x2, y2, GameConfig.colors.antHead);
      leg.setLineWidth(3);
      leg.setOrigin(0, 0);
      this.add(leg);
    });
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
        break;
        
      case 'seeking':
        this.currentSpeed = this.baseSpeed;
        this.setAntennaAngle(-35);
        this.applyVerticalOffset(2);
        // Wide eyes
        this.leftEye.setRadius(4);
        this.rightEye.setRadius(4);
        break;
        
      case 'burdened':
        this.currentSpeed = this.baseSpeed * 0.5;
        this.setAntennaAngle(-10);
        this.applyVerticalOffset(10);
        // Squinting eyes
        this.leftEye.setRadius(2);
        this.rightEye.setRadius(2);
        break;
    }
  }

  private applyVerticalOffset(offset: number): void {
    this.y = this.baseY + offset;
  }
  
  private setAntennaAngle(angle: number): void {
    const angleRad = Phaser.Math.DegToRad(angle);
    const length = 18;
    
    this.leftAntenna.setTo(
      -22, -8,
      -22 + Math.cos(angleRad - 0.2) * length,
      -8 + Math.sin(angleRad - 0.2) * length
    );
    
    this.rightAntenna.setTo(
      -18, -8,
      -18 + Math.cos(angleRad + 0.2) * length,
      -8 + Math.sin(angleRad + 0.2) * length
    );
  }
  
  private updateSackVisual(current: number, target: number): void {
    const ratio = target > 0 ? current / target : 1;
    const scale = Math.max(0.4, Math.min(ratio, 1.8));
    
    this.sack.setScale(scale);
    
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
