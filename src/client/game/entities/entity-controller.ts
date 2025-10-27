import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';
import { CollisionManager } from './collision-manager';

export class EntityController {
  private entities: BaseEntity[];
  private scene: Phaser.Scene;
  public player?: Player;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.entities = [];

    void this.scene;
  }

  public add(entity: BaseEntity): void {
    this.entities.push(entity);

    if (entity instanceof Player) {
      this.player = entity;
    }
  }

  public remove(id: string): void {
    const index = this.entities.findIndex((e) => e.id === id);
    if (index !== -1) {
      const entity = this.entities[index];
      if (entity) {
        entity.destroy();
        this.entities.splice(index, 1);

        if (entity instanceof Player) {
          delete this.player;
        }
      }
    }
  }

  public get(id: string): BaseEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  public getAll(): BaseEntity[] {
    return this.entities;
  }

  public update(delta: number): void {
    for (const entity of this.entities) {
      if (entity.active) {
        entity.update(delta);
      }
    }

    this.handleCollisions();
  }

  private handleCollisions(): void {
    CollisionManager.checkCollisions(this.entities);
  }

  public checkEntityCollisions(entity: BaseEntity): BaseEntity[] {
    const others = this.entities.filter((e) => e !== entity);
    return CollisionManager.checkEntityCollisions(entity, others);
  }

  public clear(): void {
    for (const entity of this.entities) {
      entity.destroy();
    }
    this.entities = [];
    delete this.player;
  }
}
