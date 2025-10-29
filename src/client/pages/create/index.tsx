import { useState, useEffect, useMemo } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';
import { VirtualJoystick } from '@/components/virtual-joystick';
import { useRouting } from '@/components/routing';

import { ENTITY_TYPES_DATA, ENTITY_TYPES } from './constants';
import { isMobileDevice } from './utils';
import { fetchLevels } from './api-service';
import { useCreateScene, useHasEntity } from './hooks';
import type { SaveBanner, DbStatus, LevelListItem } from './types';

import {
  handleEntitySelect,
  handleClearEntities,
  handleSaveLevel,
  saveLevelWithName,
  handlePublishLevel,
  handlePlayLevel,
  handleReturnToEditor,
} from './actions';
import { handleJoystickMove, handleJump } from './handlers';

import {
  TopToolbar,
  PlayToolbar,
  EntityPaletteToolbar,
  StatusBanner,
  WelcomeOverlay,
  SaveLevelModal,
  LeaderboardModal,
} from './components';

export default function Create() {
  const { navigate } = useRouting();

  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveBanner, setSaveBanner] = useState<SaveBanner | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [dbStatus, setDbStatus] = useState<DbStatus>('idle');
  const [publicLevels, setPublicLevels] = useState<LevelListItem[]>([]);
  const [userLevels, setUserLevels] = useState<LevelListItem[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);

  // Leaderboard modal state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardEntries] = useState<any[]>([]); // Will be fetched when modal opens

  const config = useMemo(() => createBlankCanvasConfig('#f6f7f8'), []);

  const { scene, entityCount, setEntityCount } = useCreateScene(
    ENTITY_TYPES_DATA,
              selectedEntity
            );

  const hasPlayer = useHasEntity(scene, 'player', entityCount);
  const hasDoor = useHasEntity(scene, 'door', entityCount);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (!scene) return;
    scene.registry.set('selectedEntityType', selectedEntity ?? null);
    scene.setSelectedEntityType(selectedEntity ?? null);
  }, [scene, selectedEntity]);

  useEffect(() => {
    refreshLevels();
  }, []);

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

  const handleSaveLevelWithModal = async (
    levelName: string,
    description?: string
  ) => {
    try {
      const savedLevel = await saveLevelWithName(
        scene,
        levelName,
        description,
        setSaveBanner
      );
      setCurrentLevelId(savedLevel.id);
      await refreshLevels();
    } catch (error) {
      console.error('[Create] Save failed:', error);
      setSaveBanner({ 
        status: 'error', 
        message:
          error instanceof Error ? error.message : 'Failed to save level',
      });
      setTimeout(() => setSaveBanner(null), 3000);
      throw error;
    }
  };

  const existingLevelNames = [
    ...publicLevels.map((l) => l.name || l.id),
    ...userLevels.map((l) => l.name || l.id),
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-800">
      <div
        className={`absolute top-[64px] left-0 right-0 z-0 ${isPlaying ? 'bottom-0' : 'bottom-[140px] sm:bottom-[160px]'}`}
      >
        <PhaserContainer config={config} />
      </div>

      {isPlaying && isMobile && (
        <VirtualJoystick
          onMove={handleJoystickMove}
          onJump={handleJump}
          size={120}
        />
      )}

      {!isPlaying && (
        <TopToolbar
          entityCount={entityCount}
          dbStatus={dbStatus}
          publicLevels={publicLevels}
          userLevels={userLevels}
          isPublishing={isPublishing}
          onHome={() => navigate('/')}
          onClear={() => handleClearEntities(scene, setSelectedEntity)}
          onSave={() => handleSaveLevel(scene, setIsSaveModalOpen)}
          onPublish={() =>
            handlePublishLevel(scene, setIsPublishing, setSaveBanner)
          }
          onPlay={() => handlePlayLevel(scene, setIsPlaying)}
          onRefreshLevels={refreshLevels}
          {...(currentLevelId && {
            onViewLeaderboard: () => setIsLeaderboardOpen(true),
          })}
        />
      )}

      {isPlaying && (
        <PlayToolbar
          onReturnToEditor={() =>
            handleReturnToEditor(
              scene,
              setIsPlaying,
              setEntityCount
            )
          }
        />
      )}

      <StatusBanner saveBanner={saveBanner} dbError={dbError} />

      {!isPlaying && (
        <EntityPaletteToolbar
          entities={ENTITY_TYPES}
          selectedEntity={selectedEntity}
          hasPlayer={hasPlayer}
          hasDoor={hasDoor}
          entityCount={entityCount}
          onSelect={(id) => handleEntitySelect(id, selectedEntity, scene, setSelectedEntity)}
        />
      )}

      <WelcomeOverlay show={!isPlaying && entityCount === 0 && !selectedEntity} />

      {/* Save Level Modal */}
      <SaveLevelModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveLevelWithModal}
        existingLevels={existingLevelNames}
      />

      {/* Leaderboard Modal */}
      {currentLevelId && (
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          levelName={userLevels.find((l) => l.id === currentLevelId)?.name || 'Level'}
          entries={leaderboardEntries}
        />
      )}
    </div>
  );
}
