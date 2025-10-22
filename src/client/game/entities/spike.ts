import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';
import { DAMAGE, ENTITY_SIZES, ANIMATIONS } from '../../constants/game-constants';

export class Spike extends BaseEntity {
  public damage: number;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    texture: string = 'spike'
  ) {
    super(scene, id, x, y, texture);

    this.width = ENTITY_SIZES.BASE.WIDTH;
    this.height = ENTITY_SIZES.BASE.HEIGHT;
    this.damage = DAMAGE.SPIKE;
  }

  public override update(delta: number): void { void delta; }

  public override onCollision(other: BaseEntity): void {
    if (other instanceof Player && !other.isDead) {
      // Damage is applied by the player's collision handler
      // We could add visual effects here like particles or screen shake
      this.createDamageEffect();
    }
  }

  private createDamageEffect(): void {
    // Simple visual feedback - flash red
    this.sprite.setTint(0xff0000);
    setTimeout(() => {
      this.sprite.clearTint();
    }, ANIMATIONS.TIMEOUT.DAMAGE_EFFECT);
  }
}
