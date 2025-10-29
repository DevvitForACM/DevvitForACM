import Phaser from 'phaser';

export interface GameOverUI {
  background?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  restartButton?: Phaser.GameObjects.Container;
}

export interface VictoryUI {
  background?: Phaser.GameObjects.Rectangle;
  title?: Phaser.GameObjects.Text;
  scoreText?: Phaser.GameObjects.Text;
  timeText?: Phaser.GameObjects.Text;
  coinText?: Phaser.GameObjects.Text;
  totalText?: Phaser.GameObjects.Text;
  restartButton?: Phaser.GameObjects.Container;
  menuButton?: Phaser.GameObjects.Container;
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

  buttonBg.on('pointerdown', () => {
    console.log('[GameOver UI] Restart button clicked');
    onRestart();
  });

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

export function showVictory(
  scene: Phaser.Scene,
  timeRemaining: number,
  coinsCollected: number,
  onRestart: () => void,
  onMenu: () => void
): VictoryUI {
  const centerX = scene.cameras.main.width / 2;
  const centerY = scene.cameras.main.height / 2;

  // Calculate score
  const timeBonus = Math.floor(timeRemaining * 10); // 10 points per second
  const coinBonus = coinsCollected * 100; // 100 points per coin
  const totalScore = timeBonus + coinBonus;

  // Background
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

  // Title
  const title = scene.add.text(centerX, centerY - 160, 'VICTORY!', {
    fontSize: '72px',
    color: '#FFD700',
    fontStyle: 'bold',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 8,
  });
  title.setScrollFactor(0);
  title.setDepth(2001);
  title.setOrigin(0.5, 0.5);

  // Score breakdown
  const yStart = centerY - 60;
  const timeText = scene.add.text(
    centerX,
    yStart,
    `Time Bonus: ${timeBonus} pts (${Math.floor(timeRemaining)}s)`,
    {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    }
  );
  timeText.setScrollFactor(0);
  timeText.setDepth(2001);
  timeText.setOrigin(0.5, 0.5);

  const coinText = scene.add.text(
    centerX,
    yStart + 40,
    `Coins: ${coinBonus} pts (${coinsCollected} coins)`,
    {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    }
  );
  coinText.setScrollFactor(0);
  coinText.setDepth(2001);
  coinText.setOrigin(0.5, 0.5);

  // Total score
  const totalText = scene.add.text(
    centerX,
    yStart + 90,
    `Total Score: ${totalScore}`,
    {
      fontSize: '36px',
      color: '#FFD700',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    }
  );
  totalText.setScrollFactor(0);
  totalText.setDepth(2001);
  totalText.setOrigin(0.5, 0.5);

  // Buttons
  const buttonY = centerY + 120;
  
  // Restart button
  const restartContainer = scene.add.container(centerX - 120, buttonY);
  restartContainer.setScrollFactor(0);
  restartContainer.setDepth(2002);

  const restartBg = scene.add.rectangle(0, 0, 180, 50, 0x22c55e);
  restartBg.setInteractive({ useHandCursor: true });

  const restartText = scene.add.text(0, 0, 'Restart', {
    fontSize: '24px',
    color: '#ffffff',
    fontStyle: 'bold',
  });
  restartText.setOrigin(0.5, 0.5);

  restartContainer.add([restartBg, restartText]);

  restartBg.on('pointerover', () => {
    restartBg.setFillStyle(0x16a34a);
    scene.tweens.add({
      targets: restartContainer,
      scale: 1.1,
      duration: 100,
      ease: 'Power2',
    });
  });

  restartBg.on('pointerout', () => {
    restartBg.setFillStyle(0x22c55e);
    scene.tweens.add({
      targets: restartContainer,
      scale: 1.0,
      duration: 100,
      ease: 'Power2',
    });
  });

  restartBg.on('pointerdown', () => {
    console.log('[Victory UI] Restart button clicked');
    onRestart();
  });

  // Menu button
  const menuContainer = scene.add.container(centerX + 120, buttonY);
  menuContainer.setScrollFactor(0);
  menuContainer.setDepth(2002);

  const menuBg = scene.add.rectangle(0, 0, 180, 50, 0x3b82f6);
  menuBg.setInteractive({ useHandCursor: true });

  const menuText = scene.add.text(0, 0, 'Menu', {
    fontSize: '24px',
    color: '#ffffff',
    fontStyle: 'bold',
  });
  menuText.setOrigin(0.5, 0.5);

  menuContainer.add([menuBg, menuText]);

  menuBg.on('pointerover', () => {
    menuBg.setFillStyle(0x2563eb);
    scene.tweens.add({
      targets: menuContainer,
      scale: 1.1,
      duration: 100,
      ease: 'Power2',
    });
  });

  menuBg.on('pointerout', () => {
    menuBg.setFillStyle(0x3b82f6);
    scene.tweens.add({
      targets: menuContainer,
      scale: 1.0,
      duration: 100,
      ease: 'Power2',
    });
  });

  menuBg.on('pointerdown', () => {
    console.log('[Victory UI] Menu button clicked');
    onMenu();
  });

  // Initial animation
  bg.setAlpha(0);
  title.setAlpha(0);
  timeText.setAlpha(0);
  coinText.setAlpha(0);
  totalText.setAlpha(0);
  restartContainer.setAlpha(0);
  menuContainer.setAlpha(0);

  scene.tweens.add({
    targets: [bg, title],
    alpha: 1,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: [timeText, coinText, totalText],
        alpha: 1,
        duration: 300,
        ease: 'Power2',
        delay: 100,
        onComplete: () => {
          scene.tweens.add({
            targets: [restartContainer, menuContainer],
            alpha: 1,
            duration: 300,
            ease: 'Power2',
          });
        },
      });
    },
  });

  return {
    background: bg,
    title,
    scoreText: totalText,
    timeText,
    coinText,
    totalText,
    restartButton: restartContainer,
    menuButton: menuContainer,
  };
}

export function hideVictory(ui: VictoryUI): void {
  if (ui.background) {
    ui.background.destroy();
    delete ui.background;
  }
  if (ui.title) {
    ui.title.destroy();
    delete ui.title;
  }
  if (ui.scoreText) {
    ui.scoreText.destroy();
    delete ui.scoreText;
  }
  if (ui.timeText) {
    ui.timeText.destroy();
    delete ui.timeText;
  }
  if (ui.coinText) {
    ui.coinText.destroy();
    delete ui.coinText;
  }
  if (ui.totalText) {
    ui.totalText.destroy();
    delete ui.totalText;
  }
  if (ui.restartButton) {
    ui.restartButton.destroy();
    delete ui.restartButton;
  }
  if (ui.menuButton) {
    ui.menuButton.destroy();
    delete ui.menuButton;
  }
}

export function createTimerDisplay(
  scene: Phaser.Scene,
  initialTime: number
): Phaser.GameObjects.Text {
  const timerText = scene.add.text(20, 20, `Time: ${initialTime}s`, {
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 10, y: 5 },
    fontStyle: 'bold',
  });
  timerText.setScrollFactor(0);
  timerText.setDepth(1500);
  return timerText;
}

export function createScoreDisplay(scene: Phaser.Scene): Phaser.GameObjects.Text {
  const scoreText = scene.add.text(20, 60, 'Coins: 0', {
    fontSize: '24px',
    color: '#FFD700',
    backgroundColor: '#000000',
    padding: { x: 10, y: 5 },
    fontStyle: 'bold',
  });
  scoreText.setScrollFactor(0);
  scoreText.setDepth(1500);
  return scoreText;
}
