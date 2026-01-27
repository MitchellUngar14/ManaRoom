'use client';

import { useGameStore } from '@/store/gameStore';
import { FancySquareButton } from './FancySquareButton';

// Component to display a single digit using cutout images
function LifeDigit({ digit, isLow }: { digit: string; isLow?: boolean }) {
  const cutoutImage = `/${digit}Cutout.png`;

  return (
    <div
      className="relative"
      style={{
        width: '20px',
        height: '28px',
      }}
    >
      {/* Glowing digit layer */}
      <div
        className="absolute inset-0"
        style={{
          background: isLow
            ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(180deg, var(--theme-accent) 0%, var(--theme-accent) 100%)',
          maskImage: `url(${cutoutImage})`,
          maskSize: '80% auto',
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '80% auto',
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          filter: isLow
            ? 'drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #dc2626)'
            : 'drop-shadow(0 0 4px var(--theme-accent)) drop-shadow(0 0 8px var(--theme-accent-glow))',
        } as React.CSSProperties}
      />

      {/* Bright core */}
      <div
        className="absolute inset-0"
        style={{
          background: 'white',
          mixBlendMode: 'overlay',
          maskImage: `url(${cutoutImage})`,
          maskSize: '80% auto',
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '80% auto',
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          opacity: 0.5,
        } as React.CSSProperties}
      />
    </div>
  );
}

// Component to display a full number using digit cutouts
function LifeDisplay({ value, isLow }: { value: number; isLow?: boolean }) {
  const digits = Math.abs(value).toString().split('');
  const isNegative = value < 0;

  return (
    <div className="flex items-center justify-center">
      {isNegative && (
        <span className="text-red-500 font-bold mr-0.5">-</span>
      )}
      {digits.map((digit, index) => (
        <LifeDigit key={index} digit={digit} isLow={isLow} />
      ))}
    </div>
  );
}

export function LifeCounter() {
  const { myId, players, setLife } = useGameStore();

  const myPlayer = myId ? players[myId] : null;
  const opponents = Object.values(players).filter((p) => p.odId !== myId);
  const opponent = opponents[0];

  if (!myPlayer) return null;

  const myLife = myPlayer.life ?? 40;
  const opponentLife = opponent?.life ?? 40;

  return (
    <div className="flex items-center gap-4">
      {/* Opponent life */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 max-w-[60px] truncate" title={opponent?.displayName}>
          {opponent?.displayName ?? 'Opponent'}
        </span>
        <LifeDisplay value={opponentLife} isLow={opponentLife <= 10} />
      </div>

      <span className="text-gray-600 text-sm">vs</span>

      {/* My life */}
      <div className="flex items-center gap-1">
        <FancySquareButton
          onClick={() => setLife(myLife - 1)}
          cutoutImage="/MinusCutout.png"
          title="Decrease life"
        />
        <LifeDisplay value={myLife} isLow={myLife <= 10} />
        <FancySquareButton
          onClick={() => setLife(myLife + 1)}
          cutoutImage="/PlusCutout.png"
          title="Increase life"
        />
        <span className="text-xs text-gray-400 max-w-[60px] truncate ml-1" title={myPlayer.displayName}>
          {myPlayer.displayName}
        </span>
      </div>
    </div>
  );
}
