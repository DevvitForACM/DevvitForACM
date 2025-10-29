/**
 * Entity palette toolbar at the bottom of the editor
 */

import type { EntityType } from '../constants';

interface EntityPaletteProps {
  entities: EntityType[];
  selectedEntity: string | null;
  hasPlayer: boolean;
  hasDoor: boolean;
  onSelect: (id: string) => void;
}

export function EntityPalette({
  entities,
  selectedEntity,
  hasPlayer,
  hasDoor,
  onSelect,
}: EntityPaletteProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t">
      <div className="overflow-x-auto">
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 min-h-[80px] sm:min-h-[100px]">
          {/* Eraser Button */}
          <button
            onClick={() => onSelect('eraser')}
            className={`
              flex flex-col items-center justify-center
              min-w-[60px] sm:min-w-[80px] h-[64px] sm:h-[80px]
              p-2 sm:p-3 rounded-lg border-2
              transition-all duration-200 flex-shrink-0
              relative z-10
              ${
                selectedEntity === 'eraser'
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm cursor-pointer'
              }
            `}
            style={{
              backgroundColor:
                selectedEntity === 'eraser' ? '#fee2e215' : 'white',
              pointerEvents: 'auto',
            }}
          >
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                color: selectedEntity === 'eraser' ? '#ef4444' : '#374151',
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <div className="text-[9px] sm:text-[10px] font-medium text-center text-gray-700 leading-tight pointer-events-none">
              Eraser
            </div>
          </button>

          {entities.map((entity) => {
            const disabled =
              (entity.id === 'player' && hasPlayer) ||
              (entity.id === 'door' && hasDoor);
            return (
              <button
                key={entity.id}
                onClick={() => !disabled && onSelect(entity.id)}
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
                    selectedEntity === entity.id ? `${entity.color}15` : 'white',
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
  );
}

