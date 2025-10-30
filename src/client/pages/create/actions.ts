import type { CreateScene } from '@/game/scenes/create-scene';
import { SCENE_KEYS } from '@/constants/game-constants';
import { buildLevelData } from './level-builder';
import { publishLevel, saveLevel } from './api-service';
import type { SaveBanner, SavedLevel } from './types';

export function handleEntitySelect(
  id: string,
  selectedEntity: string | null,
  scene: CreateScene | null,
  setSelectedEntity: (id: string | null) => void
) {
  const next = selectedEntity === id ? null : id;
  setSelectedEntity(next);
  if (scene) {
    scene.setSelectedEntityType(next);
    scene.registry.set('selectedEntityType', next);
  }
}

export function handleClearEntities(
  scene: CreateScene | null,
  setSelectedEntity: (id: string | null) => void
) {
  scene?.clearAllEntities();
  setSelectedEntity(null);
  if (scene) {
    scene.setSelectedEntityType(null);
    scene.registry.set('selectedEntityType', null);
  }
}

/**
 * Trigger the save level modal
 * This function just opens the modal - actual saving happens in the modal callback
 */
export function handleSaveLevel(
  scene: CreateScene | null,
  setIsSaveModalOpen: (open: boolean) => void
) {
  if (!scene) return;
  const entities = scene.getAllEntities();

  if (entities.length === 0) {
    console.warn('[Create] Cannot save empty level');
    return;
  }

  // Open the save modal
  setIsSaveModalOpen(true);
}

/**
 * Actual save logic that gets called from the modal
 */
export async function saveLevelWithName(
  scene: CreateScene | null,
  levelName: string,
  description: string | undefined,
  setSaveBanner: (banner: SaveBanner | null) => void
): Promise<SavedLevel> {
  if (!scene) throw new Error('Scene not found');

  const entities = scene.getAllEntities();
  console.info('[Create] Saving level with name:', levelName, 'entities:', entities.length);

  const levelData = buildLevelData(entities, {
    name: levelName,
    useGridPositions: true,
  });

  // Save to server with name and description
  const request: any = {
    name: levelName,
    levelData,
    isPublic: false, // Can be changed later with publish
  };
  if (description) {
    request.description = description;
  }
  const savedLevel = await saveLevel(request);

  // Also save to localStorage as backup
  try {
    const outStr = JSON.stringify(levelData);
    localStorage.setItem('editorLevelJSON', outStr);
    localStorage.setItem('lastSavedLevelName', levelName);
  } catch (e) {
    console.warn('[Create] LocalStorage save failed:', e);
  }

  console.info('[Create] Save OK ->', savedLevel);
  setSaveBanner({
    status: 'success',
    message: `Level "${levelName}" saved successfully!`,
  });
  setTimeout(() => setSaveBanner(null), 3000);

  return savedLevel;
}

export async function handlePublishLevel(
  scene: CreateScene | null,
  setIsPublishing: (val: boolean) => void,
  setSaveBanner: (banner: SaveBanner | null) => void
) {
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
}

export function handlePlayLevel(
  scene: CreateScene | null,
  setIsPlaying: (val: boolean) => void
) {
  if (!scene) return;

  const currentEntities = scene.getAllEntities();
  const levelData = buildLevelData(currentEntities);

  console.log('[Create] Starting play mode with', currentEntities.length, 'entities');
  setIsPlaying(true);
  
  // Pause CreateScene instead of stopping it (preserves state)
  scene.scene.pause(SCENE_KEYS.CREATE);
  
  // Stop PlayScene if it's already running (from previous play)
  if (scene.scene.isActive(SCENE_KEYS.PLAY)) {
    console.log('[Create] PlayScene already active, stopping it first');
    scene.scene.stop(SCENE_KEYS.PLAY);
  }
  
  // Start PlayScene with level data
  scene.scene.start(SCENE_KEYS.PLAY, { useMapControls: false, levelData });
}

export function handleReturnToEditor(
  scene: CreateScene | null,
  setIsPlaying: (val: boolean) => void,
  setEntityCount: (count: number) => void
) {
  if (!scene) return;

  console.log('[Create] Returning to editor');
  setIsPlaying(false);

  // Stop PlayScene - this will trigger its shutdown() method which handles cleanup
  if (scene.scene.isActive(SCENE_KEYS.PLAY)) {
    console.log('[Create] Stopping PlayScene');
    scene.scene.stop(SCENE_KEYS.PLAY);
  }

  // Resume CreateScene - it was paused, so just resume it
  if (scene.scene.isPaused(SCENE_KEYS.CREATE)) {
    console.log('[Create] Resuming CreateScene');
    scene.scene.resume(SCENE_KEYS.CREATE);
    
    // Wait a frame for scene to be fully resumed
    scene.time.delayedCall(10, () => {
      console.log('[Create] Scene resumed, re-enabling input and updating state');
      
      // Re-enable input (defensive, should already be enabled)
      if (scene.input) {
        scene.input.enabled = true;
      }
      
      // Reset camera speeds
      scene.cameraScrollSpeed = 0;
      scene.cameraScrollSpeedY = 0;
      
      // Update entity count to reflect current state
      const currentCount = scene.getAllEntities().length;
      console.log('[Create] Current entity count:', currentCount);
      setEntityCount(currentCount);
    });
  } else if (!scene.scene.isActive(SCENE_KEYS.CREATE)) {
    // If CreateScene isn't active (shouldn't happen), start it
    console.warn('[Create] CreateScene not active, restarting');
    scene.scene.start(SCENE_KEYS.CREATE);
  } else {
    console.log('[Create] CreateScene already active and not paused');
    // Update entity count anyway
    setEntityCount(scene.getAllEntities().length);
  }
}

