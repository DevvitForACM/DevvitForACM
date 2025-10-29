/**
 * Level Editor Page
 * Main entry point for the level creation interface
 */

import { useState, useEffect, useMemo } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';
import { SCENE_KEYS, GRID } from '@/constants/game-constants';
import { VirtualJoystick } from '@/components/virtual-joystick';
import { useRouting } from '@/components/routing';

// Local imports
import { ENTITY_TYPES_DATA, ENTITY_TYPES } from './constants';
import { isMobileDevice } from './utils';
import { buildLevelData } from './level-builder';
import { fetchLevels, publishLevel } from './api-service';
import { useCreateScene, useHasEntity } from './hooks';
import type { SaveBanner, DbStatus, LevelListItem } from './types';

// Components
import { TopToolbar } from './components/top-toolbar';
import { PlayToolbar } from './components/play-toolbar';
import { EntityPalette } from './components/entity-palette';
import { StatusBanner } from './components/status-banner';
import { WelcomeOverlay } from './components/welcome-overlay';

export default function Create() {
  const { navigate } = useRouting();

  // State management
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedEntities, setSavedEntities] = useState<any[]>([]);
  const [saveBanner, setSaveBanner] = useState<SaveBanner | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Database state
  const [dbStatus, setDbStatus] = useState<DbStatus>('idle');
  const [publicLevels, setPublicLevels] = useState<LevelListItem[]>([]);
  const [userLevels, setUserLevels] = useState<LevelListItem[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  const config = useMemo(() => createBlankCanvasConfig('#f6f7f8'), []);

  // Custom hooks
  const { scene, entityCount, setEntityCount } = useCreateScene(
    ENTITY_TYPES_DATA,
    selectedEntity
  );

  const hasPlayer = useHasEntity(scene, 'player', entityCount);
  const hasDoor = useHasEntity(scene, 'door', entityCount);

  // Check for mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Sync selected entity with scene
  useEffect(() => {
    if (!scene) return;
    scene.registry.set('selectedEntityType', selectedEntity ?? null);
    scene.setSelectedEntityType(selectedEntity ?? null);
  }, [scene, selectedEntity]);

  // Fetch levels on mount
  useEffect(() => {
    refreshLevels();
  }, []);

  // === API OPERATIONS ===

  const refreshLevels = async () => {
    try {
      setDbStatus('loading');
      setDbError(null);
      const { publicLevels: pub, userLevels: user } = await fetchLevels();
      setPublicLevels(pub);
      setUserLevels(user);
      setDbStatus('ok');
    } catch (e: any) {
      console.error('[Create][DB] Fetch failed:', e);
      setDbError(e?.message || 'Failed to fetch levels');
      setDbStatus('error');
    }
  };

  // === EDITOR ACTIONS ===

  const handleSelect = (id: string) => {
    const next = selectedEntity === id ? null : id;
    setSelectedEntity(next);
    if (scene) {
      scene.setSelectedEntityType(next);
      scene.registry.set('selectedEntityType', next);
    }
  };

  const handleClear = () => {
    scene?.clearAllEntities();
    setSelectedEntity(null);
    if (scene) {
      scene.setSelectedEntityType(null);
      scene.registry.set('selectedEntityType', null);
    }
  };

  const handleSave = () => {
    if (!scene) return;
    const entities = scene.getAllEntities();

    console.info('[Create] Saving level… entities:', entities.length);

    try {
      const levelData = buildLevelData(entities);
      const outStr = JSON.stringify(levelData);
      localStorage.setItem('editorLevelJSON', outStr);
      const bytes = outStr.length;
      const objectsArray = Array.isArray(levelData.objects) ? levelData.objects : Object.values(levelData.objects).flat();
      const msg = `Saved level.json (${objectsArray.length} objects, ${bytes} bytes)`;

      console.info('[Create] Save OK ->', {
        bytes,
        objects: objectsArray.length,
        bounds: levelData.settings.bounds,
      });
      setSaveBanner({ status: 'success', message: msg });
      setTimeout(() => setSaveBanner(null), 2500);

      // Download the file
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

  const handlePublish = async () => {
    if (!scene) return;

    setIsPublishing(true);
    const entities = scene.getAllEntities();

    try {
      const levelData = buildLevelData(entities, {
        name: 'Editor Level',
        isPublic: true,
        useGridPositions: true,
      });

      const result = await publishLevel(levelData);

      console.info('[Create] Level published successfully:', result);

      setSaveBanner({
        status: 'success',
        message: `Level published! ID: ${result.id}`,
      });
      setTimeout(() => setSaveBanner(null), 3000);
    } catch (error) {
      console.error('[Create] Publish failed:', error);
      setSaveBanner({
        status: 'error',
        message: `Publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setTimeout(() => setSaveBanner(null), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePlay = () => {
    if (!scene) return;

    const currentEntities = scene.getAllEntities();
    setSavedEntities(currentEntities);

    const levelData = buildLevelData(currentEntities);

    setIsPlaying(true);
    scene.scene.stop(SCENE_KEYS.CREATE);
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
        const createScene = game.scene.getScene('CreateScene');
        if (createScene) {
          createScene.events.removeAllListeners();
          createScene.registry.set('entityTypes', ENTITY_TYPES_DATA);

          // Reset camera to show gridY=0 near bottom
          if (createScene.cameras?.main) {
            const cam = createScene.cameras.main;
            cam.scrollX = 0;
            cam.scrollY = -(cam.height - GRID.SIZE * 2);
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

  // === MOBILE CONTROLS ===

  const handleJoystickMove = (x: number, y: number) => {
    const game = (window as any).game;
    if (game) {
      const scene = game.scene.getScene(SCENE_KEYS.PLAY);
      if (scene && typeof scene.setMobileJoystick === 'function') {
        scene.setMobileJoystick(x, y);
      }
    }
  };

  const handleJump = () => {
    const game = (window as any).game;
    if (game) {
      const scene = game.scene.getScene(SCENE_KEYS.PLAY);
      if (scene && typeof scene.setMobileJump === 'function') {
        scene.setMobileJump(true);
      }
    }
  };

  // === RENDER ===

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Phaser Canvas */}
      <div
        className={`absolute top-[64px] left-0 right-0 z-0 ${isPlaying ? 'bottom-0' : 'bottom-[100px]'}`}
      >
        <PhaserContainer config={config} />
      </div>

      {/* Mobile controls for play mode */}
      {isPlaying && isMobile && (
        <VirtualJoystick
          onMove={handleJoystickMove}
          onJump={handleJump}
          size={120}
        />
      )}

      {/* Top Bar - Editor Mode */}
      {!isPlaying && (
        <TopToolbar
          entityCount={entityCount}
          dbStatus={dbStatus}
          publicLevels={publicLevels}
          userLevels={userLevels}
          isPublishing={isPublishing}
          onHome={() => navigate('/')}
          onClear={handleClear}
          onSave={handleSave}
          onPublish={handlePublish}
          onPlay={handlePlay}
          onRefreshLevels={refreshLevels}
        />
      )}

      {/* Return to Editor Button - Play Mode */}
      {isPlaying && <PlayToolbar onReturnToEditor={handleReturnToEditor} />}

      {/* Status Banners */}
      <StatusBanner saveBanner={saveBanner} dbError={dbError} />

      {/* Bottom Toolbox - Editor Mode Only */}
      {!isPlaying && (
        <EntityPalette
          entities={ENTITY_TYPES}
          selectedEntity={selectedEntity}
          hasPlayer={hasPlayer}
          hasDoor={hasDoor}
          onSelect={handleSelect}
        />
      )}

      {/* Welcome Helper - Editor Mode Only */}
      <WelcomeOverlay show={!isPlaying && entityCount === 0 && !selectedEntity} />
    </div>
  );
}
