import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

type PhaserGameProps = {
    width?: number;
    height?: number;
};

export const PhaserGame = ({ width = 640, height = 360 }: PhaserGameProps) => {
    const container_ref = useRef<HTMLDivElement | null>(null);
    const game_ref = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!container_ref.current) return;

        class MainScene extends Phaser.Scene {
            private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
            private wasd!: {
                up: Phaser.Input.Keyboard.Key;
                left: Phaser.Input.Keyboard.Key;
                down: Phaser.Input.Keyboard.Key;
                right: Phaser.Input.Keyboard.Key;
            };
            private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

            constructor() {
                super({ key: 'main-scene' });
            }

            preload() {
                this.add.text(8, 8, 'WASD to move, space to jump', { color: '#111' }).setScrollFactor(0);
            }

            create() {
                this.physics.world.setBounds(0, 0, width, height);

                const ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x222222);
                this.physics.add.existing(ground, true);

                const player_rect = this.add.rectangle(100, height - 80, 32, 48, 0xd93900);
                this.player = this.physics.add.existing(player_rect, false) as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                this.player.setCollideWorldBounds(true);
                this.player.body.setBounce(0.1, 0);
                this.player.body.setDragX(600);

                this.physics.add.collider(this.player, ground as unknown as Phaser.GameObjects.GameObject);

                this.cursors = this.input.keyboard!.createCursorKeys();
                this.wasd = {
                    up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                    left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                    down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                    right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
                };
            }

            override update() {
                const speed = 220;
                const jump_velocity = -380;

                const left = this.wasd.left.isDown || this.cursors.left?.isDown;
                const right = this.wasd.right.isDown || this.cursors.right?.isDown;
                const up = this.wasd.up.isDown || this.cursors.up?.isDown || this.cursors.space?.isDown;

                if (left) {
                    this.player.setVelocityX(-speed);
                } else if (right) {
                    this.player.setVelocityX(speed);
                }

                const on_floor = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
                if (up && on_floor) {
                    this.player.setVelocityY(jump_velocity);
                }
            }
        }

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            width,
            height,
            parent: container_ref.current,
            backgroundColor: '#f6f7f8',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 800 },
                    debug: false
                }
            },
            scene: [MainScene]
        });

        game_ref.current = game;

        return () => {
            game.destroy(true);
            game_ref.current = null;
        };
    }, [width, height]);

    return <div ref={container_ref} style={{ width, height }} />;
};