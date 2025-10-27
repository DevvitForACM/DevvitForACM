import Phaser from 'phaser';
import {
  LevelData,
  LevelEntity,
  EntityType,
  GridTile,
  TileType,
  LevelSettings,
  LEVEL_SCHEMA_VERSION,
  GRID_CELL_SIZE,
  LegacyLevelFormat,
} from './level-schema';
import { ENTITY_CONFIG } from '@/constants/game-constants';
import { Player } from '@/game/entities/player';

export function loadLevel(
  scene: Phaser.Scene,
  json: LevelData | LegacyLevelFormat
): Phaser.GameObjects.GameObject[] {
  let level: LevelData;

  if ('version' in json) {
    if (json.version === '2.0.0' && 'tiles' in json && 'entities' in json) {
      level = json as LevelData;
    } else {
      level = convertOldLevelData(json as any);
    }
  } else {
    level = convertLegacyLevel(json);
  }

  console.log(
    '[loadLevel] Loading level:',
    level.name,
    'with',
    level.tiles.length,
    'tiles and',
    level.entities.length,
    'entities'
  );
  validateLevel(level);
  applySettings(scene, level.settings);

  const createdObjects: Phaser.GameObjects.GameObject[] = [];

  level.tiles.forEach((tile) => {
    console.log(
      '[loadLevel] Creating tile:',
      tile.type,
      'at grid',
      tile.gridX,
      tile.gridY
    );
    const gameObject = createTile(scene, tile);
    if (gameObject) {
      createdObjects.push(gameObject);
      console.log('[loadLevel] Created tile:', tile.type);
    } else {
      console.warn('[loadLevel] Failed to create tile:', tile.type);
    }
  });

  level.entities.forEach((entity) => {
    console.log(
      '[loadLevel] Creating entity:',
      entity.type,
      'at pixel',
      entity.position
    );
    const gameObject = createEntity(scene, entity);
    if (gameObject) {
      createdObjects.push(gameObject);
      console.log('[loadLevel] Created entity:', entity.id, entity.type);
    } else {
      console.warn('[loadLevel] Failed to create entity:', entity.type);
    }
  });

  console.log('[loadLevel] Total objects created:', createdObjects.length);
  return createdObjects;
}

function convertOldLevelData(oldData: any): LevelData {
  const tiles: GridTile[] = [];
  const entities: LevelEntity[] = [];

  oldData.objects.forEach((obj: any) => {
    const t = String(obj.type).toLowerCase().trim();

    if (t === 'player') {
      entities.push({
        id: obj.id,
        type: EntityType.Player,
        position: obj.position,
        physics: obj.physics,
        visual: obj.visual,
      });
    } else if (t === 'platform') {
      const gridX = Math.floor(obj.position.x / GRID_CELL_SIZE);
      const gridY = Math.floor(obj.position.y / GRID_CELL_SIZE);
      const gridWidth = Math.ceil(
        ((obj.scale?.x || 1) * GRID_CELL_SIZE) / GRID_CELL_SIZE
      );
      const gridHeight = Math.ceil(
        ((obj.scale?.y || 1) * GRID_CELL_SIZE) / GRID_CELL_SIZE
      );

      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          tiles.push({
            type: TileType.Grass,
            gridX: gridX + x,
            gridY: gridY + y,
          });
        }
      }
    } else if (t === 'spring') {
      const gridX = Math.floor(obj.position.x / GRID_CELL_SIZE);
      const gridY = Math.floor(obj.position.y / GRID_CELL_SIZE);
      tiles.push({
        type: TileType.Spring,
        gridX,
        gridY,
      });
    } else if (t === 'spike') {
      const gridX = Math.floor(obj.position.x / GRID_CELL_SIZE);
      const gridY = Math.floor(obj.position.y / GRID_CELL_SIZE);
      tiles.push({
        type: TileType.Spike,
        gridX,
        gridY,
      });
    } else if (t === 'goal') {
      const gridX = Math.floor(obj.position.x / GRID_CELL_SIZE);
      const gridY = Math.floor(obj.position.y / GRID_CELL_SIZE);
      tiles.push({
        type: TileType.Door,
        gridX,
        gridY,
      });
    }
  });

  const maxGridX = Math.max(0, ...tiles.map((t) => t.gridX));
  const maxGridY = Math.max(0, ...tiles.map((t) => t.gridY));
  const gridWidth = Math.max(10, maxGridX + 2);
  const gridHeight = Math.max(6, maxGridY + 2);

  return {
    version: LEVEL_SCHEMA_VERSION,
    name: oldData.name || 'Converted Level',
    settings: oldData.settings || {
      gravity: { x: 0, y: 1 },
      backgroundColor: '#87CEEB',
      bounds: {
        width: gridWidth * GRID_CELL_SIZE,
        height: gridHeight * GRID_CELL_SIZE,
      },
    },
    grid: {
      width: gridWidth,
      height: gridHeight,
    },
    tiles,
    entities,
  };
}

function convertLegacyLevel(legacy: LegacyLevelFormat): LevelData {
  const tiles: GridTile[] = [];
  const entities: LevelEntity[] = [];

  entities.push({
    id: 'player_1',
    type: EntityType.Player,
    position: { x: legacy.player.x, y: legacy.player.y },
    physics: { type: 'dynamic' },
    visual: {
      tint:
        parseColor(legacy.player.color) ?? ENTITY_CONFIG.PLAYER_COLOR_DEFAULT,
    },
  });

  legacy.platforms.forEach((p, i) => {
    const gridX = Math.floor(p.x / GRID_CELL_SIZE);
    const gridY = Math.floor(
      (legacy.world.height - p.y - p.height) / GRID_CELL_SIZE
    );
    const gridWidth = Math.ceil(p.width / GRID_CELL_SIZE);
    const gridHeight = Math.ceil(p.height / GRID_CELL_SIZE);

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        tiles.push({
          type: TileType.Grass,
          gridX: gridX + x,
          gridY: gridY + y,
          properties: {
            originalPlatformId: `platform_${i + 1}`,
            color: parseColor(p.color) ?? ENTITY_CONFIG.PLATFORM_COLOR_DEFAULT,
          },
        });
      }
    }
  });

  const settings: LevelSettings = {
    backgroundColor: legacy.world.backgroundColor ?? '#87CEEB',
    bounds: {
      width: legacy.world.width,
      height: legacy.world.height,
    },
    gravity: { x: 0, y: 1 },
  };

  return {
    version: LEVEL_SCHEMA_VERSION,
    name: 'Legacy Level',
    settings,
    grid: {
      width: Math.ceil(legacy.world.width / GRID_CELL_SIZE),
      height: Math.ceil(legacy.world.height / GRID_CELL_SIZE),
    },
    tiles,
    entities,
  };
}

function parseColor(hex?: string): number | undefined {
  if (!hex) return undefined;
  return parseInt(hex.replace('#', '0x'));
}

function applySettings(scene: Phaser.Scene, settings: LevelSettings): void {
  if (settings.backgroundColor !== undefined && scene.cameras?.main) {
    scene.cameras.main.setBackgroundColor(settings.backgroundColor);
  }

  if ((scene as any).physics?.world) {
    if (settings.gravity) {
      scene.physics.world.gravity.y = settings.gravity.y ?? 800;
    }
    if (settings.bounds) {
      scene.physics.world.setBounds(
        0,
        0,
        settings.bounds.width,
        settings.bounds.height
      );
    }
  }
}

/**
 * Convert grid coordinates to pixel coordinates
 * Grid origin (0,0) is bottom-left, pixel origin (0,0) is top-left
 */
function gridToPixel(
  gridX: number,
  gridY: number,
  gridHeight: number
): { x: number; y: number } {
  const pixelX = gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  const pixelY = (gridHeight - 1 - gridY) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
  return { x: pixelX, y: pixelY };
}

function createTile(
  scene: Phaser.Scene,
  tile: GridTile
): Phaser.GameObjects.GameObject | null {
  const gridHeight = (scene as any).levelData?.grid?.height || 10;
  const pixelPos = gridToPixel(tile.gridX, tile.gridY, gridHeight);

  switch (tile.type) {
    case TileType.Grass:
      return createGrassTile(scene, pixelPos.x, pixelPos.y, tile);
    case TileType.Spring:
      return createSpringTile(scene, pixelPos.x, pixelPos.y, tile);
    case TileType.Spike:
      return createSpikeTile(scene, pixelPos.x, pixelPos.y, tile);
    case TileType.Coin:
      return createCoinTile(scene, pixelPos.x, pixelPos.y, tile);
    case TileType.Door:
      return createDoorTile(scene, pixelPos.x, pixelPos.y, tile);
    default:
      return null;
  }
}

function createEntity(
  scene: Phaser.Scene,
  entity: LevelEntity
): Phaser.GameObjects.GameObject | null {
  switch (entity.type) {
    case EntityType.Player:
      return createPlayer(scene, entity);
    case EntityType.Enemy:
      return createEnemy(scene, entity);
    case EntityType.Collectible:
      return createCollectible(scene, entity);
    default:
      return null;
  }
}

function createGrassTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tile: GridTile
): Phaser.GameObjects.GameObject {
  if ((scene as any).physics?.world) {
    const platform = scene.add.rectangle(
      x,
      y,
      GRID_CELL_SIZE,
      GRID_CELL_SIZE,
      0x4a7c59
    );
    scene.physics.add.existing(platform, true);
    platform.name = `grass_${tile.gridX}_${tile.gridY}`;
    return platform;
  } else {
    const platform = scene.add.rectangle(
      x,
      y,
      GRID_CELL_SIZE,
      GRID_CELL_SIZE,
      0x4a7c59
    );
    platform.name = `grass_${tile.gridX}_${tile.gridY}`;
    return platform;
  }
}

function createSpringTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tile: GridTile
): Phaser.GameObjects.GameObject {
  const img = scene.add.image(x, y, 'spring');
  img.setDisplaySize(GRID_CELL_SIZE - 4, GRID_CELL_SIZE - 4);
  img.name = `spring_${tile.gridX}_${tile.gridY}`;
  return img;
}

function createSpikeTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tile: GridTile
): Phaser.GameObjects.GameObject {
  const img = scene.add.image(x, y, 'spike');
  img.setDisplaySize(GRID_CELL_SIZE, GRID_CELL_SIZE);
  img.name = `spike_${tile.gridX}_${tile.gridY}`;
  return img;
}

function createCoinTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tile: GridTile
): Phaser.GameObjects.GameObject {
  const textureKey = 'coin-0';
  const coinSprite = scene.add.sprite(x, y, textureKey);
  coinSprite.setDisplaySize(GRID_CELL_SIZE - 8, GRID_CELL_SIZE - 8);
  coinSprite.setName(`coin_${tile.gridX}_${tile.gridY}`);

  if (scene.anims.exists('coin-spin')) {
    coinSprite.play('coin-spin');
  }

  return coinSprite;
}

function createDoorTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tile: GridTile
): Phaser.GameObjects.GameObject {
  const img = scene.add.image(x, y, 'default-icon');
  img.setDisplaySize(GRID_CELL_SIZE, GRID_CELL_SIZE);
  img.name = `door_${tile.gridX}_${tile.gridY}`;
  return img;
}

function createPlayer(
  scene: Phaser.Scene,
  entity: LevelEntity
): Phaser.GameObjects.GameObject {
  const textureKey = entity.visual?.texture || 'player-idle-0';

  if ((scene as any).physics?.world) {
    const playerSprite = scene.physics.add.sprite(
      entity.position.x,
      entity.position.y,
      textureKey
    );
    playerSprite.setDisplaySize(60, 100);
    playerSprite.setName(entity.id);
    playerSprite.setBounce(ENTITY_CONFIG.PLAYER_BOUNCE);
    playerSprite.setCollideWorldBounds(true);

    const player = new Player(
      scene,
      entity.id,
      entity.position.x,
      entity.position.y,
      textureKey
    );
    player.sprite.destroy();
    player.sprite = playerSprite;

    // Start idle animation if it exists
    if (scene.anims.exists('player-idle')) {
      playerSprite.play('player-idle');
    }

    return playerSprite;
  } else {
    const playerSprite = scene.add.sprite(
      entity.position.x,
      entity.position.y,
      textureKey
    );
    playerSprite.setDisplaySize(60, 100);
    playerSprite.setName(entity.id);

    const player = new Player(
      scene,
      entity.id,
      entity.position.x,
      entity.position.y,
      textureKey
    );
    player.sprite.destroy();
    player.sprite = playerSprite;

    // Start idle animation if it exists
    if (scene.anims.exists('player-idle')) {
      playerSprite.play('player-idle');
    }

    return playerSprite;
  }
}

function createEnemy(
  scene: Phaser.Scene,
  entity: LevelEntity
): Phaser.GameObjects.GameObject {
  const textureKey = entity.visual?.texture || 'enemy-default';
  const enemySprite = scene.add.sprite(
    entity.position.x,
    entity.position.y,
    textureKey
  );
  enemySprite.setDisplaySize(40, 40);
  enemySprite.setName(entity.id);
  return enemySprite;
}

function createCollectible(
  scene: Phaser.Scene,
  entity: LevelEntity
): Phaser.GameObjects.GameObject {
  const textureKey = entity.visual?.texture || 'coin-0';
  const collectibleSprite = scene.add.sprite(
    entity.position.x,
    entity.position.y,
    textureKey
  );
  collectibleSprite.setDisplaySize(30, 30);
  collectibleSprite.setName(entity.id);

  if (scene.anims.exists('coin-spin')) {
    collectibleSprite.play('coin-spin');
  }

  return collectibleSprite;
}

function validateLevel(level: LevelData): void {
  if (!level.tiles || !Array.isArray(level.tiles)) {
    throw new Error('Invalid level: tiles array missing.');
  }
  if (!level.entities || !Array.isArray(level.entities)) {
    throw new Error('Invalid level: entities array missing.');
  }
  if (!level.grid) {
    throw new Error('Invalid level: grid settings missing.');
  }
  if (!level.version) {
    throw new Error('Invalid level: missing version field.');
  }
}
