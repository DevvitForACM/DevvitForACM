/**
 * Custom hooks for create scene management
 */

import { useState, useEffect } from 'react';
import { CreateScene } from '@/game/scenes/create-scene';
import type { EntityTypeData } from './constants';

/**
 * Hook to get and manage the CreateScene instance
 */
export function useCreateScene(
  entityTypesData: Record<string, EntityTypeData>,
  selectedEntity: string | null
) {
  const [scene, setScene] = useState<CreateScene | null>(null);
  const [entityCount, setEntityCount] = useState(0);

  useEffect(() => {
    const check = setInterval(() => {
      const game = (window as any).game;
      if (game) {
        const s = game.scene.getScene('CreateScene') as CreateScene;
        if (s && s.scene.isActive('CreateScene')) {
          setScene(s);

          s.registry.set('entityTypes', entityTypesData);

          if (selectedEntity) {
            console.debug(
              '[Create] scene attached: applying existing selection ->',
              selectedEntity
            );
            s.registry.set('selectedEntityType', selectedEntity);
            s.setSelectedEntityType(selectedEntity);
          }

          // Remove old listeners before adding new ones (defensive)
          s.events.off('entity-placed');
          s.events.off('entity-removed');
          s.events.off('entities-cleared');
          
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
  }, [entityTypesData, selectedEntity]);

  // Re-establish event listeners when scene changes state
  useEffect(() => {
    if (!scene) return;

    const handleWake = () => {
      console.log('[Create Hook] Scene woke, re-establishing listeners');
      // Remove old listeners
      scene.events.off('entity-placed');
      scene.events.off('entity-removed');
      scene.events.off('entities-cleared');
      
      // Add new listeners
      scene.events.on('entity-placed', () =>
        setEntityCount(scene.getAllEntities().length)
      );
      scene.events.on('entity-removed', () =>
        setEntityCount(scene.getAllEntities().length)
      );
      scene.events.on('entities-cleared', () => setEntityCount(0));
      
      // Update entity count
      setEntityCount(scene.getAllEntities().length);
    };

    scene.events.on('wake', handleWake);

    return () => {
      scene.events.off('wake', handleWake);
    };
  }, [scene]);

  return { scene, entityCount, setEntityCount };
}

/**
 * Hook to check if a specific entity type exists in the scene
 */
export function useHasEntity(scene: CreateScene | null, entityType: string, entityCount: number): boolean {
  if (!scene) return false;
  return scene
    .getAllEntities()
    .some((e: any) => String(e.type).toLowerCase().trim() === entityType);
}

