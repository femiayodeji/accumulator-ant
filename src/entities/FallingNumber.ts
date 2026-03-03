import Phaser from 'phaser';
import { GAME_FONT, GameConfig } from '../core/config';

export class FallingNumber extends Phaser.GameObjects.Container {
  private static positiveLeafTintIndex: number = 0;
  private static negativeLeafTintIndex: number = 0;
  private static readonly POSITIVE_LEAF_TINTS: number[] = [0x42d96b, 0x9be15d, 0x4cd964, 0xb7e85f];
  private static readonly NEGATIVE_LEAF_TINTS: number[] = [0xff7043, 0xff5c8a, 0xff8a65, 0xef5350];

  public value: number;
  private text!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Image;
  private fallSpeed: number;
  
  constructor(scene: Phaser.Scene, x: number, value: number, fallSpeed: number) {
    super(scene, x, GameConfig.numbers.spawnY);
    
    this.value = value;
    this.fallSpeed = fallSpeed;
    
    this.createVisuals();
    scene.add.existing(this);
    this.setSize(84, 84);
  }
  
  private createVisuals(): void {
    // Drop shadow
    const shadow = this.scene.add.ellipse(4, 6, 54, 38, 0x000000, 0.22);
    this.add(shadow);

    // Leaf background (alternating tint with clear sign contrast)
    const isPositive = this.value >= 0;
    const tintPalette = isPositive
      ? FallingNumber.POSITIVE_LEAF_TINTS
      : FallingNumber.NEGATIVE_LEAF_TINTS;
    const tintIndex = isPositive
      ? FallingNumber.positiveLeafTintIndex++
      : FallingNumber.negativeLeafTintIndex++;
    const tint = tintPalette[tintIndex % tintPalette.length];

    this.background = this.scene.add.image(0, 0, 'leaf-number');
    this.background.setScale(0.22);
    this.background.setTintFill(tint);
    this.background.setRotation(Phaser.Math.DegToRad(isPositive ? -10 : 10));
    this.add(this.background);
    
    // Number text
    const displayValue = this.value >= 0 ? `+${this.value}` : `${this.value}`;
    this.text = this.scene.add.text(0, 0, displayValue, {
      fontSize: '24px',
      fontFamily: GAME_FONT,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: isPositive ? '#145a32' : '#7b1f1f',
      strokeThickness: 5,
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
