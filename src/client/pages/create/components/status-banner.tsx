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
        <div className="absolute top-14 left-3 z-[60] px-3 py-2 rounded shadow text-sm font-medium bg-rose-600 text-white">
          DB error: {dbError}
        </div>
      )}

      {/* Save/Publish banner */}
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
    </>
  );
}

