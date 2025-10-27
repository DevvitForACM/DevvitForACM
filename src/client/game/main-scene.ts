import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('MainScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0f172a');
    this.physics.world.setBounds(
      0,
      0,
      Math.max(width, 8000),
      Math.max(height, 2000)
    );

    const ground = this.add
      .rectangle(0, height - 40, Math.max(width, 2000), 40, 0x334155)
      .setOrigin(0, 0);
    this.physics.add.existing(ground, true);

    this.player = this.physics.add.sprite(
      64,
      height - 100,
      undefined as unknown as string
    );
    this.player
      .setDisplaySize(24, 36)
      .setTint(0xefd81d)
      .setCollideWorldBounds(true);
    this.player.body.setSize(24, 36);

    this.physics.add.collider(
      this.player,
      ground as Phaser.GameObjects.GameObject
    );

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const newHeight = gameSize.height;
      (ground as Phaser.GameObjects.Rectangle).y = newHeight - 40;

      (ground as Phaser.GameObjects.Rectangle).width = Math.max(
        gameSize.width,
        2000
      );
      (ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    });
  }

  override update(_time: number, _delta: number) {
    const speed = 220;
    const jump = 360;

    let vx = 0;
    if (this.cursors.left?.isDown) vx = -speed;
    else if (this.cursors.right?.isDown) vx = speed;
    this.player.setVelocityX(vx);

    const onFloor = this.player.body.blocked.down;
    if (onFloor && (this.cursors.up?.isDown || this.cursors.space?.isDown)) {
      this.player.setVelocityY(-jump);
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }
}
