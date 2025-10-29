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
        if (s) {
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

