import { useState, useEffect, useMemo } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';
import { CreateScene } from '@/game/scenes/create-scene';
import { SCENE_KEYS, COLORS, ENTITY_CONFIG } from '@/constants/game-constants';
import {
  LEVEL_SCHEMA_VERSION,
  LevelObjectType,
  PhysicsType,
  type LevelData,
  type LevelObject,
} from '@/game/level/level-schema';

const ENTITY_TYPES_DATA = {
  player: { name: 'Player', icon: '🧍', color: '#22c55e' },
  enemy: { name: 'Enemy', icon: '👾', color: '#ef4444' },
  spike: { name: 'Spike', icon: '🔺', color: '#ff4500' },
  spring: { name: 'Spring', icon: '🟢', color: '#00ff00' },
  ground: { name: 'Ground', icon: '🟫', color: '#78716c' },
  lava: { name: 'Lava', icon: '🔥', color: '#f97316' },
  coin: { name: 'Coin', icon: '💰', color: '#eab308' },
  door: { name: 'Door', icon: '🚪', color: '#8b5cf6' },
};

const ENTITY_TYPES = [
  { id: 'player', name: 'Player', icon: '🧍', color: '#22c55e' },
  { id: 'enemy', name: 'Enemy', icon: '👾', color: '#ef4444' },
  { id: 'spike', name: 'Spike', icon: '🔺', color: '#ff4500' },
  { id: 'spring', name: 'Spring', icon: '🟢', color: '#00ff00' },
  { id: 'ground', name: 'Ground', icon: '🟫', color: '#78716c' },
  { id: 'lava', name: 'Lava', icon: '🔥', color: '#f97316' },
  { id: 'coin', name: 'Coin', icon: '💰', color: '#eab308' },
  { id: 'door', name: 'Door', icon: '🚪', color: '#8b5cf6' },
];

export default function Create() {
  const [scene, setScene] = useState<CreateScene | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [entityCount, setEntityCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedEntities, setSavedEntities] = useState<any[]>([]);
  const [saveBanner, setSaveBanner] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const config = useMemo(() => createBlankCanvasConfig('#f6f7f8'), []);

  useEffect(() => {
    const check = setInterval(() => {
      const game = (window as any).game;
      if (game) {
        const s = game.scene.getScene('CreateScene') as CreateScene;
        if (s) {
          setScene(s);

          s.registry.set('entityTypes', ENTITY_TYPES_DATA);

          if (selectedEntity) {
            console.debug(
              '[Create] scene attached: applying existing selection ->',
              selectedEntity
            );
            s.registry.set('selectedEntityType', selectedEntity);
            s.setSelectedEntityType(selectedEntity);
          }
          s.events.on('entity-placed', () =>
            setEntityCount(s.getAllEntities().length)
          );
          s.events.on('entity-removed', () =>
            setEntityCount(s.getAllEntities().length)
          );
          s.events.on('entities-cleared', () => setEntityCount(0));
          clearInterval(check);
        }
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  const handleSelect = (id: string) => {
    const next = selectedEntity === id ? null : id;
    setSelectedEntity(next);
    if (scene) {
      console.debug('[Create] handleSelect ->', next);
      scene.setSelectedEntityType(next);
      scene.registry.set('selectedEntityType', next);
    }
  };

  useEffect(() => {
    if (!scene) return;

    console.debug(
      '[Create] syncing selection to scene (effect) ->',
      selectedEntity
    );
    scene.registry.set('selectedEntityType', selectedEntity ?? null);
    scene.setSelectedEntityType(selectedEntity ?? null);
  }, [scene, selectedEntity]);

  const handleClear = () => {
    scene?.clearAllEntities();

    setSelectedEntity(null);
    if (scene) {
      scene.setSelectedEntityType(null);
      scene.registry.set('selectedEntityType', null);
    }
  };

  const handlePublish = async () => {
    if (!scene) return;
    
    setIsPublishing(true);
    const GRID = 32;
    const entities = scene.getAllEntities();
    
    try {
      const ground = entities.filter((e: any) => {
        const t = String(e.type).toLowerCase().trim();
        return t === 'ground' || t === 'grass' || t === 'tile';
      });

      const width = Math.max(1000, ...ground.map((g: any) => (g.gridX + 2) * GRID));
      const height = Math.max(600, ...ground.map((g: any) => (g.gridY + 2) * GRID));
      const toY = (gridY: number) => height - (gridY * GRID + GRID / 2);

      const objects: LevelObject[] = [];

      const playerEnt = entities.find((e: any) => String(e.type).toLowerCase().trim() === 'player');
      const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
      const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
      objects.push({ id: 'player_1', type: LevelObjectType.Player, position: { x: playerX, y: playerY }, physics: { type: PhysicsType.Dynamic } });

      entities.forEach((e: any, idx: number) => {
        const t = String(e.type).toLowerCase().trim();
        if (t === 'spring' || t === 'spike' || t === 'coin' || t === 'lava') {
          const x = e.gridX * GRID + GRID / 2;
          const y = toY(e.gridY);
          let levelType: LevelObjectType = LevelObjectType.Spring;
          if (t === 'spike') levelType = LevelObjectType.Spike;
          else if (t === 'coin') levelType = LevelObjectType.Coin;
          else if (t === 'lava') levelType = LevelObjectType.Lava;
          objects.push({ 
            id: `${t}_${idx + 1}`, 
            type: levelType, 
            position: { x, y } 
          });
        }
      });

      const doorEnt = entities.find((e: any) => String(e.type).toLowerCase().trim() === 'door');
      if (doorEnt) {
        objects.push({ id: 'goal_1', type: LevelObjectType.Goal, position: { x: doorEnt.gridX * GRID + GRID / 2, y: toY(doorEnt.gridY) } });
      }

      ground.forEach((g: any, i: number) => {
        objects.push({
          id: `platform_${i + 1}`,
          type: LevelObjectType.Platform,
          position: { x: g.gridX * GRID + GRID / 2, y: toY(g.gridY) },
          scale: { x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH, y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT },
          physics: { type: PhysicsType.Static, isCollidable: true },
          visual: { tint: COLORS.PLATFORM_ALT },
        });
      });

      const levelData = {
        version: LEVEL_SCHEMA_VERSION,
        name: 'Editor Level',
        isPublic: true,
        settings: {
          gravity: { x: 0, y: 1 },
          backgroundColor: '#87CEEB',
          bounds: { width, height },
        },
        objects,
      };

      // Call API to publish level
      // Note: Devvit Web handles authentication automatically
      const response = await fetch('/api/levels/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(levelData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // eslint-disable-next-line no-console
        console.error('[Create] Publish error response:', errorData);
        throw new Error(`Failed to publish: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.info('[Create] Level published successfully:', result);
      
      setSaveBanner({ 
        status: 'success', 
        message: `Level published! ID: ${result.id}` 
      });
      setTimeout(() => setSaveBanner(null), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Create] Publish failed:', error);
      setSaveBanner({ 
        status: 'error', 
        message: `Publish failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setSaveBanner(null), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = () => {
    if (!scene) return;
    const GRID = 32;
    const entities = scene.getAllEntities();

    console.info('[Create] Saving level… entities:', entities.length);

    const ground = entities.filter((e: any) => {
      const t = String(e.type).toLowerCase().trim();
      return t === 'ground' || t === 'grass' || t === 'tile';
    });

    const width = Math.max(
      1000,
      ...ground.map((g: any) => (g.gridX + 2) * GRID)
    );
    const height = Math.max(
      600,
      ...ground.map((g: any) => (g.gridY + 2) * GRID)
    );
    const toY = (gridY: number) => height - (gridY * GRID + GRID / 2);

    const objects: LevelObject[] = [];

    const playerEnt = entities.find(
      (e: any) => String(e.type).toLowerCase().trim() === 'player'
    );
    const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
    const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
    objects.push({
      id: 'player_1',
      type: LevelObjectType.Player,
      position: { x: playerX, y: playerY },
      physics: { type: PhysicsType.Dynamic },
    });

    entities.forEach((e: any, idx: number) => {
      const t = String(e.type).toLowerCase().trim();
      if (t === 'spring' || t === 'spike') {
        const x = e.gridX * GRID + GRID / 2;
        const y = toY(e.gridY);
        const levelType =
          t === 'spring' ? LevelObjectType.Spring : LevelObjectType.Spike;
        objects.push({
          id: `${t}_${idx + 1}`,
          type: levelType,
          position: { x, y },
        });
      }
    });

    const doorEnt = entities.find(
      (e: any) => String(e.type).toLowerCase().trim() === 'door'
    );
    if (doorEnt) {
      objects.push({
        id: 'goal_1',
        type: LevelObjectType.Goal,
        position: {
          x: doorEnt.gridX * GRID + GRID / 2,
          y: toY(doorEnt.gridY),
        },
      });
    }

    ground.forEach((g: any, i: number) => {
      objects.push({
        id: `platform_${i + 1}`,
        type: LevelObjectType.Platform,
        position: {
          x: g.gridX * GRID + GRID / 2,
          y: toY(g.gridY),
        },
        scale: {
          x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH,
          y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT,
        },
        physics: { type: PhysicsType.Static, isCollidable: true },
        visual: { tint: COLORS.PLATFORM_ALT },
      });
    });

    const levelData: LevelData = {
      version: LEVEL_SCHEMA_VERSION,
      name: 'Editor Level',
      settings: {
        gravity: { x: 0, y: 1 },
        backgroundColor: '#87CEEB',
        bounds: { width, height },
      },
      objects,
    };

    try {
      const outStr = JSON.stringify(levelData);
      localStorage.setItem('editorLevelJSON', outStr);
      const bytes = outStr.length;
      const msg = `Saved level.json (${objects.length} objects, ${bytes} bytes)`;

      console.info('[Create] Save OK ->', {
        bytes,
        objects: objects.length,
        bounds: levelData.settings.bounds,
      });
      setSaveBanner({ status: 'success', message: msg });
      setTimeout(() => setSaveBanner(null), 2500);

      const blob = new Blob([JSON.stringify(levelData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'level.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('[Create] Save failed:', e);
      setSaveBanner({
        status: 'error',
        message: 'Save failed — check console',
      });
      setTimeout(() => setSaveBanner(null), 3000);
    }
  };

  const handlePlay = () => {
    if (!scene) return;

    const currentEntities = scene.getAllEntities();
    setSavedEntities(currentEntities);

    const saved = localStorage.getItem('editorLevelJSON');
    let levelData: LevelData | null = null;
    if (!levelData && saved) {
      try {
        levelData = JSON.parse(saved) as LevelData;
      } catch {}

      console.debug(
        '[Create] Play: using saved JSON from localStorage ->',
        !!levelData
      );
    }
    if (!levelData) {
      const GRID = 32;
      const entities = scene.getAllEntities();
      const ground = entities.filter((e: any) => {
        const t = String(e.type).toLowerCase().trim();
        return t === 'ground' || t === 'grass' || t === 'tile';
      });
      const objects: LevelObject[] = [];

      const width = Math.max(
        1000,
        ...ground.map((g: any) => (g.gridX + 2) * GRID)
      );
      const height = Math.max(
        600,
        ...ground.map((g: any) => (g.gridY + 2) * GRID)
      );
      const toY = (gridY: number) => height - (gridY * GRID + GRID / 2);

      const playerEnt = entities.find(
        (e: any) => String(e.type).toLowerCase().trim() === 'player'
      );
      const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
      const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
      objects.push({
        id: 'player_1',
        type: LevelObjectType.Player,
        position: { x: playerX, y: playerY },
        physics: { type: PhysicsType.Dynamic },
      });

      const doorEnt = entities.find(
        (e: any) => String(e.type).toLowerCase().trim() === 'door'
      );
      if (doorEnt) {
        objects.push({
          id: 'goal_1',
          type: LevelObjectType.Goal,
          position: {
            x: doorEnt.gridX * GRID + GRID / 2,
            y: toY(doorEnt.gridY),
          },
        });
      }

      entities.forEach((e: any, idx: number) => {
        const t = String(e.type).toLowerCase().trim();
        if (t === 'spring' || t === 'spike') {
          const x = e.gridX * GRID + GRID / 2;
          const y = toY(e.gridY);
          const levelType =
            t === 'spring' ? LevelObjectType.Spring : LevelObjectType.Spike;
          objects.push({
            id: `${t}_${idx + 1}`,
            type: levelType,
            position: { x, y },
          });
        }
      });
      ground.forEach((g: any, i: number) => {
        objects.push({
          id: `platform_${i + 1}`,
          type: LevelObjectType.Platform,
          position: {
            x: g.gridX * GRID + GRID / 2,
            y: toY(g.gridY),
          },
          scale: {
            x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH,
            y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT,
          },
          physics: { type: PhysicsType.Static, isCollidable: true },
          visual: { tint: COLORS.PLATFORM_ALT },
        });
      });

      levelData = {
        version: LEVEL_SCHEMA_VERSION,
        name: 'Editor Level',
        settings: {
          gravity: { x: 0, y: 1 },
          backgroundColor: '#87CEEB',
          bounds: { width, height },
        },
        objects,
      };
    }

    console.log('[Create] handlePlay - levelData:', levelData);
    console.log('[Create] handlePlay - objects count:', levelData.objects.length);
    const platforms = levelData.objects.filter(o => o.type === 'platform');
    console.log('[Create] handlePlay - platform objects:', platforms.length);

    setIsPlaying(true);
    
    // Clean up any existing PlayScene first
    const existingPlayScene = scene.scene.get(SCENE_KEYS.PLAY);
    if (existingPlayScene) {
      existingPlayScene.scene.stop(SCENE_KEYS.PLAY);
      // Force scene restart by stopping and starting
      existingPlayScene.scene.start(SCENE_KEYS.PLAY, { useMapControls: false, levelData });
    }
    
    scene.scene.stop(SCENE_KEYS.CREATE);
    
    // If PlayScene doesn't exist, start it fresh
    if (!existingPlayScene) {
      scene.scene.start(SCENE_KEYS.PLAY, { useMapControls: false, levelData });
    }
  };

  const handleReturnToEditor = () => {
    if (!scene) return;

    const playScene = scene.scene.get(SCENE_KEYS.PLAY);
    if (playScene && playScene.scene.isActive(SCENE_KEYS.PLAY)) {
      playScene.children.removeAll(true);

      scene.scene.stop(SCENE_KEYS.PLAY);
    }

    scene.scene.start(SCENE_KEYS.CREATE);
    setIsPlaying(false);

    setTimeout(() => {
      const game = (window as any).game;
      if (game) {
        const createScene = game.scene.getScene('CreateScene') as CreateScene;
        if (createScene) {
          setScene(createScene);

          createScene.events.removeAllListeners();
          createScene.registry.set('entityTypes', ENTITY_TYPES_DATA);

          // Ensure camera starts with Y=0 at bottom of view
          if (createScene.cameras?.main) {
            const cam = createScene.cameras.main;
            cam.scrollY = -cam.height;
          }

          createScene.events.on('entity-placed', () =>
            setEntityCount(createScene.getAllEntities().length)
          );
          createScene.events.on('entity-removed', () =>
            setEntityCount(createScene.getAllEntities().length)
          );
          createScene.events.on('entities-cleared', () => setEntityCount(0));

          if (savedEntities.length > 0) {
            createScene.restoreSnapshot(savedEntities as any);
            setEntityCount(savedEntities.length);
          }

          if (selectedEntity) {
            createScene.registry.set('selectedEntityType', selectedEntity);
            createScene.setSelectedEntityType(selectedEntity);
          }
        }
      }
    }, 200);
  };

  const hasPlayer = useMemo(() => {
    if (!scene) return false;
    return scene
      .getAllEntities()
      .some((e: any) => String(e.type).toLowerCase().trim() === 'player');
  }, [scene, entityCount]);

  const hasDoor = useMemo(() => {
    if (!scene) return false;
    return scene
      .getAllEntities()
      .some((e: any) => String(e.type).toLowerCase().trim() === 'door');
  }, [scene, entityCount]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Phaser Canvas - with padding for toolbars in editor, full height in play */}
      <div
        className={`absolute top-[64px] left-0 right-0 z-0 ${isPlaying ? 'bottom-0' : 'bottom-[100px]'}`}
      >
        <PhaserContainer config={config} />
      </div>

      {/* Top Bar - Editor Mode */}
      {!isPlaying && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Entities:{' '}
              <span className="font-bold text-base sm:text-lg">
                {entityCount}
              </span>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={handleClear}
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs bg-zinc-900 sm:text-sm text-white rounded font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 text-xs sm:text-sm text-white rounded font-medium"
              >
                Save
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-green-600 text-xs sm:text-sm text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isPublishing ? 'Publishing...' : 'Publish Level'}
              </button>
              <button
                onClick={handlePlay}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 text-xs sm:text-sm text-white rounded font-medium"
              >
                Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to Editor Button - Play Mode */}
      {isPlaying && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="text-sm sm:text-lg font-semibold text-gray-800">
              Play Mode
            </div>
            <button
              onClick={handleReturnToEditor}
              className="px-3 py-2 sm:px-5 sm:py-2 bg-zinc-900 text-sm sm:text-base text-white rounded font-medium hover:bg-zinc-800 transition"
            >
              ← Return to Editor
            </button>
          </div>
        </div>
      )}

      {/* Save banner */}
      {saveBanner && (
        <div
          className={`absolute top-14 right-3 z-[60] px-3 py-2 rounded shadow text-sm font-medium ${
            saveBanner.status === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {saveBanner.message}
        </div>
      )}

      {/* Bottom Toolbox - Editor Mode Only */}
      {!isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t">
          <div className="overflow-x-auto">
            <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 min-h-[80px] sm:min-h-[100px]">
              {ENTITY_TYPES.map((entity) => {
                const disabled =
                  (entity.id === 'player' && hasPlayer) ||
                  (entity.id === 'door' && hasDoor);
                return (
                  <button
                    key={entity.id}
                    onClick={() => !disabled && handleSelect(entity.id)}
                    disabled={disabled}
                    className={`
                    flex flex-col items-center justify-center
                    min-w-[60px] sm:min-w-[80px] h-[64px] sm:h-[80px]
                    p-2 sm:p-3 rounded-lg border-2
                    transition-all duration-200 flex-shrink-0
                    relative z-10
                    ${
                      selectedEntity === entity.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : disabled
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm cursor-pointer'
                    }
                  `}
                    style={{
                      backgroundColor:
                        selectedEntity === entity.id
                          ? `${entity.color}15`
                          : 'white',
                      pointerEvents: 'auto',
                    }}
                  >
                    <div className="text-xl sm:text-2xl mb-1 pointer-events-none">
                      {entity.icon}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-medium text-center text-gray-700 leading-tight pointer-events-none">
                      {entity.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Helper - Editor Mode Only */}
      {!isPlaying && entityCount === 0 && !selectedEntity && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-center bg-white/90 p-4 sm:p-8 rounded-lg max-w-xs sm:max-w-md mx-4 pointer-events-none">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🎮</div>
            <div className="text-sm sm:text-lg font-semibold mb-2">
              Start Creating!
            </div>
            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              <div>1. Click entity below</div>
              <div>2. Click canvas to place</div>
              <div className="text-gray-400 mt-2">Right-click to remove</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
