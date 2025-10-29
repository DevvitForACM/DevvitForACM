/**
 * Modal for naming and saving a level
 */

import { useState, useEffect, useRef } from 'react';

interface SaveLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (levelName: string, description?: string) => Promise<void>;
  existingLevels: string[];
  initialName?: string;
  initialDescription?: string;
}

export function SaveLevelModal({
  isOpen,
  onClose,
  onSave,
  existingLevels,
  initialName = '',
  initialDescription = '',
}: SaveLevelModalProps) {
  const [levelName, setLevelName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLevelName(initialName);
      setDescription(initialDescription);
      setError(null);
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName, initialDescription]);

  const validateLevelName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Level name is required';
    }
    if (name.length < 3) {
      return 'Level name must be at least 3 characters';
    }
    if (name.length > 50) {
      return 'Level name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return 'Level name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    if (existingLevels.includes(name.trim()) && name.trim() !== initialName) {
      return 'A level with this name already exists';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateLevelName(levelName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(levelName.trim(), description.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save level');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ fontFamily: '"Courier New", monospace' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-in fade-in duration-200"
        onClick={onClose}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Modal */}
      <div
        className="relative max-w-md w-full animate-in zoom-in-95 duration-200"
        style={{
          background: '#1f2937',
          border: '4px solid #000',
          boxShadow: 'inset 4px 4px 0 #374151, inset -4px -4px 0 #111827, 8px 8px 0 #000',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b-4 border-black"
          style={{ background: '#111827' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                background: '#3b82f6',
                boxShadow: 'inset 2px 2px 0 #60a5fa, inset -2px -2px 0 #1e40af, 2px 2px 0 #1e3a8a',
              }}
            >
              <span className="text-white text-xl">💾</span>
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-yellow-300 uppercase tracking-wider"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                SAVE LEVEL
              </h2>
              <p
                className="text-xs text-white uppercase"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                NAME YOUR CREATION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:brightness-110 transition-all active:translate-y-0.5"
            disabled={isSaving}
            style={{
              background: '#4b5563',
              boxShadow: 'inset 2px 2px 0 #6b7280, inset -2px -2px 0 #374151, 2px 2px 0 #1f2937',
            }}
          >
            <span className="text-white font-bold">✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Level Name Input */}
          <div>
            <label
              htmlFor="levelName"
              className="block text-xs sm:text-sm font-bold text-white uppercase mb-2"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              LEVEL NAME <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="levelName"
              type="text"
              value={levelName}
              onChange={(e) => {
                setLevelName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., LAVA TEMPLE, SKY GARDEN..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-500 focus:outline-none font-bold uppercase"
              style={{
                background: '#111827',
                border: error ? '3px solid #dc2626' : '3px solid #374151',
                boxShadow: error
                  ? 'inset 2px 2px 0 #7f1d1d, 2px 2px 0 #7f1d1d'
                  : 'inset 2px 2px 0 #1f2937, 2px 2px 0 #1f2937',
                fontFamily: '"Courier New", monospace',
              }}
              disabled={isSaving}
              maxLength={50}
            />
            {error && (
              <p
                className="mt-2 text-xs sm:text-sm text-red-400 flex items-center gap-1 font-bold uppercase"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                <span>✗</span>
                {error}
              </p>
            )}
            <p
              className="mt-1.5 text-xs text-gray-400 font-bold uppercase"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              {levelName.length}/50 CHARS
            </p>
          </div>

          {/* Description Input (Optional) */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs sm:text-sm font-bold text-white uppercase mb-2"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              DESCRIPTION <span className="text-gray-400">(OPTIONAL)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ADD A DESCRIPTION..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-white placeholder-gray-500 focus:outline-none resize-none font-bold uppercase"
              style={{
                background: '#111827',
                border: '3px solid #374151',
                boxShadow: 'inset 2px 2px 0 #1f2937, 2px 2px 0 #1f2937',
                fontFamily: '"Courier New", monospace',
              }}
              rows={3}
              disabled={isSaving}
              maxLength={200}
            />
            <p
              className="mt-1.5 text-xs text-gray-400 font-bold uppercase"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              {description.length}/200 CHARS
            </p>
          </div>

          {/* Info Box */}
          <div
            className="flex items-start gap-3 p-3 sm:p-4"
            style={{
              background: '#1e40af',
              border: '2px solid #1e3a8a',
              boxShadow: 'inset 2px 2px 0 #3b82f6, 2px 2px 0 #1e3a8a',
            }}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">ℹ️</span>
            <div className="text-xs sm:text-sm text-white">
              <p
                className="font-bold mb-1 uppercase"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                ABOUT SAVING
              </p>
              <p
                className="text-blue-100 uppercase font-bold"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                YOUR LEVEL WILL BE SAVED WITH A LEADERBOARD. TOP 5 COMPETE!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t-4 border-black"
          style={{ background: '#111827' }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white uppercase hover:brightness-110 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#4b5563',
              boxShadow: 'inset 2px 2px 0 #6b7280, inset -2px -2px 0 #374151, 2px 2px 0 #1f2937',
              textShadow: '1px 1px 0 #000',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !levelName.trim()}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white uppercase hover:brightness-110 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isSaving || !levelName.trim() ? '#4b5563' : '#10b981',
              boxShadow:
                isSaving || !levelName.trim()
                  ? 'inset 2px 2px 0 #6b7280, inset -2px -2px 0 #374151, 2px 2px 0 #1f2937'
                  : 'inset 2px 2px 0 #34d399, inset -2px -2px 0 #059669, 3px 3px 0 #047857',
              textShadow: '1px 1px 0 #000',
            }}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse">⏳</span>
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>SAVE LEVEL</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

