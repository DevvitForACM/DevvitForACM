/**
 * Status banners for displaying messages
 */

import type { SaveBanner } from '../types';

interface StatusBannerProps {
  saveBanner: SaveBanner | null;
  dbError: string | null;
}

export function StatusBanner({ saveBanner, dbError }: StatusBannerProps) {
  return (
    <>
      {/* DB error banner */}
      {dbError && (
        <div
          className="absolute top-14 left-3 z-[60] px-3 py-2 text-sm font-bold uppercase"
          style={{
            background: '#dc2626',
            border: 'none',
            boxShadow: 'inset 2px 2px 0 #ef4444, inset -2px -2px 0 #991b1b, 3px 3px 0 #7f1d1d',
            fontFamily: '"Courier New", monospace',
            textShadow: '2px 2px 0 #000',
            color: 'white',
          }}
        >
          ✗ DB ERROR: {dbError}
        </div>
      )}

      {/* Save/Publish banner */}
      {saveBanner && (
        <div
          className="absolute top-14 right-3 z-[60] px-3 py-2 text-sm font-bold uppercase"
          style={{
            background: saveBanner.status === 'success' ? '#10b981' : '#dc2626',
            border: 'none',
            boxShadow:
              saveBanner.status === 'success'
                ? 'inset 2px 2px 0 #34d399, inset -2px -2px 0 #059669, 3px 3px 0 #047857'
                : 'inset 2px 2px 0 #ef4444, inset -2px -2px 0 #991b1b, 3px 3px 0 #7f1d1d',
            fontFamily: '"Courier New", monospace',
            textShadow: '2px 2px 0 #000',
            color: 'white',
          }}
        >
          {saveBanner.status === 'success' ? '✓ ' : '✗ '}
          {saveBanner.message.toUpperCase()}
        </div>
      )}
    </>
  );
}

