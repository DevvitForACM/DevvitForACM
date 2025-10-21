import { useState, useEffect, useMemo } from 'react';
import PhaserContainer from '@/components/phaser-container';
import { createBlankCanvasConfig } from '@/config/game-config';
import { CreateScene } from '@/game/scenes/create-scene';

const ENTITY_TYPES_DATA = {
  enemy: { name: 'Enemy', icon: '👾', color: '#ef4444' },
  spike: { name: 'Spike', icon: '⚠️', color: '#6b7280' },
  spring: { name: 'Spring', icon: '🔄', color: '#10b981' },
  ground: { name: 'Ground', icon: '🟫', color: '#78716c' },
  lava: { name: 'Lava', icon: '🔥', color: '#f97316' },
  coin: { name: 'Coin', icon: '💰', color: '#eab308' },
  door: { name: 'Door', icon: '🚪', color: '#8b5cf6' },
};

const ENTITY_TYPES = [
  { id: 'enemy', name: 'Enemy', icon: '👾', color: '#ef4444' },
  { id: 'spike', name: 'Spike', icon: '⚠️', color: '#6b7280' },
  { id: 'spring', name: 'Spring', icon: '🔄', color: '#10b981' },
  { id: 'ground', name: 'Ground', icon: '🟫', color: '#78716c' },
  { id: 'lava', name: 'Lava', icon: '🔥', color: '#f97316' },
  { id: 'coin', name: 'Coin', icon: '💰', color: '#eab308' },
  { id: 'door', name: 'Door', icon: '🚪', color: '#8b5cf6' },
];

export default function Create() {
  const [scene, setScene] = useState<CreateScene | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [entityCount, setEntityCount] = useState(0);

  // IMPORTANT: Keep Phaser game config stable to avoid destroying/recreating the scene on React re-renders
  const config = useMemo(() => createBlankCanvasConfig('#f6f7f8'), []);

  useEffect(() => {
    const check = setInterval(() => {
      const game = (window as any).game;
      if (game) {
        const s = game.scene.getScene('CreateScene') as CreateScene;
        if (s) {
          setScene(s);
          // Provide entity types for the scene
          s.registry.set('entityTypes', ENTITY_TYPES_DATA);
          // If a selection already exists in UI, mirror it into scene now
          if (selectedEntity) {
            // eslint-disable-next-line no-console
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
    // Toggle selection: clicking the active item deselects it
    const next = selectedEntity === id ? null : id;
    setSelectedEntity(next);
    if (scene) {
      // eslint-disable-next-line no-console
      console.debug('[Create] handleSelect ->', next);
      scene.setSelectedEntityType(next);
      scene.registry.set('selectedEntityType', next);
    }
  };

  // Ensure selection is synced once scene becomes available or when selection changes
  useEffect(() => {
    if (!scene) return;
    // eslint-disable-next-line no-console
    console.debug('[Create] syncing selection to scene (effect) ->', selectedEntity);
    scene.registry.set('selectedEntityType', selectedEntity ?? null);
    scene.setSelectedEntityType(selectedEntity ?? null);
  }, [scene, selectedEntity]);

  const handleClear = () => {
    // Unconditional clear for reliability
    scene?.clearAllEntities();
    // Also clear current selection in both UI and scene registry
    setSelectedEntity(null);
    if (scene) {
      scene.setSelectedEntityType(null);
      scene.registry.set('selectedEntityType', null);
    }
  };

  const handleSave = () => {
    const entities = scene?.getAllEntities() || [];
    alert(`Saved ${entities.length} entities!`);
  };

  const handlePlay = () => {
    alert('Play (not implemented)');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Phaser Canvas */}
      <div className="absolute inset-0 z-0">
        <PhaserContainer config={config} />
      </div>

      {/* Top Bar */}
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
              onClick={handlePlay}
              className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 text-xs sm:text-sm text-white rounded font-medium"
            >
              Play
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Toolbox */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t">
        <div className="overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 min-h-[80px] sm:min-h-[100px]">
            {ENTITY_TYPES.map((entity) => (
              <button
                key={entity.id}
                onClick={() => handleSelect(entity.id)}
                className={`
                  flex flex-col items-center justify-center
                  min-w-[60px] sm:min-w-[80px] h-[64px] sm:h-[80px]
                  p-2 sm:p-3 rounded-lg border-2
                  transition-all duration-200 cursor-pointer flex-shrink-0
                  relative z-10
                  ${
                    selectedEntity === entity.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
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
            ))}
          </div>
        </div>
      </div>

      {/* Helper */}
      {entityCount === 0 && !selectedEntity && (
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
