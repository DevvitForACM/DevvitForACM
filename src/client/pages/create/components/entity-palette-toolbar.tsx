import type { EntityType } from '../constants';

interface EntityPaletteToolbarProps {
  entities: EntityType[];
  selectedEntity: string | null;
  hasPlayer: boolean;
  hasDoor: boolean;
  entityCount: number;
  onSelect: (id: string) => void;
}

export function EntityPaletteToolbar({
  entities,
  selectedEntity,
  hasPlayer,
  hasDoor,
  entityCount,
  onSelect,
}: EntityPaletteToolbarProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 bg-gray-900 shadow-2xl"
      style={{
        borderTop: '4px solid #000',
        fontFamily: '"Courier New", monospace',
        imageRendering: 'pixelated',
      }}
    >
      {/* Toolbar Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2 border-b-2 border-black"
        style={{ background: '#1f2937' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="text-xs sm:text-sm font-bold text-yellow-300 uppercase tracking-wider"
            style={{ textShadow: '2px 2px 0 #000' }}
          >
            ⚡ ENTITY PALETTE
          </span>
          <span
            className="hidden md:inline text-xs font-bold text-white px-2 py-0.5"
            style={{
              background: '#3b82f6',
              boxShadow: 'inset 1px 1px 0 #60a5fa, 1px 1px 0 #1e40af',
              textShadow: '1px 1px 0 #000',
            }}
          >
            {entityCount} PLACED
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase text-white">
          <span style={{ textShadow: '1px 1px 0 #000' }}>CLICK=PLACE</span>
          <span className="text-gray-500">|</span>
          <span style={{ textShadow: '1px 1px 0 #000' }}>R-CLICK=REMOVE</span>
        </div>
      </div>

      {/* Entity Buttons - Scrollable */}
      <div className="overflow-x-auto overflow-y-hidden" style={{ background: '#111827' }}>
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 min-w-max">
          {entities.map((entity) => {
            const disabled =
              (entity.id === 'player' && hasPlayer) ||
              (entity.id === 'door' && hasDoor);
            const isSelected = selectedEntity === entity.id;

            return (
              <button
                key={entity.id}
                onClick={() => !disabled && onSelect(entity.id)}
                disabled={disabled}
                className={`
                  group relative flex flex-col items-center justify-center
                  w-[70px] sm:w-[90px] h-[80px] sm:h-[100px]
                  transition-all duration-100 flex-shrink-0
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-1'}
                `}
                style={{
                  background: isSelected
                    ? '#3b82f6'
                    : disabled
                      ? '#374151'
                      : '#4b5563',
                  border: 'none',
                  boxShadow: isSelected
                    ? 'inset 3px 3px 0 #60a5fa, inset -3px -3px 0 #1e40af, 3px 3px 0 #1e3a8a'
                    : disabled
                      ? 'inset 2px 2px 0 #4b5563, inset -2px -2px 0 #1f2937, 2px 2px 0 #111827'
                      : 'inset 2px 2px 0 #6b7280, inset -2px -2px 0 #374151, 2px 2px 0 #1f2937',
                  imageRendering: 'pixelated',
                }}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center z-10"
                    style={{
                      background: '#fbbf24',
                      boxShadow: 'inset 2px 2px 0 #fcd34d, inset -2px -2px 0 #f59e0b, 2px 2px 0 #d97706',
                    }}
                  >
                    <span className="text-white text-xs sm:text-sm font-bold">✓</span>
                  </div>
                )}

                {/* Entity Image */}
                <div className="flex items-center justify-center w-full h-12 sm:h-14 mb-1">
                  {entity.image ? (
                    <img
                      src={entity.image}
                      alt={entity.name}
                      className={`max-w-[40px] sm:max-w-[48px] max-h-full object-contain ${disabled ? 'grayscale' : ''}`}
                      style={{
                        imageRendering: 'pixelated',
                        filter: isSelected ? 'brightness(1.2) contrast(1.2)' : 'brightness(1)',
                      }}
                    />
                  ) : (
                    <span className={`text-2xl sm:text-3xl ${disabled ? 'grayscale' : ''}`}>
                      {entity.icon}
                    </span>
                  )}
                </div>

                {/* Entity Name */}
                <div
                  className={`text-[10px] sm:text-xs font-bold text-center leading-tight px-1 uppercase tracking-wide ${
                    isSelected ? 'text-white' : disabled ? 'text-gray-500' : 'text-gray-300'
                  }`}
                  style={{ textShadow: '1px 1px 0 #000' }}
                >
                  {entity.name}
                </div>

                {/* Disabled Overlay */}
                {disabled && (
                  <div
                    className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-white text-lg">✓</span>
                      <span
                        className="text-[9px] font-bold text-white uppercase"
                        style={{ textShadow: '1px 1px 0 #000' }}
                      >
                        SET
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar Footer */}
      <div
        className="px-3 sm:px-4 py-1.5 sm:py-2 border-t-2 border-black"
        style={{ background: '#1f2937' }}
      >
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase">
          <div className="flex items-center gap-2 text-white">
            <span style={{ textShadow: '1px 1px 0 #000' }}>SELECTED:</span>
            <span className="text-yellow-300" style={{ textShadow: '1px 1px 0 #000' }}>
              {selectedEntity ? entities.find(e => e.id === selectedEntity)?.name.toUpperCase() : 'NONE'}
            </span>
          </div>
          <div className="text-white">
            <span className="hidden sm:inline" style={{ textShadow: '1px 1px 0 #000' }}>TOTAL: </span>
            <span className="text-yellow-300" style={{ textShadow: '1px 1px 0 #000' }}>
              {entityCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

