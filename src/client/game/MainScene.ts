import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('MainScene');
  }

  create() {
    // Camera & world bounds follow parent size (set in resize handler too)
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0f172a');
    this.physics.world.setBounds(0, 0, Math.max(width, 8000), Math.max(height, 2000));

    // Simple ground
    const ground = this.add.rectangle(0, height - 40, Math.max(width, 2000), 40, 0x334155).setOrigin(0, 0);
    this.physics.add.existing(ground, true);

    // Player sprite (placeholder)
    this.player = this.physics.add.sprite(64, height - 100, undefined as any);
    this.player.setDisplaySize(24, 36).setTint(0xefd81d).setCollideWorldBounds(true);
    this.player.body.setSize(24, 36);

    this.physics.add.collider(this.player, ground as any);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Responsive: listen to resize from Scale Manager
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      // Reposition ground to bottom of new size
      const newHeight = gameSize.height;
      (ground as any).y = newHeight - 40;
      // Expand ground width
      (ground as any).width = Math.max(gameSize.width, 2000);
      (ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    });
  }

  override update(_time: number, _delta: number) {
    const speed = 220;
    const jump = 360;

    // Horizontal movement
    let vx = 0;
    if (this.cursors.left?.isDown) vx = -speed;
    else if (this.cursors.right?.isDown) vx = speed;
    this.player.setVelocityX(vx);

    // Jump
    const onFloor = this.player.body.blocked.down;
    if (onFloor && (this.cursors.up?.isDown || this.cursors.space?.isDown)) {
      this.player.setVelocityY(-jump);
    }

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }
}