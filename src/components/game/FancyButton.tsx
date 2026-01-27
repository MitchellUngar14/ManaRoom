'use client';

interface FancyButtonProps {
  onClick: () => void;
  cutoutImage: string;
  title?: string;
  className?: string;
}

export function FancyButton({
  onClick,
  cutoutImage,
  title,
  className = '',
}: FancyButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`fancy-button group relative cursor-pointer ${className}`}
      style={{
        width: '140px',
        height: '36px',
      }}
    >
      {/* Button frame - base layer */}
      <div
        className="absolute inset-0 transition-all duration-200 group-hover:brightness-125 group-active:brightness-90"
        style={{
          backgroundImage: 'url(/BlankButton.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
        }}
      />

      {/* Glowing text layer - masked to only show where text is */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: `linear-gradient(180deg, var(--theme-accent) 0%, var(--theme-accent) 100%)`,
          maskImage: `url(${cutoutImage})`,
          maskSize: '60% auto',
          maskPosition: 'center calc(50% + 3px)',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '60% auto',
          WebkitMaskPosition: 'center calc(50% + 3px)',
          WebkitMaskRepeat: 'no-repeat',
          filter: 'drop-shadow(0 0 6px var(--theme-accent)) drop-shadow(0 0 12px var(--theme-accent)) drop-shadow(0 0 20px var(--theme-accent-glow))',
        } as React.CSSProperties}
      />

      {/* Bright core of the text */}
      <div
        className="absolute inset-0"
        style={{
          background: 'white',
          mixBlendMode: 'overlay',
          maskImage: `url(${cutoutImage})`,
          maskSize: '60% auto',
          maskPosition: 'center calc(50% + 3px)',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '60% auto',
          WebkitMaskPosition: 'center calc(50% + 3px)',
          WebkitMaskRepeat: 'no-repeat',
          opacity: 0.5,
        } as React.CSSProperties}
      />

      {/* Animated pulse glow */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: `var(--theme-accent)`,
          maskImage: `url(${cutoutImage})`,
          maskSize: '60% auto',
          maskPosition: 'center calc(50% + 3px)',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '60% auto',
          WebkitMaskPosition: 'center calc(50% + 3px)',
          WebkitMaskRepeat: 'no-repeat',
          filter: 'blur(6px) drop-shadow(0 0 15px var(--theme-accent))',
          opacity: 0.6,
        } as React.CSSProperties}
      />

      {/* Extra glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `var(--theme-accent)`,
          maskImage: `url(${cutoutImage})`,
          maskSize: '60% auto',
          maskPosition: 'center calc(50% + 3px)',
          maskRepeat: 'no-repeat',
          maskMode: 'luminance',
          WebkitMaskImage: `url(${cutoutImage})`,
          WebkitMaskSize: '60% auto',
          WebkitMaskPosition: 'center calc(50% + 3px)',
          WebkitMaskRepeat: 'no-repeat',
          filter: 'blur(8px) drop-shadow(0 0 20px var(--theme-accent)) drop-shadow(0 0 40px var(--theme-accent))',
        } as React.CSSProperties}
      />
    </button>
  );
}
