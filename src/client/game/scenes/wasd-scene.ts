import Phaser from 'phaser';

export class WasdScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'WasdScene' });
  }

  preload() {
    this.add
      .text(8, 8, 'WASD to move, space to jump', { color: '#111' })
      .setScrollFactor(0);
  }

  create() {
    const { width, height } = this.scale;

    this.physics.world.setBounds(0, 0, width, height);

    this.ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x222222);
    this.physics.add.existing(this.ground, true);

    const playerRect = this.add.rectangle(100, height - 80, 32, 48, 0xd93900);
    this.player = this.physics.add.existing(playerRect, false) as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setBounce(0.1, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).setDragX(600);

    this.physics.add.collider(this.player, this.ground as unknown as Phaser.GameObjects.GameObject);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Keep world and ground responsive
    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      const newW = gameSize.width;
      const newH = gameSize.height;
      this.physics.world.setBounds(0, 0, newW, newH);
      this.ground.setPosition(newW / 2, newH - 20);
      this.ground.setSize(newW, 40);
      (this.ground.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    });
  }

  override update() {
    const speed = 220;
    const jumpVelocity = -380;

    const left = this.wasd.left.isDown || !!this.cursors.left?.isDown;
    const right = this.wasd.right.isDown || !!this.cursors.right?.isDown;
    const up = this.wasd.up.isDown || !!this.cursors.up?.isDown || !!this.cursors.space?.isDown;

    if (left) {
      this.player.setVelocityX(-speed);
    } else if (right) {
      this.player.setVelocityX(speed);
    }

    const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
    if (up && onFloor) {
      this.player.setVelocityY(jumpVelocity);
    }
  }
}
