import Phaser from 'phaser';
import type { LevelConfig } from '@/game/level/level-types';

export interface GameOverUI {
  background?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  restartButton?: Phaser.GameObjects.Container;
}

export function showGameOver(
  scene: Phaser.Scene,
  onRestart: () => void
): GameOverUI {
  const centerX = scene.cameras.main.width / 2;
  const centerY = scene.cameras.main.height / 2;

  const bg = scene.add.rectangle(
    centerX,
    centerY,
    scene.cameras.main.width,
    scene.cameras.main.height,
    0x000000,
    0.85
  );
  bg.setScrollFactor(0);
  bg.setDepth(2000);
  bg.setOrigin(0.5, 0.5);

  const text = scene.add.text(centerX, centerY - 60, 'GAME OVER', {
    fontSize: '64px',
    color: '#ff3333',
    fontStyle: 'bold',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 6,
  });
  text.setScrollFactor(0);
  text.setDepth(2001);
  text.setOrigin(0.5, 0.5);

  const buttonContainer = scene.add.container(centerX, centerY + 60);
  buttonContainer.setScrollFactor(0);
  buttonContainer.setDepth(2002);

  const buttonBg = scene.add.rectangle(0, 0, 200, 60, 0x22c55e);
  buttonBg.setInteractive({ useHandCursor: true });

  const buttonText = scene.add.text(0, 0, 'Restart', {
    fontSize: '28px',
    color: '#ffffff',
    fontStyle: 'bold',
  });
  buttonText.setOrigin(0.5, 0.5);

  buttonContainer.add([buttonBg, buttonText]);

  buttonBg.on('pointerover', () => {
    buttonBg.setFillStyle(0x16a34a);
    scene.tweens.add({
      targets: buttonContainer,
      scale: 1.1,
      duration: 100,
      ease: 'Power2',
    });
  });

  buttonBg.on('pointerout', () => {
    buttonBg.setFillStyle(0x22c55e);
    scene.tweens.add({
      targets: buttonContainer,
      scale: 1.0,
      duration: 100,
      ease: 'Power2',
    });
  });

  buttonBg.on('pointerdown', onRestart);

  bg.setAlpha(0);
  text.setAlpha(0);
  buttonContainer.setAlpha(0);

  scene.tweens.add({
    targets: [bg, text, buttonContainer],
    alpha: 1,
    duration: 300,
    ease: 'Power2',
  });

  return { background: bg, text, restartButton: buttonContainer };
}

export function hideGameOver(ui: GameOverUI): void {
  if (ui.background) {
    ui.background.destroy();
    delete ui.background;
  }
  if (ui.text) {
    ui.text.destroy();
    delete ui.text;
  }
  if (ui.restartButton) {
    ui.restartButton.destroy();
    delete ui.restartButton;
  }
}

export function showLevelComplete(
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  playerBody: Phaser.Physics.Arcade.Body,
  levelConfig: LevelConfig
): void {
  playerBody.setVelocity(0, 0);
  playerBody.allowGravity = false;

  const centerX = scene.cameras.main.worldView.centerX;
  const centerY = scene.cameras.main.worldView.centerY;

  const bg = scene.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.8);
  bg.setScrollFactor(0);
  bg.setDepth(1000);
  bg.setOrigin(0.5, 0.5);

  const text = scene.add.text(centerX, centerY, 'Level Finished!', {
    fontSize: '48px',
    color: '#00ff00',
    fontStyle: 'bold',
    align: 'center',
  });
  text.setScrollFactor(0);
  text.setDepth(1001);
  text.setOrigin(0.5, 0.5);

  scene.tweens.add({
    targets: text,
    scale: 1.1,
    duration: 500,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      const startX = levelConfig.playerStartX ?? 50;
      const startY = levelConfig.playerStartY ?? 100;
      player.setPosition(startX, startY);
      playerBody.setVelocity(0, 0);
      playerBody.allowGravity = true;

      bg.destroy();
      text.destroy();
    },
  });
}
