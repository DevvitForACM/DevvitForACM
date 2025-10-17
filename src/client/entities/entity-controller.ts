import Phaser from 'phaser';
import { BaseEntity } from './base-entity';
import { Player } from './player';
import { Spike } from './spike';
import { Spring } from './spring';
import { Tile } from './tile';

export class EntityController {
  private entities: BaseEntity[]; // Array of all entities
  private scene: Phaser.Scene; // Reference to game scene
  public player?: Player;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.entities = [];
  }

  public add(entity: BaseEntity): void {
    this.entities.push(entity);

    if (entity instanceof Player) {
      this.player = entity;
    }
  }

  // Remove entity by id
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

  // Get entity by id
  public get(id: string): BaseEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  // Get all entities
  public getAll(): BaseEntity[] {
    return this.entities;
  }

  public update(delta: number): void {
    for (const entity of this.entities) {
      if (entity.active) {
        entity.update(delta);
      }
    }

    // Collision detection will be handled seperately
  }

  // Remove all entities
  public clear(): void {
    for (const entity of this.entities) {
      entity.destroy();
    }
    this.entities = [];
    delete this.player;
  }
}
