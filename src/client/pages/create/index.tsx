import { useState, useEffect, useMemo } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';
import { CreateScene } from '@/game/scenes/create-scene';
import { SCENE_KEYS, ENTITY_CONFIG, GRID } from '@/constants/game-constants';
import {
  LEVEL_SCHEMA_VERSION,
  LevelObjectType,
  PhysicsType,
  type LevelData,
  type LevelObject,
} from '@/game/level/level-schema';
import { useRouting } from '@/components/routing';
import { authService } from '@/services/auth.service';

const ENTITY_TYPES_DATA = {
  player: { name: 'Player', icon: '🧍', color: '#22c55e' },
  enemy: { name: 'Enemy', icon: '👾', color: '#ef4444' },
  spike: { name: 'Spike', icon: '🔺', color: '#ff4500' },
  spring: { name: 'Spring', icon: '🟢', color: '#00ff00' },
  ground: { name: 'Grass', icon: '🌿', color: '#4ade80' },
  dirt: { name: 'Dirt', icon: '🟫', color: '#a16207' },
  lava: { name: 'Lava', icon: '🔥', color: '#f97316' },
  coin: { name: 'Coin', icon: '💰', color: '#eab308' },
  door: { name: 'Door', icon: '🚪', color: '#8b5cf6' },
};

const ENTITY_TYPES = [
  { id: 'player', name: 'Player', icon: '🧍', color: '#22c55e' },
  { id: 'enemy', name: 'Enemy', icon: '👾', color: '#ef4444' },
  { id: 'spike', name: 'Spike', icon: '🔺', color: '#ff4500' },
  { id: 'spring', name: 'Spring', icon: '🟢', color: '#00ff00' },
  { id: 'ground', name: 'Grass', icon: '🌿', color: '#4ade80' },
  { id: 'dirt', name: 'Dirt', icon: '🟫', color: '#a16207' },
  { id: 'lava', name: 'Lava', icon: '🔥', color: '#f97316' },
  { id: 'coin', name: 'Coin', icon: '💰', color: '#eab308' },
  { id: 'door', name: 'Door', icon: '🚪', color: '#8b5cf6' },
];

/**
 * Convert editor GRID.SIZE coordinates (where gridY increases upward) to new system GRID.SIZE coordinates (where 0 is bottom)
 * Editor gridY: negative values, increases upward
 * New system gridY: 0 at bottom, increases upward
 */
function convertEditorGridToNewSystem(editorGridY: number, worldHeight: number): number {
  // Editor's gridY calculation: gridY = -Math.floor(wy / GRID_SIZE) - 1
  // When wy = 0 (top of world), editor gridY ≈ -1 (approximately)
  // When wy = -worldHeight (very bottom), editor gridY would be large positive
  
  // The new system: gridY = 0 is at bottom (pixelY = worldHeight - GRID_SIZE)
  // Editor gridY = -1 corresponds to roughly the top of the world
  // We need to map editor's gridY to new system where 0 = bottom
  // Approximate: newGridY = numCells - 1 + editorGridY
  // But this needs refinement based on actual coordinate relationship
  
  // Actually, looking at CreateScene: gridY = -Math.floor(wy / GRID_SIZE) - 1
  // And pixelY = -(gridY + 1) * GRID_SIZE + GRID_SIZE / 2
  // If we want pixelY relative to bottom: pixelY_from_bottom = worldHeight - pixelY
  // Then newGridY = Math.floor(pixelY_from_bottom / GRID.SIZE)
  
  // From editor gridY, we can compute approximate pixelY:
  // pixelY ≈ -(editorGridY + 1) * GRID_SIZE + GRID_SIZE / 2 (but this is from top)
  // pixelY_from_bottom = worldHeight - pixelY related calculation
  
  // Simpler: If editor stores gridYAL relative to some origin, and we know world height
  // We can calculate by assuming editor gridY = 0 represents one cell up from world bottom
  // New system: bottom row = gridY 0
  // Conversion: newGridY = (worldHeight / GRID.SIZE) - 2 - editorGridY (approximate)
  
  // More accurate: Calculate from the actual pixel position that editor gridY represents
  // Editor's pixelY for a given gridY: pixelY = -(gridY + 1) * GRID_SIZE + GRID_SIZE / 2
  // This is relative to world origin (top)
  // Convert to bottom-relative: pixelY_from_bottom = worldHeight - pixelY
  // Then: newGridY = Math.floor(pixelY_from_bottom / GRID.SIZE)
  
  const editorPixelY = -(editorGridY + 1) * GRID.SIZE + GRID.SIZE / 2;
  const pixelYFromBottom = worldHeight - editorPixelY;
  const newGridY = Math.floor(pixelYFromBottom / GRID.SIZE);
  
  // Clamp to valid range
  const maxGridY = Math.floor(worldHeight / GRID.SIZE) - 1;
  return Math.max(0, Math.min(maxGridY, newGridY));
}

export default function Create() {
  const { navigate } = useRouting();
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

  // DB debug state
  const [dbStatus, setDbStatus] = useState<'idle' | 'ok' | 'error' | 'loading'>('idle');
  const [publicLevels, setPublicLevels] = useState<Array<{ id: string; name?: string }>>([]);
  const [userLevels, setUserLevels] = useState<Array<{ id: string; name?: string }>>([]);
  const [dbError, setDbError] = useState<string | null>(null);

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

  const refreshLevels = async () => {
    try {
      setDbStatus('loading');
      setDbError(null);

      console.log('[Create][DB] Fetching public levels…');
      const pubRes = await fetch('/api/levels/public');
      if (!pubRes.ok) throw new Error(`public: HTTP ${pubRes.status}`);
      const pubJson = await pubRes.json();
      const pubList = Array.isArray(pubJson.levels) ? pubJson.levels : [];
      setPublicLevels(pubList.map((l: any) => ({ id: l.id, name: l.name })));
      console.log('[Create][DB] public levels:', pubList.length, pubList.map((l:any)=>l.id).slice(0,5));

      const user = authService.getCurrentUser();
      if (user?.uid) {
        console.log('[Create][DB] Fetching user levels…', user.uid);
        const userRes = await fetch(`/api/levels/user/${user.uid}`, { credentials: 'include' });
        if (userRes.ok) {
          const userJson = await userRes.json();
          const uList = Array.isArray(userJson.levels) ? userJson.levels : [];
          setUserLevels(uList.map((l: any) => ({ id: l.id, name: l.name })));
          console.log('[Create][DB] user levels:', uList.length, uList.map((l:any)=>l.id).slice(0,5));
        } else {
          console.warn('[Create][DB] user levels request failed:', userRes.status);
          setUserLevels([]);
        }
      } else {
        setUserLevels([]);
      }

      setDbStatus('ok');
    } catch (e: any) {
      console.error('[Create][DB] Fetch failed:', e);
      setDbError(e?.message || 'Failed to fetch levels');
      setDbStatus('error');
    }
  };

  useEffect(() => {
    // initial fetch on mount
    refreshLevels();
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
    const entities = scene.getAllEntities();
    
    try {
      const groundOrDirt = entities.filter((e: any) => {
        const t = String(e.type).toLowerCase().trim();
        return t === 'ground' || t === 'grass' || t === 'tile' || t === 'dirt';
      });

      // Calculate world dimensions
      const maxGridY = Math.max(0, ...groundOrDirt.map((g: any) => g.gridY), ...entities.map((e: any) => e.gridY));
      const width = Math.max(1000, ...groundOrDirt.map((g: any) => (g.gridX + 2) * GRID));
      const height = Math.max(600, (maxGridY + 3) * GRID);
      // Convert grid Y to world Y (center of the grid cell)
      // Grid Y=0 is at the BOTTOM, Y increases upward
      const toY = (gridY: number) => height - (gridY * GRID) - (GRID / 2);

      const objects: LevelObject[] = [];

      const playerEnt = entities.find((e: any) => String(e.type).toLowerCase().trim() === 'player');
      const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
      // Player Y is just the center of their grid cell
      const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
      
      objects.push({ id: 'player_1', type: LevelObjectType.Player, position: { x: playerX, y: playerY }, physics: { type: PhysicsType.Dynamic } });

      entities.forEach((e: any, idx: number) => {
        const t = String(e.type).toLowerCase().trim();
        if (t === 'spring' || t === 'spike' || t === 'coin' || t === 'enemy' || t === 'lava') {
          // All entities use center-based positioning
          const x = e.gridX * GRID + GRID / 2;
          const y = toY(e.gridY);
          let levelType: LevelObjectType = LevelObjectType.Spring;
          let scale = undefined;
          let visual = undefined;
          
          if (t === 'spike') levelType = LevelObjectType.Spike;
          else if (t === 'coin') levelType = LevelObjectType.Coin;
          else if (t === 'enemy') levelType = LevelObjectType.Enemy;
          else if (t === 'lava') {
            levelType = LevelObjectType.Obstacle;
            scale = { x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH, y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT };
            visual = { texture: 'lava' };
          }
          
          const obj: any = { id: `${t}_${idx + 1}`, type: levelType, position: { x, y } };
          if (scale) obj.scale = scale;
          if (visual) obj.visual = visual;
          objects.push(obj);
        }
      });

      const doorEnt = entities.find((e: any) => String(e.type).toLowerCase().trim() === 'door');
      if (doorEnt) {
        const doorGridX = doorEnt.gridX;
        const doorGridY = convertEditorGridToNewSystem(doorEnt.gridY, height);
        objects.push({ 
          id: 'goal_1', 
          type: LevelObjectType.Goal, 
          position: { x: 0, y: 0 }, // Dummy, gridPosition used instead
          gridPosition: { x: doorGridX, y: doorGridY }, 
          visual: { texture: 'door' } 
        });
      }

      groundOrDirt.forEach((g: any, i: number) => {
        const t = String(g.type).toLowerCase().trim();
        const texture = t === 'dirt' ? 'ground' : 'grass';
        const newGridX = g.gridX;
        const newGridY = convertEditorGridToNewSystem(g.gridY, height);
        objects.push({
          id: `platform_${i + 1}`,
          type: LevelObjectType.Platform,
          position: { x: 0, y: 0 }, // Dummy, gridPosition used instead
          gridPosition: { x: newGridX, y: newGridY },
          scale: { x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH, y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT },
          physics: { type: PhysicsType.Static, isCollidable: true },
          visual: { texture },
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
         
        console.error('[Create] Publish error response:', errorData);
        throw new Error(`Failed to publish: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
       
      console.info('[Create] Level published successfully:', result);
      
      setSaveBanner({ 
        status: 'success', 
        message: `Level published! ID: ${result.id}` 
      });
      setTimeout(() => setSaveBanner(null), 3000);
    } catch (error) {
       
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
    const entities = scene.getAllEntities();

    console.info('[Create] Saving level… entities:', entities.length);

    const groundOrDirt = entities.filter((e: any) => {
      const t = String(e.type).toLowerCase().trim();
      return t === 'ground' || t === 'grass' || t === 'tile' || t === 'dirt';
    });

    // Calculate world dimensions
    const maxGridY = Math.max(0, ...groundOrDirt.map((g: any) => g.gridY), ...entities.map((e: any) => e.gridY));
    const width = Math.max(
      1000,
      ...groundOrDirt.map((g: any) => (g.gridX + 2) * GRID.SIZE)
    );
    const height = Math.max(
      600,
      (maxGridY + 3) * GRID
    );
    // Convert grid Y to world Y (center of the grid cell)
    // Grid Y=0 is at the BOTTOM, Y increases upward
    const toY = (gridY: number) => height - (gridY * GRID) - (GRID / 2);

    const objects: LevelObject[] = [];

    const playerEnt = entities.find(
      (e: any) => String(e.type).toLowerCase().trim() === 'player'
    );
    const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
    // Player Y is just the center of their grid cell
    const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
    
    objects.push({
      id: 'player_1',
      type: LevelObjectType.Player,
      position: { x: playerX, y: playerY },
      physics: { type: PhysicsType.Dynamic },
    });

    entities.forEach((e: any, idx: number) => {
      const t = String(e.type).toLowerCase().trim();
      if (t === 'spring' || t === 'spike' || t === 'coin' || t === 'enemy' || t === 'lava') {
        // All entities use center-based positioning
        const x = e.gridX * GRID + GRID / 2;
        const y = toY(e.gridY);
        let levelType: LevelObjectType = LevelObjectType.Spring;
        let scale = undefined;
        let visual = undefined;
        
        if (t === 'spike') levelType = LevelObjectType.Spike;
        else if (t === 'coin') levelType = LevelObjectType.Coin;
        else if (t === 'enemy') levelType = LevelObjectType.Enemy;
        else if (t === 'lava') {
          levelType = LevelObjectType.Obstacle;
          scale = { x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH, y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT };
          visual = { texture: 'lava' };
        }
        
        const obj: any = { id: `${t}_${idx + 1}`, type: levelType, position: { x, y } };
        if (scale) obj.scale = scale;
        if (visual) obj.visual = visual;
        objects.push(obj);
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
          x: doorEnt.gridX * GRID.SIZE + GRID.SIZE / 2,
          y: toY(doorEnt.gridY),
        },
        visual: { texture: 'door' },
      });
    }

    groundOrDirt.forEach((g: any, i: number) => {
      const t = String(g.type).toLowerCase().trim();
      const texture = t === 'dirt' ? 'ground' : 'grass';
      objects.push({
        id: `platform_${i + 1}`,
        type: LevelObjectType.Platform,
        position: {
          x: g.gridX * GRID.SIZE + GRID.SIZE / 2,
          y: toY(g.gridY),
        },
        scale: {
          x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH,
          y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT,
        },
        physics: { type: PhysicsType.Static, isCollidable: true },
        visual: { texture },
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

    // Always build fresh level data from current editor entities for Play
    let levelData: LevelData | null = null;
    {
      const entities = scene.getAllEntities();
      const groundOrDirt = entities.filter((e: any) => {
        const t = String(e.type).toLowerCase().trim();
        return t === 'ground' || t === 'grass' || t === 'tile' || t === 'dirt';
      });
      const objects: LevelObject[] = [];

      // Calculate world dimensions
      const maxGridY = Math.max(0, ...groundOrDirt.map((g: any) => g.gridY), ...entities.map((e: any) => e.gridY));
      const width = Math.max(
        1000,
        ...groundOrDirt.map((g: any) => (g.gridX + 2) * GRID.SIZE)
      );
      const height = Math.max(
        600,
        (maxGridY + 3) * GRID
      );
      // Convert grid Y to world Y (center of the grid cell)
      // Grid Y=0 is at the BOTTOM, Y increases upward
      const toY = (gridY: number) => height - (gridY * GRID) - (GRID / 2);

      const playerEnt = entities.find(
        (e: any) => String(e.type).toLowerCase().trim() === 'player'
      );
      
      // Player Y is just the center of their grid cell
      const playerX = playerEnt ? playerEnt.gridX * GRID + GRID / 2 : 200;
      const playerY = playerEnt ? toY(playerEnt.gridY) : Math.max(200, height - 100);
      
      console.log(`[Create] Player at gridX=${playerEnt?.gridX}, gridY=${playerEnt?.gridY}, worldY=${playerY}, height=${height}`);
      
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
            x: doorEnt.gridX * GRID.SIZE + GRID.SIZE / 2,
            y: toY(doorEnt.gridY),
          },
          visual: { texture: 'door' },
        });
      }

      entities.forEach((e: any, idx: number) => {
        const t = String(e.type).toLowerCase().trim();
        if (t === 'spring' || t === 'spike' || t === 'coin' || t === 'enemy' || t === 'lava') {
          // All entities use center-based positioning
          const x = e.gridX * GRID + GRID / 2;
          const y = toY(e.gridY);
          let levelType: LevelObjectType = LevelObjectType.Spring;
          let scale = undefined;
          let visual = undefined;
          
          if (t === 'spike') levelType = LevelObjectType.Spike;
          else if (t === 'coin') levelType = LevelObjectType.Coin;
          else if (t === 'enemy') levelType = LevelObjectType.Enemy;
          else if (t === 'lava') {
            levelType = LevelObjectType.Obstacle;
            scale = { x: GRID / ENTITY_CONFIG.PLATFORM_WIDTH, y: GRID / ENTITY_CONFIG.PLATFORM_HEIGHT };
            visual = { texture: 'lava' };
          }
          
          const obj: any = { id: `${t}_${idx + 1}`, type: levelType, position: { x, y } };
          if (scale) obj.scale = scale;
          if (visual) obj.visual = visual;
          objects.push(obj);
        }
      });
      groundOrDirt.forEach((g: any, i: number) => {
        const t = String(g.type).toLowerCase().trim();
        const texture = t === 'dirt' ? 'ground' : 'grass';
        objects.push({
          id: `platform_${i + 1}`,
          type: LevelObjectType.Platform,
          position: {
            x: g.gridX * GRID.SIZE + GRID.SIZE / 2,
            y: toY(g.gridY),
          },
          scale: {
            x: GRID.SIZE / ENTITY_CONFIG.PLATFORM_WIDTH,
            y: GRID.SIZE / ENTITY_CONFIG.PLATFORM_HEIGHT,
          },
          physics: { type: PhysicsType.Static, isCollidable: true },
          visual: { texture },
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
console.log('[Create] handlePlay - objects count:', (Array.isArray(levelData.objects) ? levelData.objects : Object.values(levelData.objects).flat()).length);
const platforms = (Array.isArray(levelData.objects) ? levelData.objects : Object.values(levelData.objects).flat()).filter((o: any) => o.type === 'platform');
    console.log('[Create] handlePlay - platform objects:', platforms.length);

    setIsPlaying(true);
    
    // Stop CreateScene first
    scene.scene.stop(SCENE_KEYS.CREATE);
    
    // Restart PlayScene with new data (this will call init and create again)
console.log('[Create] Restarting PlayScene with', (Array.isArray(levelData.objects) ? levelData.objects : Object.values(levelData.objects).flat()).length, 'objects');
    scene.scene.start(SCENE_KEYS.PLAY, { useMapControls: false, levelData });
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
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className={
                dbStatus === 'ok' ? 'text-emerald-600' : dbStatus === 'error' ? 'text-rose-600' : 'text-gray-500'
              }>
                DB: {dbStatus.toUpperCase()}
              </span>
              <span className="text-gray-600">
                public {publicLevels.length}
                {userLevels.length ? ` / yours ${userLevels.length}` : ''}
              </span>
              <button
                onClick={refreshLevels}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
              >
                Refresh
              </button>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300"
              >
                ← Home
              </button>
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

      {/* DB error banner */}
      {dbStatus === 'error' && dbError && (
        <div className="absolute top-14 left-3 z-[60] px-3 py-2 rounded shadow text-sm font-medium bg-rose-600 text-white">
          DB error: {dbError}
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
