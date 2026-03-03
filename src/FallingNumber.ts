import Phaser from 'phaser';
import { GAME_FONT, GameConfig } from './config';

export class FallingNumber extends Phaser.GameObjects.Container {
  public value: number;
  private text!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Arc;
  private fallSpeed: number;
  
  constructor(scene: Phaser.Scene, x: number, value: number, fallSpeed: number) {
    super(scene, x, GameConfig.numbers.spawnY);
    
    this.value = value;
    this.fallSpeed = fallSpeed;
    
    this.createVisuals();
    scene.add.existing(this);
    this.setSize(50, 50);
  }
  
  private createVisuals(): void {
    // Drop shadow
    const shadow = this.scene.add.circle(2, 2, 26, 0x000000, 0.2);
    this.add(shadow);

    // Background circle
    const color = this.value >= 0 
      ? GameConfig.colors.numberPositive 
      : GameConfig.colors.numberNegative;
    
    this.background = this.scene.add.circle(0, 0, 25, color, 1);
    this.background.setStrokeStyle(4, 0xffffff);
    this.add(this.background);
    
    // Number text
    const displayValue = this.value >= 0 ? `+${this.value}` : `${this.value}`;
    this.text = this.scene.add.text(0, 0, displayValue, {
      fontSize: '22px',
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.text.setOrigin(0.5, 0.5);
    this.add(this.text);
  }
  
  update(delta: number): void {
    this.y += (this.fallSpeed * delta / 1000);
  }
  
  isOffScreen(): boolean {
    return this.y > this.scene.scale.height + 50;
  }
  
  playCollectAnimation(onComplete: () => void): void {
    // Scale up and fade out
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        onComplete();
      }
    });
  }
}
