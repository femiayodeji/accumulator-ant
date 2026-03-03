import Phaser from 'phaser';
import { GAME_FONT } from '../core/config';
import { startAntsTransition } from '../transitions/SceneTransition';
import { UiSfx } from '../audio/UiSfx';
import { trackEvent, trackScreenView } from '../analytics/telemetry';
import { registerSceneBackNavigation } from '../navigation/backNavigation';

export class PhilosophyScene extends Phaser.Scene {
  private contentContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastPointerY: number = 0;

  constructor() {
    super({ key: 'PhilosophyScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    trackScreenView('PhilosophyScene');
    registerSceneBackNavigation(this, { fallbackScene: 'StartScene' });

    this.cameras.main.setBackgroundColor(0x1a252f);
    this.cameras.main.fadeIn(300);

    // Back button (top-left)
    const back = this.add.text(20, 20, '← BACK', {
      fontSize: '16px',
      fontFamily: GAME_FONT,
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#f39c12'));
    back.on('pointerout', () => back.setColor('#ecf0f1'));
    back.on('pointerup', () => {
      UiSfx.unlock();
      UiSfx.playClick();
      trackEvent('philosophy_back_clicked');
      startAntsTransition(this, 'StartScene');
    });
    back.setDepth(10);

    // Scrollable content container
    this.contentContainer = this.add.container(0, 0);
    const margin = Math.max(24, w * 0.08);
    const textWidth = w - margin * 2;
    let yPos = 65;

    // Title
    yPos = this.addHeading('Game Philosophy', w / 2, yPos, '#f39c12', '30px');
    yPos += 10;

    // Decorative line
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0xf39c12, 0.4);
    lineGfx.lineBetween(margin, yPos, w - margin, yPos);
    this.contentContainer.add(lineGfx);
    yPos += 20;

    // Opening philosophy
    const quote = this.add.text(w / 2, yPos, '"Life as a System of Choices"', {
      fontSize: '18px',
      fontFamily: GAME_FONT,
      color: '#f39c12',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: textWidth },
    });
    quote.setOrigin(0.5, 0);
    this.contentContainer.add(quote);
    yPos += quote.height + 12;

    const quoteBody = this.add.text(w / 2, yPos, [
      'The ant represents the individual navigating',
      'life\'s experiences. True resilience means having',
      'the discipline to accept only what aligns with',
      'your purpose — neither more nor less.',
    ].join('\n'), {
      fontSize: '14px',
      fontFamily: GAME_FONT,
      color: '#95a5a6',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: textWidth },
    });
    quoteBody.setOrigin(0.5, 0);
    this.contentContainer.add(quoteBody);
    yPos += quoteBody.height + 24;

    // ── Educational Goals ──
    yPos = this.addHeading('🎓 Educational Goals', w / 2, yPos, '#3498db', '22px');
    yPos += 8;

    const educationalGoals = [
      ['Mental Arithmetic', 'Practice addition and subtraction in real-time'],
      ['Strategic Thinking', 'Plan ahead based on your current state'],
      ['Precision', 'Understand the importance of exactness'],
      ['Balance', 'Learn that "more" isn\'t always better'],
    ];
    yPos = this.addCardList(educationalGoals, margin, yPos, textWidth, '#2980b9');
    yPos += 20;

    // ── Life Lessons ──
    yPos = this.addHeading('🌱 Life Lessons', w / 2, yPos, '#27ae60', '22px');
    yPos += 8;

    const lifeLessons = [
      ['Discipline', 'Choose what serves your purpose'],
      ['Consequence', 'Excess creates burden — overflow slows you down'],
      ['Resilience', 'Sometimes you need "negative" experiences to correct course'],
      ['Intentionality', 'Every choice matters'],
    ];
    yPos = this.addCardList(lifeLessons, margin, yPos, textWidth, '#1e8449');
    yPos += 20;

    // ── Core Insights ──
    yPos = this.addHeading('✨ Core Insights', w / 2, yPos, '#f39c12', '22px');
    yPos += 8;

    const coreInsights = [
      ['Reframes negatives', 'When overloaded, negative numbers become desirable'],
      ['Delayed gratification', 'Sometimes you skip good things to stay on target'],
      ['Opportunity cost', 'Every catch has consequences'],
      ['Growth mindset', 'Failure is a learning experience, not a setback'],
    ];
    yPos = this.addCardList(coreInsights, margin, yPos, textWidth, '#d68910');
    yPos += 30;

    yPos += 60;

    // Calculate scroll bounds
    this.maxScroll = Math.max(0, yPos - h);
    this.scrollY = 0;

    // Set up scroll/drag input
    this.setupScrollInput();

    // Responsive
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.scene.restart());
  }

  private addHeading(text: string, x: number, y: number, color: string, fontSize: string): number {
    const heading = this.add.text(x, y, text, {
      fontSize,
      fontFamily: GAME_FONT,
      color,
      fontStyle: 'bold',
    });
    heading.setOrigin(0.5, 0);
    this.contentContainer.add(heading);
    return y + heading.height;
  }

  private addCardList(
    items: string[][],
    marginX: number,
    startY: number,
    cardWidth: number,
    accentColor: string,
  ): number {
    let y = startY;
    const colorNum = Phaser.Display.Color.HexStringToColor(accentColor).color;

    for (const [title, desc] of items) {
      const cardH = 52;
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(marginX, y, cardWidth, cardH, 10);
      // accent bar
      bg.fillStyle(colorNum, 1);
      bg.fillRoundedRect(marginX, y, 5, cardH, { tl: 10, bl: 10, tr: 0, br: 0 });
      this.contentContainer.add(bg);

      const titleText = this.add.text(marginX + 16, y + 8, title, {
        fontSize: '15px',
        fontFamily: GAME_FONT,
        color: '#ecf0f1',
        fontStyle: 'bold',
      });
      this.contentContainer.add(titleText);

      const descText = this.add.text(marginX + 16, y + 28, desc, {
        fontSize: '12px',
        fontFamily: GAME_FONT,
        color: '#95a5a6',
        wordWrap: { width: cardWidth - 32 },
      });
      this.contentContainer.add(descText);

      y += cardH + 8;
    }

    return y;
  }

  private setupScrollInput(): void {
    // Mouse wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
      this.contentContainer.y = -this.scrollY;
    });

    // Touch drag scroll
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 55) {
        this.isDragging = true;
        this.lastPointerY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dy = this.lastPointerY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, 0, this.maxScroll);
        this.contentContainer.y = -this.scrollY;
        this.lastPointerY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }
}
