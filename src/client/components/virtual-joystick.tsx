import { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void; // x and y are normalized -1 to 1
  onJump?: () => void;
  size?: number;
}

export function VirtualJoystick({ onMove, onJump, size = 120 }: VirtualJoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch && touchIdRef.current === null) {
        touchIdRef.current = touch.identifier;
        setIsActive(true);
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current === null) return;
      
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          updatePosition(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current === null) return;

      let touchEnded = true;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          touchEnded = false;
          break;
        }
      }

      if (touchEnded) {
        touchIdRef.current = null;
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let deltaX = clientX - centerX;
      let deltaY = clientY - centerY;
      
      const maxDistance = size / 2 - 10;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
      }
      
      setPosition({ x: deltaX, y: deltaY });
      
      // Normalize to -1 to 1
      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;
      onMove(normalizedX, normalizedY);
    };

    joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      joystick.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove, size]);

  return (
    <div className="fixed bottom-8 left-8 flex items-center gap-4 z-50 pointer-events-auto">
      {/* Joystick */}
      <div
        ref={joystickRef}
        className="relative flex items-center justify-center touch-none select-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {/* Outer circle */}
        <div
          className="absolute rounded-full border-4 border-white/40 bg-black/30"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
        
        {/* Inner knob */}
        <div
          className={`absolute rounded-full bg-white/80 transition-all ${
            isActive ? 'scale-110' : 'scale-100'
          }`}
          style={{
            width: `${size * 0.5}px`,
            height: `${size * 0.5}px`,
            transform: `translate(${position.x}px, ${position.y}px)`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        />
      </div>

      {/* Jump Button */}
      {onJump && (
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onJump();
          }}
          className="w-20 h-20 rounded-full bg-green-500/80 border-4 border-white/40 flex items-center justify-center text-white font-bold text-lg active:scale-95 transition-transform touch-none select-none shadow-lg"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          Jump
        </button>
      )}
    </div>
  );
}

